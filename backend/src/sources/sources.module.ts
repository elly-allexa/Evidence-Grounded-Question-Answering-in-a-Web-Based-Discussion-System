import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { SourceChunkingService } from './chunking/source-chunking.service';
import { PdfTextExtractionService } from './pdf/pdf-text-extraction.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, SourceChunkingService, PdfTextExtractionService],
})
export class SourcesModule {}
