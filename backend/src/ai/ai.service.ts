import {
  HttpException,
  HttpStatus,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
  ConflictException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiJobStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { GroqProvider } from './providers/groq.provider';
import { RetrievalService } from 'src/retrieval/retrieval.service';
import { GroundedAiAnswer } from './types/grounded-answer.types';
import { APP_LIMITS } from 'src/common/config/limits';

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groqProvider: GroqProvider,
    private readonly retrievalService: RetrievalService,
    @InjectQueue('ai') private readonly aiQueue: Queue,
  ) {}

  private async getCurrentAuthor(userId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!author) {
      throw new NotFoundException('Current user not found');
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

  async enqueueGroundedAnswer(
    threadId: string,
    question: string,
    limit: number = APP_LIMITS.DEFAULT_AI_RETRIEVAL_LIMIT,
    currentUserId: string,
  ) {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true, authorId: true },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    if (thread.authorId !== currentUserId) {
      throw new ForbiddenException('Only the thread author can ask AI questions for this thread.');
    }

    const activeJob = await this.prisma.aiJob.findFirst({
      where: {
        userId: currentUserId,
        status: {
          in: [AiJobStatus.QUEUED, AiJobStatus.RUNNING],
        },
      },
    });

    if (activeJob) {
      throw new ConflictException(
        'You already have an AI request in the queue. Please wait until it finishes.',
      );
    }

    const job = await this.prisma.aiJob.create({
      data: {
        threadId,
        userId: currentUserId,
        question,
        limit,
        status: AiJobStatus.QUEUED,
      },
    });

    await this.aiQueue.add(
      'generate-grounded-answer',
      {
        aiJobId: job.id,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    );

    return job;
  }

  async generateGroundedAnswerNow(
    threadId: string,
    question: string,
    limit: number = APP_LIMITS.DEFAULT_AI_RETRIEVAL_LIMIT,
    currentUserId: string,
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

    const author = await this.getCurrentAuthor(currentUserId);

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

    return this.prisma.aiAnswer.create({
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
  }

  findMyAiJobs(userId: string) {
    return this.prisma.aiJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
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
}
