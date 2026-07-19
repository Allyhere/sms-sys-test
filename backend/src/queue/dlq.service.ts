import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SMS_DLQ } from './dlq.constants';
import { SMS_PROCESSING_QUEUE } from './queue.constants';

@Injectable()
export class DlqService {
  private readonly logger = new Logger(DlqService.name);

  constructor(
    @InjectQueue(SMS_DLQ) private readonly dlqQueue: Queue,
    @InjectQueue(SMS_PROCESSING_QUEUE)
    private readonly mainQueue: Queue,
  ) {}

  async getFailedJobs(page = 1, limit = 20) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    const jobs = await this.dlqQueue.getJobs(['delayed', 'wait'], start, end);
    const total = await this.dlqQueue.count();

    return {
      jobs: jobs.map((job) => ({
        id: job.id,
        data: job.data as unknown,
        attemptsMade: job.attemptsMade,
        failedReason: job.failedReason,
        timestamp: job.timestamp,
      })),
      total,
      page,
      limit,
    };
  }

  async replayJob(jobId: string): Promise<void> {
    const job = await this.dlqQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`DLQ job ${jobId} not found`);
    }

    await this.mainQueue.add(SMS_PROCESSING_QUEUE, job.data, {
      jobId: job.id,
      attempts: 3,
      backoff: { type: 'exponential', delay: 1_000 },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    await job.remove();
    this.logger.log(`Replayed DLQ job ${jobId} to main queue`);
  }

  async removeJob(jobId: string): Promise<void> {
    const job = await this.dlqQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`DLQ job ${jobId} not found`);
    }

    await job.remove();
    this.logger.warn(`Removed DLQ job ${jobId}`);
  }
}
