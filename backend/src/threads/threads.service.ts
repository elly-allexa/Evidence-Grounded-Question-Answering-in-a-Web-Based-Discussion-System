import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/database/prisma.service";
import { CreateThreadDto } from "./dto/create-thread.dto";

@Injectable()
export class ThreadService {
    constructor(private readonly prisma: PrismaService) { }

    async create(createThreadDto: CreateThreadDto) {
        return this.prisma.thread.create({
            data: {
                title: createThreadDto.title,
                content: createThreadDto.content,
                authorId: '12345', // Replace with actual user ID after he gets authenticated
            },
        });
    }

    async findAll() {
        return this.prisma.thread.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async findOne(id: string) {
        const thread = await this.prisma.thread.findUnique({
            where: { id },
        });

        if (!thread) {
            throw new Error(`Thread with id ${id} not found`);
        }
        return thread;
    }
}