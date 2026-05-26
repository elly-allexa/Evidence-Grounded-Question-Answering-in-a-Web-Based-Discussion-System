import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiService } from './ai.service';
import { PrismaService } from 'src/prisma/database/prisma.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { AiJobStatus, NotificationType } from '@prisma/client';

@Processor('ai')
export class AiProcessor extends WorkerHost {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ aiJobId: string }>): Promise<void> {
    const aiJob = await this.prisma.aiJob.findUnique({
      where: { id: job.data.aiJobId },
    });

    if (!aiJob) {
      return;
    }

    await this.prisma.aiJob.update({
      where: { id: aiJob.id },
      data: { status: AiJobStatus.RUNNING },
    });

    try {
      const answer = await this.aiService.generateGroundedAnswerNow(
        aiJob.threadId,
        aiJob.question,
        aiJob.limit,
        aiJob.userId,
      );

      await this.prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: AiJobStatus.COMPLETED,
          answerId: answer.id,
        },
      });

      await this.notificationsService.create({
        userId: aiJob.userId,
        type: NotificationType.AI_ANSWER_READY,
        title: 'AI answer is ready',
        message: 'Your evidence-grounded AI answer has been generated.',
        link: `/threads/${aiJob.threadId}`,
      });
    } catch (err) {
      await this.prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: AiJobStatus.FAILED,
          error: err instanceof Error ? err.message : 'Unknown AI queue error',
        },
      });

      throw err;
    }
  }
}
