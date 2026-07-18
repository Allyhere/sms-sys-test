import { Module } from '@nestjs/common';
import { MessagesModule } from 'src/messages/messages.module';
import { ConversationsModule } from 'src/conversations/conversations.module';
import { HealthModule } from 'src/health/health.module';
import configuration from 'src/config/configuration';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    MessagesModule,
    ConversationsModule,
    HealthModule,
    ConfigModule,
  ],
})
export class AppModule {}
