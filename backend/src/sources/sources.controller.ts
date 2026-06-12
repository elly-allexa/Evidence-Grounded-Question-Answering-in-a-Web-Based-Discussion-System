import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateSourceDto } from './dto/create-source.dto';
import { UploadPdfSourceDto } from './dto/upload-pdf-source.dto';
import { SourcesService } from './sources.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types';
import { APP_LIMITS } from 'src/common/config/limits';
import { DeleteSourceDto } from './dto/delete-source.dto';

type UploadedPdfFile = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
};

@Controller()
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  @Get('threads/:threadId/sources')
  findByThreadId(@Param('threadId') threadId: string) {
    return this.sourcesService.findByThreadId(threadId);
  }

  @Post('threads/:threadId/sources')
  @UseGuards(JwtAuthGuard)
  create(
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtUser,
    @Body() createSourceDto: CreateSourceDto,
  ) {
    return this.sourcesService.create(threadId, createSourceDto, user.id);
  }

  @Post('threads/:threadId/sources/pdf')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: APP_LIMITS.MAX_SOURCE_PDF_SIZE_BYTES,
      },
      fileFilter: (_req, file, callback) => {
        if (file.mimetype !== 'application/pdf') {
          callback(new Error('Only PDF files are allowed.'), false);
          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadPdfSource(
    @Param('threadId') threadId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: UploadPdfSourceDto,
    @UploadedFile() file: UploadedPdfFile,
  ) {
    return this.sourcesService.createFromPdf(threadId, file, dto, user.id);
  }

  @Delete('sources/:sourceId')
  @UseGuards(JwtAuthGuard)
  delete(
    @Param('sourceId') sourceId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: DeleteSourceDto,
  ) {
    return this.sourcesService.delete(sourceId, user.id, dto?.reason);
  }

  @Get('sources/:sourceId/chunks')
  getChunksBySourceId(@Param('sourceId') sourceId: string) {
    return this.sourcesService.findChunksBySourceId(sourceId);
  }

  @Get('threads/:threadId/chunks')
  getChunksByThreadId(@Param('threadId') threadId: string) {
    return this.sourcesService.findChunksByThreadId(threadId);
  }
}
