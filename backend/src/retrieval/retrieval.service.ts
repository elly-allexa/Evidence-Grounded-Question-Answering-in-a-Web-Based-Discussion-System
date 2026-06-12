import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/database/prisma.service';

export type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  text: string;
  score: number;
};

const DEFAULT_RETRIEVAL_LIMIT = 5;

@Injectable()
export class RetrievalService {
  constructor(private readonly prisma: PrismaService) {}

  async retrieveForThread(
    threadId: string,
    question: string,
    limit = DEFAULT_RETRIEVAL_LIMIT,
  ): Promise<RetrievedChunk[]> {
    const thread = await this.prisma.thread.findUnique({
      where: { id: threadId },
      select: { id: true },
    });

    if (!thread) {
      throw new NotFoundException(`Thread with id ${threadId} not found`);
    }

    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      return [];
    }

    const safeLimit = Math.min(Math.max(limit, 1), 10);

    return this.prisma.$queryRaw<RetrievedChunk[]>`
      SELECT
        sc.id AS "chunkId",
        sd.id AS "sourceId",
        sd.title AS "sourceTitle",
        sc."chunkIndex" AS "chunkIndex",
        sc.text AS "text",
        ts_rank(
          to_tsvector('english', sc.text),
          plainto_tsquery('english', ${normalizedQuestion})
        )::float AS "score"
      FROM "SourceChunk" sc
      JOIN "SourceDocument" sd ON sd.id = sc."docId"
      WHERE
        sd."threadId" = ${threadId}
        AND sd."isDeleted" = false
        AND to_tsvector('english', sc.text) @@ plainto_tsquery('english', ${normalizedQuestion})
      ORDER BY "score" DESC, sc."chunkIndex" ASC
      LIMIT ${safeLimit};
    `;
  }
}
