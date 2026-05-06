import { Module } from '@nestjs/common';
import { SourcesController } from './sources.controller';
import { SourcesService } from './sources.service';
import { SourceChunkingService } from './chunking/source-chunking.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, SourceChunkingService],
})
export class SourcesModule {}
