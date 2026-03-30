import { Controller, Post, Body, Get, Param, Patch, Delete } from "@nestjs/common";
import { CreateThreadDto } from "./dto/create-thread.dto";
import { UpdateThreadDto } from "./dto/update-thread.dto";
import { ThreadService } from "./threads.service";

@Controller('threads')
export class ThreadController {
    constructor(private readonly threadService: ThreadService) { };

    @Post()
    create(@Body() createThreadDto: CreateThreadDto) {
        return this.threadService.create(createThreadDto);
    }

    @Get()
    findAll() {
        return this.threadService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.threadService.findOne(id);
    }

    @Patch(':id') 
    update(@Param('id') id: string, @Body() updateThreadDto: UpdateThreadDto) {
        return this.threadService.update(id, updateThreadDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.threadService.remove(id);
    }
}