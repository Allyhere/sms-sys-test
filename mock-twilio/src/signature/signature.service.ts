import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SignatureService {
  private readonly logger = new Logger(SignatureService.name);

  generateSignature(
    url: string,
    params: Record<string, string>,
    authToken: string,
  ): string {
    if (!authToken) {
      this.logger.warn(
        'TWILIO_AUTH_TOKEN is empty — signature will be invalid',
      );
    }

    const sortedKeys = Object.keys(params).sort();
    let dataString = url;
    for (const key of sortedKeys) {
      dataString += key + (params[key] || '');
    }

    return crypto
      .createHmac('sha1', authToken)
      .update(Buffer.from(dataString, 'utf-8'))
      .digest('base64');
  }
}
