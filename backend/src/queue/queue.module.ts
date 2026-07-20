import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { SMS_PROCESSING_QUEUE } from './queue.constants';
import { SMS_DLQ } from './dlq.constants';
import { SmsQueueProducer } from './queue.producer';
import { DlqService } from './dlq.service';
import { DlqController } from './dlq.controller';
import { TwillioController } from 'src/twillio/twillio.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('redis.host'),
          port: configService.getOrThrow<number>('redis.port'),
        },
      }),
    }),
    BullModule.registerQueue({ name: SMS_PROCESSING_QUEUE }),
    BullModule.registerQueue({ name: SMS_DLQ }),
    TypeOrmModule.forFeature([Message]),
  ],
  controllers: [TwillioController, DlqController],
  providers: [SmsQueueProducer, DlqService],
  exports: [SmsQueueProducer],
})
export class QueueModule {}
