import { Module } from "@nestjs/common";
import { ThreadController } from "./threads.controller";
import { ThreadService } from "./threads.service";

@Module({
    controllers: [ThreadController],
    providers: [ThreadService],
})
export class ThreadModule { };