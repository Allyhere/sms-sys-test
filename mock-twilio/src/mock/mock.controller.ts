import { Body, Controller, Post } from '@nestjs/common';
import { MockService } from './mock.service.js';
import { SendSmsDto } from './dto/send-sms.dto.js';
import { SimulateInboundDto } from './dto/simulate-inbound.dto.js';
import { SimulateStatusDto } from './dto/simulate-status.dto.js';

@Controller()
export class MockController {
  constructor(private readonly mockService: MockService) {}

  @Post('api/send-sms')
  async sendSms(@Body() dto: SendSmsDto) {
    return this.mockService.handleSendSms(dto);
  }

  @Post('simulate-inbound')
  async simulateInbound(@Body() dto: SimulateInboundDto) {
    return this.mockService.handleSimulateInbound(dto);
  }

  @Post('simulate-status')
  async simulateStatus(@Body() dto: SimulateStatusDto) {
    return this.mockService.handleSimulateStatus(dto);
  }
}
