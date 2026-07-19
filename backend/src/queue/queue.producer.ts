import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SMS_PROCESSING_QUEUE } from './queue.constants';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';

@Injectable()
export class SmsQueueProducer {
  private readonly logger = new Logger(SmsQueueProducer.name);

  constructor(
    @InjectQueue(SMS_PROCESSING_QUEUE) private readonly queue: Queue,
  ) {}

  async addJob(dto: IncomingSmsDto): Promise<void> {
    await this.queue.add(SMS_PROCESSING_QUEUE, dto, {
      jobId: dto.MessageSid,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1_000,
      },
      removeOnComplete: 100,
      removeOnFail: 500,
    });

    this.logger.log(`Enqueued SMS job for SID ${dto.MessageSid}`);
  }
}
