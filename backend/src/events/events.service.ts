import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subject } from 'rxjs';
import Redis from 'ioredis';
import { MESSAGE_PROCESSED_EVENT } from 'src/intake/intake.events';
import type { MessageProcessedPayload } from 'src/intake/intake.events';

export type SseEvent = {
  type: string;
  data: unknown;
};

export const SSE_REDIS_CHANNEL = MESSAGE_PROCESSED_EVENT;

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private readonly subject$ = new Subject<SseEvent>();
  private readonly subscriber: Redis;

  constructor(private readonly configService: ConfigService) {
    this.subscriber = new Redis({
      host: this.configService.getOrThrow<string>('redis.host'),
      port: this.configService.getOrThrow<number>('redis.port'),
    });
  }

  async onModuleInit() {
    await this.subscriber.subscribe(SSE_REDIS_CHANNEL);
    this.subscriber.on('message', (channel, data) => {
      if (channel === SSE_REDIS_CHANNEL) {
        try {
          const payload = JSON.parse(data) as MessageProcessedPayload;
          this.subject$.next({
            type: MESSAGE_PROCESSED_EVENT,
            data: payload,
          });
        } catch {
          this.logger.warn(
            `Failed to parse Redis pub/sub message on channel ${channel}`,
          );
        }
      }
    });
    this.logger.log(`Subscribed to Redis channel: ${SSE_REDIS_CHANNEL}`);
  }

  onModuleDestroy() {
    this.subscriber.disconnect();
    this.subject$.complete();
  }

  getStream() {
    return this.subject$.asObservable();
  }
}
