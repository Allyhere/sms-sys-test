import { Controller, Delete, Get, Query } from '@nestjs/common';
import { StoreService } from '../store/store.service.js';

@Controller('api/logs')
export class LogsController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  getLogs(
    @Query('direction') direction?: string,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.storeService.getLogs(
      direction as 'inbound' | 'outbound' | undefined,
      parsedLimit,
      from,
    );
  }

  @Delete()
  clearLogs() {
    this.storeService.clearLogs();
    return { cleared: true };
  }
}
