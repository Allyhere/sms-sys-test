import { Module } from '@nestjs/common';
import { MockController } from './mock.controller.js';
import { MockService } from './mock.service.js';
import { StoreModule } from '../store/store.module.js';
import { SignatureModule } from '../signature/signature.module.js';
import { WebhookModule } from '../webhook/webhook.module.js';

@Module({
  imports: [StoreModule, SignatureModule, WebhookModule],
  controllers: [MockController],
  providers: [MockService],
})
export class MockModule {}
