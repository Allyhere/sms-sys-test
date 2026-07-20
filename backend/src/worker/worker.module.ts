import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { IntakeModule } from 'src/intake/intake.module';
import configuration from 'src/config/configuration';
import { SMS_PROCESSING_QUEUE } from 'src/queue/queue.constants';
import { SMS_DLQ } from 'src/queue/dlq.constants';
import { SmsQueueConsumer } from 'src/queue/queue.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
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
    IntakeModule,
  ],
  providers: [SmsQueueConsumer],
})
export class WorkerModule {}
