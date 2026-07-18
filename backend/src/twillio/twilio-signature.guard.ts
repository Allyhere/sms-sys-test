import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { validateRequest } from 'twilio';

@Injectable()
export class TwilioSignatureGuard implements CanActivate {
  private readonly logger = new Logger(TwilioSignatureGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const validate = this.configService.get<boolean>(
      'twilio.validateSignature',
    );

    if (!validate) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const signature = request.headers['x-twilio-signature'] as string;
    const authToken = this.configService.get<string>('twilio.authToken')!;

    if (!signature) {
      this.logger.warn('Missing X-Twilio-Signature header');
      throw new ForbiddenException({
        code: 40301,
        message: 'Missing X-Twilio-Signature header',
        moreInfo: 'https://www.twilio.com/docs/usage/security',
      });
    }

    const url = `${request.protocol}://${request.get('host')}${request.originalUrl}`;
    const params = (request.body || {}) as Record<string, string>;

    const isValid = validateRequest(authToken, signature, url, params);

    if (!isValid) {
      this.logger.warn(`Invalid Twilio signature for URL: ${url}`);
      throw new ForbiddenException({
        code: 40302,
        message: 'Invalid Twilio signature',
        moreInfo: 'https://www.twilio.com/docs/usage/security',
      });
    }

    return true;
  }
}
