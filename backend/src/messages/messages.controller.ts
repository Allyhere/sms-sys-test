import { Controller, Post, Body } from '@nestjs/common';
import { TwilioService } from 'src/twillio/twilio.service';
import { IsString, IsNotEmpty } from 'class-validator';

class SendSmsDto {
  @IsString()
  @IsNotEmpty()
  to: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

@Controller('api/messages')
export class MessagesController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('send')
  async sendSms(@Body() dto: SendSmsDto) {
    const result = await this.twilioService.sendSms(dto.to, dto.body, '');
    return result;
  }
}
