import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Worker, Queue, Job } from 'bullmq';
import { SMS_PROCESSING_QUEUE } from './queue.constants';
import { SMS_DLQ } from './dlq.constants';
import { IntakeService } from 'src/intake/intake.service';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';

@Injectable()
export class SmsQueueConsumer implements OnModuleInit {
  private readonly logger = new Logger(SmsQueueConsumer.name);
  private worker: Worker;

  constructor(
    @InjectQueue(SMS_PROCESSING_QUEUE) private readonly queue: Queue,
    @InjectQueue(SMS_DLQ) private readonly dlqQueue: Queue,
    private readonly intakeService: IntakeService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      SMS_PROCESSING_QUEUE,
      async (job: Job<IncomingSmsDto>) => this.processJob(job),
      {
        connection: this.queue.opts.connection,
        concurrency: 1,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${err.message}`,
      );

      if (job && job.attemptsMade >= (job.opts.attempts ?? 0)) {
        void this.dlqQueue.add(SMS_DLQ, job.data, { jobId: job.id });
        this.logger.warn(`Job ${job.id} moved to dead letter queue`);
      }
    });
  }

  private async processJob(job: Job<IncomingSmsDto>): Promise<void> {
    await this.intakeService.processInbound(job.data);
  }
}
