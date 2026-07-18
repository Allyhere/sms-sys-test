import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Message,
  MessageDirection,
  MessageStatus,
} from 'src/entities/message.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { Twilio as TwilioClient } from 'twilio';

export interface SendSmsResult {
  sid: string;
  status: string;
}

@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private conversationRepo: Repository<Conversation>,
  ) {}

  async sendSms(
    to: string,
    body: string,
    conversationId: string,
  ): Promise<SendSmsResult> {
    const mode = this.configService.get<string>('twilio.mode')!;
    const fromNumber = this.configService.get<string>('twilio.fromNumber')!;
    const mockUrl = this.configService.get<string>('twilio.mockUrl')!;

    if (mode === 'mock') {
      return this.sendViaMock(to, fromNumber, body, conversationId, mockUrl);
    }

    return this.sendViaTwilio(to, fromNumber, body, conversationId);
  }

  private async sendViaMock(
    to: string,
    from: string,
    body: string,
    conversationId: string,
    mockUrl: string,
  ): Promise<SendSmsResult> {
    const callbackUrl = 'http://api:3000/api/webhooks/twilio/status';

    const res = await fetch(`${mockUrl}/api/send-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        from,
        body,
        statusCallback: callbackUrl,
      }),
    });

    if (!res.ok) {
      this.logger.error(`Mock send-sms failed: ${res.status}`);
      throw new Error(`Mock SMS send failed with status ${res.status}`);
    }

    const data = (await res.json()) as { sid: string; status: string };

    await this.saveOutboundMessage(data.sid, body, conversationId);

    return { sid: data.sid, status: data.status };
  }

  private async sendViaTwilio(
    to: string,
    from: string,
    body: string,
    conversationId: string,
  ): Promise<SendSmsResult> {
    const accountSid = this.configService.get<string>('twilio.accountSid')!;
    const authToken = this.configService.get<string>('twilio.authToken')!;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    const client = new TwilioClient(accountSid, authToken);
    const message = await client.messages.create({
      to,
      from,
      body,
      statusCallback: 'http://api:3000/api/webhooks/twilio/status',
    });

    await this.saveOutboundMessage(message.sid, body, conversationId);

    return { sid: message.sid, status: message.status };
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
