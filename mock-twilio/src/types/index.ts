export type MessageDirection = 'inbound' | 'outbound';

export type MessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'failed'
  | 'received';

export interface LogEntry {
  sid: string;
  direction: MessageDirection;
  from: string;
  to: string;
  body: string;
  status: MessageStatus;
  timestamp: string;
  webhookStatus?: number;
}

export interface Metrics {
  inboundTotal: number;
  outboundTotal: number;
  failedTotal: number;
  pendingCallbacks: number;
}

export interface SendSmsDto {
  to: string;
  from: string;
  body: string;
  statusCallback?: string;
  sid?: string;
  simulateFailure?: boolean;
}

export interface SimulateInboundDto {
  from: string;
  body: string;
  to?: string;
  numMedia?: number;
  numSegments?: number;
  accountSid?: string;
  messagingServiceSid?: string;
  signature?: boolean;
}

export interface SimulateStatusDto {
  MessageSid: string;
  MessageStatus: string;
  callbackUrl?: string;
}

export interface TwilioPayload {
  MessageSid: string;
  SmsSid: string;
  SmsMessageSid: string;
  AccountSid: string;
  MessagingServiceSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  NumSegments: string;
  SmsStatus: string;
  ApiVersion: string;
  FromCity: string;
  FromState: string;
  FromZip: string;
  FromCountry: string;
  ToCity: string;
  ToState: string;
  ToZip: string;
  ToCountry: string;
}

export interface WebhookResult {
  success: boolean;
  statusCode: number;
  attempts: number;
}
