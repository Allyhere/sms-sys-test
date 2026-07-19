import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from 'src/entities/message.entity';
import { SMS_PROCESSING_QUEUE } from './queue.constants';
import { SmsQueueProducer } from './queue.producer';
import { SmsQueueConsumer } from './queue.consumer';
import { IntakeModule } from 'src/intake/intake.module';
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
    TypeOrmModule.forFeature([Message]),
    IntakeModule,
  ],
  controllers: [TwillioController],
  providers: [SmsQueueProducer, SmsQueueConsumer],
  exports: [SmsQueueProducer],
})
export class QueueModule {}
