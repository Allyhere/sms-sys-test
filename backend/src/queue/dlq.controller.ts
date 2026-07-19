import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { DlqService } from './dlq.service';

@Controller('api/admin/dlq')
export class DlqController {
  constructor(private readonly dlqService: DlqService) {}

  @Get()
  async listJobs(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.dlqService.getFailedJobs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post(':jobId/replay')
  async replayJob(@Param('jobId') jobId: string) {
    await this.dlqService.replayJob(jobId);
    return { success: true };
  }

  @Delete(':jobId')
  async removeJob(@Param('jobId') jobId: string) {
    await this.dlqService.removeJob(jobId);
    return { success: true };
  }
}
