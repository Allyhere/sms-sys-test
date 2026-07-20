import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker/worker.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.create(WorkerModule, {
    logger: ['log', 'error', 'warn'],
  });

  await app.init();
  logger.log('SMS worker process started');

  await new Promise<void>((resolve) => {
    process.on('SIGTERM', () => {
      logger.log('SIGTERM received, shutting down worker');
      resolve();
    });
    process.on('SIGINT', () => {
      logger.log('SIGINT received, shutting down worker');
      resolve();
    });
  });

  await app.close();
  logger.log('Worker process stopped');
}

void bootstrap();
