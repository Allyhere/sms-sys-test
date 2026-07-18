import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { TwillioController } from 'src/twillio/twillio.controller';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { TwilioModule } from 'src/twillio/twilio.module';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Conversation]), TwilioModule],
  controllers: [TwillioController, MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
