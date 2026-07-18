import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SimulateStatusDto {
  @IsString()
  @IsNotEmpty()
  MessageSid: string;

  @IsString()
  @IsNotEmpty()
  MessageStatus: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;
}
