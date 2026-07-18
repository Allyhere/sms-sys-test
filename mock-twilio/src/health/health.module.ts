import { Module } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [HealthController],
})
export class HealthModule {}
