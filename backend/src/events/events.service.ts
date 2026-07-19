import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Subject } from 'rxjs';
import { MESSAGE_PROCESSED_EVENT } from 'src/intake/intake.events';
import type { MessageProcessedPayload } from 'src/intake/intake.events';

export type SseEvent = {
  type: string;
  data: unknown;
};

@Injectable()
export class EventsService implements OnModuleInit {
  private readonly subject$ = new Subject<SseEvent>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  onModuleInit() {
    this.eventEmitter.on(
      MESSAGE_PROCESSED_EVENT,
      (payload: MessageProcessedPayload) => {
        this.subject$.next({
          type: 'message.processed',
          data: payload,
        });
      },
    );
  }

  getStream() {
    return this.subject$.asObservable();
  }
}
