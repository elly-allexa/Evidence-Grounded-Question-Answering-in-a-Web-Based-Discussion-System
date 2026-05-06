import { Injectable } from '@nestjs/common';

const TARGET_CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

@Injectable()
export class SourceChunkingService {
  splitIntoChunks(text: string): string[] {
    const normalizedText = this.normalizeText(text);

    if (!normalizedText) {
      return [];
    }

    const paragraphs = normalizedText
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);

    const chunks: string[] = [];
    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if (!currentChunk) {
        currentChunk = paragraph;
        continue;
      }

      const candidate = `${currentChunk}\n\n${paragraph}`;

      if (candidate.length <= TARGET_CHUNK_SIZE) {
        currentChunk = candidate;
      } else {
        chunks.push(currentChunk);
        currentChunk = this.addOverlap(currentChunk, paragraph);
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks.flatMap((chunk) => this.splitLargeChunk(chunk));
  }

  private normalizeText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .trim();
  }

  private addOverlap(previousChunk: string, nextParagraph: string): string {
    const overlap = previousChunk.slice(-CHUNK_OVERLAP).trim();

    if (!overlap) {
      return nextParagraph;
    }

    return `${overlap}\n\n${nextParagraph}`;
  }

  private splitLargeChunk(chunk: string): string[] {
    if (chunk.length <= TARGET_CHUNK_SIZE * 1.5) {
      return [chunk];
    }

    const result: string[] = [];

    for (let start = 0; start < chunk.length; start += TARGET_CHUNK_SIZE - CHUNK_OVERLAP) {
      const part = chunk.slice(start, start + TARGET_CHUNK_SIZE).trim();

      if (part) {
        result.push(part);
      }
    }

    return result;
  }
}
