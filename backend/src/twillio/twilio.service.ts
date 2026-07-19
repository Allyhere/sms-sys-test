import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio as TwilioClient } from 'twilio';
import CircuitBreaker from 'opossum';

export interface SendSmsResult {
  sid: string;
  status: string;
}

@Injectable()
export class TwilioService implements OnModuleInit {
  private readonly logger = new Logger(TwilioService.name);
  private breaker!: CircuitBreaker<[string, string, string], SendSmsResult>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.breaker = new CircuitBreaker(
      async (to: string, from: string, body: string) =>
        this.sendInternal(to, from, body),
      {
        timeout: this.configService.get<number>('circuitBreaker.timeout')!,
        errorThresholdPercentage: this.configService.get<number>(
          'circuitBreaker.errorThresholdPercentage',
        )!,
        resetTimeout: this.configService.get<number>(
          'circuitBreaker.resetTimeout',
        )!,
        rollingCountTimeout: 60_000,
        rollingCountBuckets: 6,
      },
    );

    this.breaker.on('open', () =>
      this.logger.warn('Twilio circuit breaker OPENED'),
    );
    this.breaker.on('close', () =>
      this.logger.log('Twilio circuit breaker CLOSED'),
    );
    this.breaker.fallback(() => {
      throw new ServiceUnavailableException(
        'Twilio service is temporarily unavailable (circuit breaker open)',
      );
    });
  }

  async send(to: string, from: string, body: string): Promise<SendSmsResult> {
    return this.breaker.fire(to, from, body);
  }

  private async sendInternal(
    to: string,
    from: string,
    body: string,
  ): Promise<SendSmsResult> {
    const mode = this.configService.get<string>('twilio.mode')!;

    if (mode === 'mock') {
      return this.sendViaMock(to, from, body);
    }

    return this.sendViaTwilio(to, from, body);
  }

  private async sendViaMock(
    to: string,
    from: string,
    body: string,
  ): Promise<SendSmsResult> {
    const mockUrl = this.configService.get<string>('twilio.mockUrl')!;
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
    return { sid: data.sid, status: data.status };
  }

  private async sendViaTwilio(
    to: string,
    from: string,
    body: string,
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

    return { sid: message.sid, status: message.status };
  }
}
