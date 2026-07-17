import { Test, TestingModule } from '@nestjs/testing';
import { TwillioController } from './twillio.controller';

describe('TwillioController', () => {
  let controller: TwillioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwillioController],
    }).compile();

    controller = module.get<TwillioController>(TwillioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
