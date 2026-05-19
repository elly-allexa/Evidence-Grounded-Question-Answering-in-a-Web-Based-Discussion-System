import {
  HttpException,
  HttpStatus,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { GroqProvider } from './providers/groq.provider';
import { RetrievalService } from 'src/retrieval/retrieval.service';
import { GroundedAiAnswer } from './types/grounded-answer.types';
import { APP_LIMITS } from 'src/common/config/limits';

const DEFAULT_AI_AUTHOR_EMAIL = 'demo@freemem.local';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groqProvider: GroqProvider,
    private readonly retrievalService: RetrievalService,
  ) {}

  private async getDemoAuthor(demoUserEmail?: string) {
    const authorEmail = demoUserEmail ?? process.env.DEMO_USER_EMAIL ?? DEFAULT_AI_AUTHOR_EMAIL;

    const author = await this.prisma.user.findUnique({
      where: { email: authorEmail },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!author) {
      throw new NotFoundException(
        `Demo user not found for email ${authorEmail}. Seed the database or set DEMO_USER_EMAIL.`,
      );
    }

    return author;
  }

  async testPrompt(prompt: string) {
    return this.groqProvider.generateText({
      messages: [
        {
          role: 'system',
          content: 'You are a concise assistant. Answer briefly. This is only a connectivity test.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      maxTokens: 300,
    });
  }

  async generateGroundedAnswer(
    threadId: string,
    question: string,
    limit: number = APP_LIMITS.DEFAULT_AI_RETRIEVAL_LIMIT,
    demoUserEmail?: string,
  ): Promise<GroundedAiAnswer> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        authorId: true,
        title: true,
        content: true,
      },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    const author = await this.getDemoAuthor(demoUserEmail);

    if (thread.authorId !== author.id) {
      throw new ForbiddenException('Only the thread author can ask AI questions for this thread.');
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayAiAnswerCount = await this.prisma.aiAnswer.count({
      where: {
        createdAt: {
          gte: startOfToday,
        },
        thread: {
          authorId: author.id,
        },
      },
    });

    if (todayAiAnswerCount >= APP_LIMITS.MAX_AI_QUESTIONS_PER_USER_PER_DAY) {
      throw new HttpException(
        `Daily AI question limit reached. You can ask at most ${APP_LIMITS.MAX_AI_QUESTIONS_PER_USER_PER_DAY} AI questions per day.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (this.activeAiRequestsByUserId.has(author.id)) {
      throw new ConflictException(
        'You already have an active AI request. Please wait until it finishes.',
      );
    }

    this.activeAiRequestsByUserId.add(author.id);
    try {
      const sourceCount = await this.prisma.sourceDocument.count({
        where: { threadId },
      });

      if (sourceCount === 0) {
        throw new UnprocessableEntityException(
          'No evidence sources attached. Attach sources before asking for an evidence-grounded AI answer.',
        );
      }

      const retrievedChunks = await this.retrievalService.retrieveForThread(
        threadId,
        question,
        limit,
      );

      if (retrievedChunks.length === 0) {
        throw new UnprocessableEntityException(
          'No relevant evidence chunks were found for this question.',
        );
      }

      const evidenceBlock = retrievedChunks
        .map((chunk, index) => {
          return [
            `[${index + 1}] Source: ${chunk.sourceTitle}`,
            `Chunk ID: ${chunk.chunkId}`,
            `Text:`,
            chunk.text,
          ].join('\n');
        })
        .join('\n\n---\n\n');

      const result = await this.groqProvider.generateText({
        messages: [
          {
            role: 'system',
            content: [
              'You are an evidence-grounded assistant inside a discussion forum.',
              'You must answer only using the provided evidence chunks.',
              'Do not use outside knowledge.',
              'If the evidence is insufficient, say that the provided sources do not contain enough information.',
              'Cite sources using bracket numbers like [1], [2].',
              'Be clear, concise, helpful, and easy to understand.',
              'Use real-life examples only if they are supported by the provided evidence chunks.',
            ].join('\n'),
          },
          {
            role: 'user',
            content: [
              `Thread title: ${thread.title}`,
              `Thread description: ${thread.content}`,
              '',
              `User question: ${question}`,
              '',
              'Evidence chunks:',
              evidenceBlock,
              '',
              'Write an answer based only on the evidence chunks. Include citations like [1].',
            ].join('\n'),
          },
        ],
        temperature: 0.1,
        maxTokens: 800,
      });

      const citations = retrievedChunks.map((chunk) => ({
        sourceId: chunk.sourceId,
        sourceTitle: chunk.sourceTitle,
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        quote: this.createShortQuote(chunk.text),
      }));

      const savedAnswer = await this.prisma.aiAnswer.create({
        data: {
          threadId,
          question,
          answer: result.text,
          provider: result.provider,
          model: result.model,
          usedChunkCount: retrievedChunks.length,
          citations: {
            create: citations.map((citation) => ({
              sourceId: citation.sourceId,
              sourceTitle: citation.sourceTitle,
              chunkId: citation.chunkId,
              chunkIndex: citation.chunkIndex,
              quote: citation.quote,
            })),
          },
        },
        include: {
          citations: true,
        },
      });

      return savedAnswer;
    } finally {
      this.activeAiRequestsByUserId.delete(author.id);
    }
  }

  async findAnswersByThreadId(threadId: string) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    return this.prisma.aiAnswer.findMany({
      where: { threadId },
      orderBy: { createdAt: 'desc' },
      include: {
        citations: true,
      },
    });
  }

  private createShortQuote(text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.length <= 240) {
      return normalized;
    }

    return `${normalized.slice(0, 240)}...`;
  }

  private readonly activeAiRequestsByUserId = new Set<string>();
}
