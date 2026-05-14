import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { GroqProvider } from './providers/groq.provider';
import { RetrievalService } from 'src/retrieval/retrieval.service';
import { GroundedAiAnswer } from './types/grounded-answer.types';

const DEFAULT_AI_RETRIEVAL_LIMIT = 5; 

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groqProvider: GroqProvider,
    private readonly retrievalService: RetrievalService,
  ) {}

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
    limit = DEFAULT_AI_RETRIEVAL_LIMIT,
  ): Promise<GroundedAiAnswer> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
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
            'Be clear, concise, helpful and explain your reasoning, make it easy to understand and if possible provide real-life examples.',
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

    return {
      answer: result.text,
      citations,
      provider: result.provider,
      model: result.model,
      usedChunkCount: retrievedChunks.length,
    };
  }

  private createShortQuote(text: string): string {
    const normalized = text.replace(/\s+/g, ' ').trim();

    if (normalized.length <= 240) {
      return normalized;
    }

    return `${normalized.slice(0, 240)}...`;
  }
}
