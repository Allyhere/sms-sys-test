import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { TwilioModule } from 'src/twillio/twilio.module';
import { IntakeService } from './intake.service';
import { MessagesController } from './messages.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Message, Conversation]), TwilioModule],
  controllers: [MessagesController],
  providers: [IntakeService],
  exports: [IntakeService],
})
export class IntakeModule {}
