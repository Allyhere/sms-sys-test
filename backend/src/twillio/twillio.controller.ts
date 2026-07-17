import { Controller, Post, Body, HttpCode } from '@nestjs/common';

@Controller('api/webhooks')
export class TwillioController {
  @Post('twilio')
  @HttpCode(200)
  handleIncomingSms(@Body() data: any) {
    return { success: true };
  }
}
