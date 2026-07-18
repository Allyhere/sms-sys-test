import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';
import { MessagesService } from 'src/messages/messages.service';

@Controller('api/webhooks')
export class TwillioController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post('twilio')
  @HttpCode(200)
  async handleIncomingSms(@Body() dto: IncomingSmsDto) {
    await this.messagesService.receiveInbound(dto);
    return { success: true };
  }
}
