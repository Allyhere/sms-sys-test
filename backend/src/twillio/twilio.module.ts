import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { TwilioService } from './twilio.service.js';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Message, Conversation])],
  providers: [TwilioService],
  exports: [TwilioService],
})
export class TwilioModule {}
