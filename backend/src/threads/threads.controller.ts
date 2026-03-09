import { Controller, Post, Body, Get, Param } from "@nestjs/common";
import { CreateThreadDto } from "./dto/create-thread.dto";
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
}