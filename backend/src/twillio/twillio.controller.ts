import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';
import { MessagesService } from 'src/messages/messages.service';
import { TwilioSignatureGuard } from './twilio-signature.guard';
import { TwilioService } from './twilio.service';
import { MessageStatus } from 'src/entities/message.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';

@Controller('api/webhooks')
export class TwillioController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly twilioService: TwilioService,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  @Post('twilio')
  @HttpCode(200)
  @UseGuards(TwilioSignatureGuard)
  async handleIncomingSms(@Body() dto: IncomingSmsDto) {
    const message = await this.messagesService.receiveInbound(dto);
    if (message) {
      await this.twilioService.sendSms(
        dto.From,
        'Thanks for your message! We will get back to you soon.',
        message.conversationId,
      );
    }
    return { success: true };
  }

  @Post('twilio/status')
  @HttpCode(200)
  async handleStatusCallback(@Body() body: Record<string, string>) {
    const sid = body.MessageSid;
    const status = body.MessageStatus as MessageStatus;

    if (sid && status) {
      await this.messageRepo.update({ twilioMessageSid: sid }, { status });
    }

    return { success: true };
  }
}
