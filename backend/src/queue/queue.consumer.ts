import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Worker, Queue, Job } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { SMS_PROCESSING_QUEUE } from './queue.constants';
import { MESSAGE_PROCESSED_EVENT } from './queue.events';
import { MessagesService } from 'src/messages/messages.service';
import { TwilioService } from 'src/twillio/twilio.service';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';

@Injectable()
export class SmsQueueConsumer implements OnModuleInit {
  private readonly logger = new Logger(SmsQueueConsumer.name);
  private worker: Worker;

  constructor(
    @InjectQueue(SMS_PROCESSING_QUEUE) private readonly queue: Queue,
    private readonly messagesService: MessagesService,
    private readonly twilioService: TwilioService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const concurrency = this.configService.get<number>('queue.concurrency')!;

    this.worker = new Worker(
      SMS_PROCESSING_QUEUE,
      async (job: Job<IncomingSmsDto>) => this.processJob(job),
      {
        connection: this.queue.opts.connection,
        concurrency,
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Job ${job?.id} failed after ${job?.attemptsMade} attempts: ${err.message}`,
      );
    });
  }

  private async processJob(job: Job<IncomingSmsDto>): Promise<void> {
    const dto = job.data;

    const message = await this.messagesService.receiveInbound(dto);

    if (message) {
      await this.twilioService.sendSms(
        dto.From,
        'Thanks for your message! We will get back to you soon.',
        message.conversationId,
      );

      this.eventEmitter.emit(MESSAGE_PROCESSED_EVENT, {
        message: {
          id: message.id,
          conversationId: message.conversationId,
          twilioMessageSid: message.twilioMessageSid,
          direction: message.direction,
          body: message.body,
          status: message.status,
        },
        conversationId: message.conversationId,
      });
    }
  }
}
