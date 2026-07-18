import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class IncomingSmsDto {
  @IsString()
  @IsNotEmpty()
  MessageSid: string;

  @IsString()
  @IsNotEmpty()
  From: string;

  @IsString()
  @IsNotEmpty()
  To: string;

  @IsString()
  @IsNotEmpty()
  Body: string;

  @IsString()
  @IsOptional()
  SmsSid?: string;

  @IsString()
  @IsOptional()
  SmsMessageSid?: string;

  @IsString()
  @IsOptional()
  AccountSid?: string;

  @IsString()
  @IsOptional()
  MessagingServiceSid?: string;

  @IsString()
  @IsOptional()
  NumMedia?: string;

  @IsString()
  @IsOptional()
  NumSegments?: string;

  @IsString()
  @IsOptional()
  SmsStatus?: string;

  @IsString()
  @IsOptional()
  ApiVersion?: string;

  @IsString()
  @IsOptional()
  FromCity?: string;

  @IsString()
  @IsOptional()
  FromState?: string;

  @IsString()
  @IsOptional()
  FromZip?: string;

  @IsString()
  @IsOptional()
  FromCountry?: string;

  @IsString()
  @IsOptional()
  ToCity?: string;

  @IsString()
  @IsOptional()
  ToState?: string;

  @IsString()
  @IsOptional()
  ToZip?: string;

  @IsString()
  @IsOptional()
  ToCountry?: string;
}
