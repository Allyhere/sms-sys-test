import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { TwilioErrorFilter } from './filters/twilio-error.filter.js';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('MockTwilio');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.useGlobalFilters(new TwilioErrorFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port')!;

  await app.listen(port);
  logger.log(`Mock Twilio service running on port ${port}`);
}

void bootstrap();
