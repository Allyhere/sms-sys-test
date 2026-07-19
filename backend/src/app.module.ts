import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { IntakeModule } from 'src/intake/intake.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { HealthModule } from 'src/health/health.module';
import configuration from 'src/config/configuration';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { QueueModule } from 'src/queue/queue.module';
import { EventsModule } from 'src/events/events.module';
import Redis from 'ioredis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.getOrThrow<number>('rateLimit.ttl'),
            limit: config.getOrThrow<number>('rateLimit.limit'),
          },
        ],
        storage: new ThrottlerStorageRedisService(
          new Redis({
            host: config.getOrThrow<string>('redis.host'),
            port: config.getOrThrow<number>('redis.port'),
          }),
        ),
      }),
    }),
    DatabaseModule,
    IntakeModule,
    ConversationsModule,
    HealthModule,
    QueueModule,
    EventsModule,
    ConfigModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
