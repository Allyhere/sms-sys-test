import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';
import { TwilioSignatureGuard } from './twilio-signature.guard';
import { MessageStatus } from 'src/entities/message.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { SmsQueueProducer } from 'src/queue/queue.producer';

@Controller('api/webhooks')
export class TwillioController {
  constructor(
    private readonly smsQueueProducer: SmsQueueProducer,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}

  @Post('twilio')
  @HttpCode(200)
  @UseGuards(TwilioSignatureGuard)
  async handleIncomingSms(@Body() dto: IncomingSmsDto) {
    await this.smsQueueProducer.addJob(dto);
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
