import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class StatusCallbackDto {
  @IsString()
  @IsNotEmpty()
  MessageSid: string;

  @IsString()
  @IsNotEmpty()
  MessageStatus: string;

  @IsOptional()
  @IsString()
  ErrorCode?: string;

  @IsOptional()
  @IsString()
  ErrorMessage?: string;
}
