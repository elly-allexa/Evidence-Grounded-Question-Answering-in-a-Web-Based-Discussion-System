import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, UnrecoverableError } from 'bullmq';
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
      data: {
        status: AiJobStatus.RUNNING,
        error: null,
      },
    });

    const debugDelayMs = Number(process.env.AI_QUEUE_DEBUG_DELAY_MS ?? 0);

    if (debugDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, debugDelayMs));
    }

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
          error: null,
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
      const errorMessage = err instanceof Error ? err.message : 'Unknown AI queue error';

      const isNonRetryableError =
        errorMessage.includes('No relevant evidence chunks') ||
        errorMessage.includes('No evidence sources attached') ||
        errorMessage.includes('Daily AI question limit reached') ||
        errorMessage.includes('Only the thread author can ask AI');

      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      if (isNonRetryableError || isFinalAttempt) {
        await this.prisma.aiJob.update({
          where: { id: aiJob.id },
          data: {
            status: AiJobStatus.FAILED,
            error: errorMessage,
          },
        });

        await this.notificationsService.create({
          userId: aiJob.userId,
          type: NotificationType.AI_ANSWER_READY,
          title: 'AI answer failed',
          message: errorMessage,
          link: `/threads/${aiJob.threadId}`,
        });

        if (isNonRetryableError) {
          throw new UnrecoverableError(errorMessage);
        }

        throw err;
      }

      await this.prisma.aiJob.update({
        where: { id: aiJob.id },
        data: {
          status: AiJobStatus.QUEUED,
          error: errorMessage,
        },
      });

      throw err;
    }
  }
}
