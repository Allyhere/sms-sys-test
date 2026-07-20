import { Controller, Sse, MessageEvent } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EventsService } from './events.service';

@Controller('api/events')
@SkipThrottle()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('sse')
  sse(): Observable<MessageEvent> {
    return this.eventsService.getStream().pipe(
      map((event) => ({
        type: event.type,
        data: JSON.stringify(event.data),
      })),
    );
  }
}
