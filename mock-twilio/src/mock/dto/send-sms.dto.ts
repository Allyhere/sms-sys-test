import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  from: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsOptional()
  statusCallback?: string;

  @IsString()
  @IsOptional()
  sid?: string;

  @IsBoolean()
  @IsOptional()
  simulateFailure?: boolean;
}
