import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StoreService } from '../store/store.service.js';
import { SignatureService } from '../signature/signature.service.js';
import { WebhookService } from '../webhook/webhook.service.js';
import {
  LogEntry,
  TwilioPayload,
  WebhookResult,
} from '../types/index.js';
import { SendSmsDto } from './dto/send-sms.dto.js';
import { SimulateInboundDto } from './dto/simulate-inbound.dto.js';
import { SimulateStatusDto } from './dto/simulate-status.dto.js';
import * as crypto from 'crypto';

@Injectable()
export class MockService {
  private readonly logger = new Logger(MockService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly storeService: StoreService,
    private readonly signatureService: SignatureService,
    private readonly webhookService: WebhookService,
  ) {}

  generateSid(): string {
    return 'SM' + crypto.randomBytes(16).toString('hex');
  }

  async handleSendSms(dto: SendSmsDto): Promise<{
    sid: string;
    status: string;
    to: string;
    from: string;
    body: string;
  }> {
    const sid = dto.sid || this.generateSid();
    const entry: LogEntry = {
      sid,
      direction: 'outbound',
      from: dto.from,
      to: dto.to,
      body: dto.body,
      status: 'queued',
      timestamp: new Date().toISOString(),
    };
    this.storeService.addOutbound(entry);
    this.logger.log(`Outbound SMS queued: SID ${sid} → ${dto.to}`);

    if (dto.statusCallback) {
      const statuses = dto.simulateFailure
        ? ['queued', 'sent', 'failed']
        : ['queued', 'sent', 'delivered'];

      if (dto.simulateFailure) {
        this.storeService.incrementPendingCallbacks();
      }

      this.webhookService
        .deliverStatusCallbacks(
          dto.statusCallback,
          sid,
          statuses,
          this.configService.get<number>('mockDelayMs')!,
        )
        .then(() => {
          if (dto.simulateFailure) {
            this.storeService.incrementFailed();
            this.storeService.decrementPendingCallbacks();
          }
        })
        .catch((err) => {
          this.logger.error(
            `Status callback sequence failed for SID ${sid}: ${err}`,
          );
        });
    }

    return {
      sid,
      status: 'queued',
      to: dto.to,
      from: dto.from,
      body: dto.body,
    };
  }

  async handleSimulateInbound(dto: SimulateInboundDto): Promise<{
    sid: string;
    status: string;
    webhookStatus: number;
  }> {
    const sid = this.generateSid();
    const to = dto.to || this.configService.get<string>('defaultToNumber')!;
    const authToken = this.configService.get<string>('twilioAuthToken')!;

    const payload: TwilioPayload = {
      MessageSid: sid,
      SmsSid: sid,
      SmsMessageSid: sid,
      AccountSid: dto.accountSid || 'AC' + crypto.randomBytes(15).toString('hex'),
      MessagingServiceSid: dto.messagingServiceSid || '',
      From: dto.from,
      To: to,
      Body: dto.body,
      NumMedia: String(dto.numMedia ?? 0),
      NumSegments: String(dto.numSegments ?? 1),
      SmsStatus: 'received',
      ApiVersion: '2010-04-01',
      FromCity: '',
      FromState: '',
      FromZip: '',
      FromCountry: 'US',
      ToCity: '',
      ToState: '',
      ToZip: '',
      ToCountry: 'US',
    };

    const webhookUrl = this.configService.get<string>('webhookUrl')!;
    const formPayload: Record<string, string> = {
      MessageSid: payload.MessageSid,
      SmsSid: payload.SmsSid,
      SmsMessageSid: payload.SmsMessageSid,
      AccountSid: payload.AccountSid,
      MessagingServiceSid: payload.MessagingServiceSid,
      From: payload.From,
      To: payload.To,
      Body: payload.Body,
      NumMedia: payload.NumMedia,
      NumSegments: payload.NumSegments,
      SmsStatus: payload.SmsStatus,
      ApiVersion: payload.ApiVersion,
      FromCity: payload.FromCity,
      FromState: payload.FromState,
      FromZip: payload.FromZip,
      FromCountry: payload.FromCountry,
      ToCity: payload.ToCity,
      ToState: payload.ToState,
      ToZip: payload.ToZip,
      ToCountry: payload.ToCountry,
    };

    let headers: Record<string, string> | undefined;
    if (dto.signature && authToken) {
      const signature = this.signatureService.generateSignature(
        webhookUrl,
        formPayload,
        authToken,
      );
      headers = { 'X-Twilio-Signature': signature };
      this.logger.log(`Signature generated for SID ${sid}`);
    }

    const result: WebhookResult = await this.webhookService.deliverWebhook(
      webhookUrl,
      formPayload,
      sid,
      headers,
    );

    const entry: LogEntry = {
      sid,
      direction: 'inbound',
      from: dto.from,
      to,
      body: dto.body,
      status: 'delivered',
      timestamp: new Date().toISOString(),
      webhookStatus: result.statusCode,
    };
    this.storeService.addInbound(entry);
    this.logger.log(
      `Inbound SMS simulated: SID ${sid} from ${dto.from} (webhook ${result.success ? 'OK' : 'FAILED'})`,
    );

    return {
      sid,
      status: result.success ? 'delivered' : 'failed',
      webhookStatus: result.statusCode,
    };
  }

  async handleSimulateStatus(dto: SimulateStatusDto): Promise<{
    sid: string;
    status: string;
    delivered: boolean;
  }> {
    const callbackUrl =
      dto.callbackUrl || this.configService.get<string>('webhookStatusUrl')!;
    const payload: Record<string, string> = {
      MessageSid: dto.MessageSid,
      MessageStatus: dto.MessageStatus,
    };

    const result = await this.webhookService.deliverWebhook(
      callbackUrl,
      payload,
      dto.MessageSid,
    );

    this.logger.log(
      `Status callback simulated: SID ${dto.MessageSid} → ${dto.MessageStatus} (${result.success ? 'OK' : 'FAILED'})`,
    );

    return {
      sid: dto.MessageSid,
      status: dto.MessageStatus,
      delivered: result.success,
    };
  }
}
