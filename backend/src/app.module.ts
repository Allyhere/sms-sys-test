import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TwillioController } from './twillio/twillio.controller';
import { ConversationsController } from './conversations/conversations.controller';

@Module({
  imports: [],
  controllers: [AppController, TwillioController, ConversationsController],
  providers: [AppService],
})
export class AppModule {}
