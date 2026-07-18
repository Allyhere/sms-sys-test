import { IsString, IsNotEmpty } from 'class-validator';

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
}
