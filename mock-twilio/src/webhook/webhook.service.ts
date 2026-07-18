import { Injectable, Logger } from '@nestjs/common';
import { WebhookResult } from '../types/index.js';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 100;

  async deliverWebhook(
    url: string,
    payload: Record<string, string>,
    sid: string,
    headers?: Record<string, string>,
  ): Promise<WebhookResult> {
    let lastStatusCode = 0;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log(
          `Webhook attempt ${attempt}/${this.maxRetries} for SID ${sid} → ${url}`,
        );

        const body = new URLSearchParams(payload).toString();
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            ...headers,
          },
          body,
        });

        lastStatusCode = res.status;

        if (res.ok) {
          this.logger.log(
            `Webhook delivered for SID ${sid} (status ${res.status})`,
          );
          return { success: true, statusCode: res.status, attempts: attempt };
        }

        this.logger.warn(
          `Webhook failed for SID ${sid} (status ${res.status}) on attempt ${attempt}`,
        );
      } catch (error) {
        this.logger.warn(
          `Webhook error for SID ${sid} on attempt ${attempt}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (attempt < this.maxRetries) {
        const delay = this.baseDelayMs * Math.pow(2, attempt - 1);
        await this.sleep(delay);
      }
    }

    this.logger.error(
      `Webhook delivery exhausted retries for SID ${sid} after ${this.maxRetries} attempts`,
    );
    return { success: false, statusCode: lastStatusCode, attempts: this.maxRetries };
  }

  async deliverStatusCallbacks(
    url: string,
    sid: string,
    statuses: string[],
    delayMs: number,
    headers?: Record<string, string>,
  ): Promise<void> {
    for (const status of statuses) {
      await this.sleep(delayMs);
      const payload: Record<string, string> = {
        MessageSid: sid,
        MessageStatus: status,
      };
      await this.deliverWebhook(url, payload, sid, headers);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
