import { Body, Controller, Delete, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { CreateThreadDto } from './dto/create-thread.dto';
import { UpdateThreadDto } from './dto/update-thread.dto';
import { ThreadsService } from './threads.service';

@Controller('threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  create(
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
    @Body() createThreadDto: CreateThreadDto,
  ) {
    return this.threadsService.create(createThreadDto, demoUserEmail);
  }

  @Get()
  findAll() {
    return this.threadsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.threadsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Headers('x-demo-user-email') demoUserEmail: string | undefined,
    @Body() updateThreadDto: UpdateThreadDto,
  ) {
    return this.threadsService.update(id, updateThreadDto, demoUserEmail);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Headers('x-demo-user-email') demoUserEmail: string | undefined) {
    return this.threadsService.remove(id, demoUserEmail);
  }
}
