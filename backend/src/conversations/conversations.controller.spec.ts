import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

const mockConversationsService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('ConversationsController', () => {
  let controller: ConversationsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        { provide: ConversationsService, useValue: mockConversationsService },
      ],
    }).compile();

    controller = module.get<ConversationsController>(ConversationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should delegate to service.findAll', async () => {
      const result = [
        {
          id: '1',
          phoneNumber: '+15551234567',
          messageCount: 2,
          lastMessage: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockConversationsService.findAll.mockResolvedValue(result);

      await expect(controller.findAll()).resolves.toBe(result);
      expect(mockConversationsService.findAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should delegate to service.findOne with the given id', async () => {
      const id = 'a1b2c3d4-0001-4000-8000-000000000001';
      const result = {
        id,
        phoneNumber: '+15551234567',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockConversationsService.findOne.mockResolvedValue(result);

      await expect(controller.findOne(id)).resolves.toBe(result);
      expect(mockConversationsService.findOne).toHaveBeenCalledWith(id);
    });
  });
});
