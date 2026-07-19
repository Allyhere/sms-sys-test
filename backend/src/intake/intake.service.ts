import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg-protocol';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { Conversation } from 'src/entities/conversation.entity';
import {
  Message,
  MessageDirection,
  MessageStatus,
} from 'src/entities/message.entity';

import { TwilioService, SendSmsResult } from 'src/twillio/twilio.service';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';
import { MESSAGE_PROCESSED_EVENT } from './intake.events';

const AUTO_REPLY_TEXT =
  'Thanks for your message! We will get back to you soon.';

@Injectable()
export class IntakeService {
  private readonly logger = new Logger(IntakeService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
    private readonly twilioService: TwilioService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async processInbound(dto: IncomingSmsDto): Promise<Message | null> {
    const conversation = await this.upsertConversation(dto.From);

    let message: Message;
    try {
      message = this.messageRepo.create({
        conversation,
        conversationId: conversation.id,
        twilioMessageSid: dto.MessageSid,
        direction: MessageDirection.INBOUND,
        body: dto.Body,
        status: MessageStatus.RECEIVED,
      });
      await this.messageRepo.save(message);
      this.logger.log(`Inbound message saved: ${message.id} from ${dto.From}`);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError instanceof DatabaseError &&
        error.driverError.code === '23505'
      ) {
        this.logger.warn(`Duplicate message ignored: ${dto.MessageSid}`);
        return null;
      }
      throw error;
    }

    const fromNumber = this.configService.get<string>('twilio.fromNumber')!;
    const result = await this.twilioService.send(
      dto.From,
      fromNumber,
      AUTO_REPLY_TEXT,
    );
    await this.saveOutboundMessage(
      result.sid,
      AUTO_REPLY_TEXT,
      conversation.id,
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

    return message;
  }

  async sendOutbound(to: string, body: string): Promise<SendSmsResult> {
    const conversation = await this.upsertConversation(to);
    const fromNumber = this.configService.get<string>('twilio.fromNumber')!;
    const result = await this.twilioService.send(to, fromNumber, body);
    await this.saveOutboundMessage(result.sid, body, conversation.id);
    return result;
  }

  private async upsertConversation(phoneNumber: string): Promise<Conversation> {
    let conversation = await this.conversationRepo.findOne({
      where: { phoneNumber },
    });
    if (!conversation) {
      conversation = this.conversationRepo.create({ phoneNumber });
      await this.conversationRepo.save(conversation);
    }
    return conversation;
  }

  private async saveOutboundMessage(
    sid: string,
    body: string,
    conversationId: string,
  ): Promise<void> {
    const message = this.messageRepo.create({
      conversationId,
      twilioMessageSid: sid,
      direction: MessageDirection.OUTBOUND,
      body,
      status: MessageStatus.PROCESSING,
    });
    await this.messageRepo.save(message);
    this.logger.log(`Outbound message saved: SID ${sid}`);
  }
}
