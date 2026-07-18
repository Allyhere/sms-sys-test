import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from 'src/entities/conversation.entity';
import {
  Message,
  MessageDirection,
  MessageStatus,
} from 'src/entities/message.entity';
import { Repository, QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg-protocol';
import { IncomingSmsDto } from './dto/incoming-sms.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
  ) {}

  async receiveInbound(dto: IncomingSmsDto): Promise<Message | null> {
    const conversation = await this.upsertConversation(dto.From);

    try {
      const message = this.messageRepo.create({
        conversation,
        conversationId: conversation.id,
        twilioMessageSid: dto.MessageSid,
        direction: MessageDirection.INBOUND,
        body: dto.Body,
        status: MessageStatus.RECEIVED,
      });
      await this.messageRepo.save(message);

      this.logger.log(`Inbound message queued: ${message.id} from ${dto.From}`);
      return message;
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
}
