import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class PdfTextExtractionService {
  async extractText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text.replace(/\s+/g, ' ').trim();

    if (!text) {
      throw new UnprocessableEntityException('Could not extract readable text from this PDF.');
    }

    await parser.destroy();

    return text;
  }
}