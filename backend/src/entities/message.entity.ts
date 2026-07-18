import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageDirection {
  INBOUND = 'inbound',
  OUTBOUND = 'outbound',
}

export enum MessageStatus {
  RECEIVED = 'received',
  PROCESSING = 'processing',
  SENT = 'sent',
  DELIVERED = 'delivered',
  UNDELIVERED = 'undelivered',
  FAILED = 'failed',
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.messages)
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'conversation_id' })
  conversationId: string;

  @Column({ name: 'twilio_message_sid', nullable: true, unique: true })
  twilioMessageSid: string;

  @Column({ type: 'enum', enum: MessageDirection })
  direction: MessageDirection;

  @Column('text')
  body: string;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.RECEIVED,
  })
  status: MessageStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
