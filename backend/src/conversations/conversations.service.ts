import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
  ) {}

  async findAll() {
    const conversations = await this.conversationRepo
      .createQueryBuilder('conversation')
      .loadRelationIdAndMap('conversation.messageIds', 'conversation.messages')
      .leftJoinAndSelect(
        'conversation.messages',
        'lastMessage',
        'lastMessage.id = (SELECT m.id FROM messages m WHERE m.conversation_id = conversation.id ORDER BY m."createdAt" DESC LIMIT 1)',
      )
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();

    return conversations.map(
      (conv: Conversation & { messageIds?: string[] }) => ({
        id: conv.id,
        phoneNumber: conv.phoneNumber,
        messageCount: conv.messageIds?.length ?? 0,
        lastMessage: conv.messages?.[0] ?? null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }),
    );
  }

  async findOne(id: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id },
      relations: { messages: true },
      order: { messages: { createdAt: 'ASC' } },
    });
    return conversation;
  }
}
