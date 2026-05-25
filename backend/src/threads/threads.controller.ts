import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { ListThreadsDto } from './dto/list-threads.dto';
import { ThreadsService } from './threads.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import type { JwtUser } from 'src/auth/types';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: JwtUser, @Body() createThreadDto: CreateThreadDto) {
    return this.threadsService.create(createThreadDto, user.id);
  }

  @Get()
  findAll(@Query() query: ListThreadsDto) {
    return this.threadsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: JwtUser,
    @Body() updateThreadDto: UpdateThreadDto,
  ) {
    return this.threadsService.update(id, updateThreadDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.threadsService.remove(id, user.id);
  }
}
