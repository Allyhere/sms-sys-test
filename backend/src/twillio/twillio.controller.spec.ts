import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { TwillioController } from './twillio.controller';
import { Message } from 'src/entities/message.entity';
import { SmsQueueProducer } from 'src/queue/queue.producer';

describe('TwillioController', () => {
  let controller: TwillioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwillioController],
      providers: [
        {
          provide: SmsQueueProducer,
          useValue: { addJob: jest.fn() },
        },
        {
          provide: getRepositoryToken(Message),
          useValue: { update: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(false) },
        },
      ],
    }).compile();

    controller = module.get<TwillioController>(TwillioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
