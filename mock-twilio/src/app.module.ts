import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module.js';
import { MockModule } from './mock/mock.module.js';
import { LogsModule } from './logs/logs.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [ConfigModule, MockModule, LogsModule, HealthModule],
})
export class AppModule {}
