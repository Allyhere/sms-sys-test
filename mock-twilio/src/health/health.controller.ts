import { Controller, Get } from '@nestjs/common';
import { StoreService } from '../store/store.service.js';

@Controller()
export class HealthController {
  constructor(private readonly storeService: StoreService) {}

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }

  @Get('metrics')
  getMetrics() {
    return this.storeService.getMetrics();
  }
}
