import { Controller, Post, Body } from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { IntakeService } from './intake.service';

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
  constructor(private readonly intakeService: IntakeService) {}

  @Post('send')
  async sendSms(@Body() dto: SendSmsDto) {
    return this.intakeService.sendOutbound(dto.to, dto.body);
  }
}
