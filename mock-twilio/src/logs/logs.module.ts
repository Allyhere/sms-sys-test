import { Module } from '@nestjs/common';
import { LogsController } from './logs.controller.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [LogsController],
})
export class LogsModule {}
