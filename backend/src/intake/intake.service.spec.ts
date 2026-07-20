import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IntakeService } from './intake.service';
import {
  Message,
  MessageDirection,
  MessageStatus,
} from 'src/entities/message.entity';
import { Conversation } from 'src/entities/conversation.entity';
import { TwilioService } from 'src/twillio/twilio.service';
import { IncomingSmsDto } from 'src/messages/dto/incoming-sms.dto';
import { SSE_REDIS_CHANNEL } from 'src/events/events.service';
import { QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg-protocol';
import Redis from 'ioredis';

jest.mock('ioredis');

describe('IntakeService', () => {
  let service: IntakeService;

  const mockMessageRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConversationRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTwilioService = {
    send: jest.fn(),
  };

  const mockRedisPublisher = {
    publish: jest.fn().mockResolvedValue(1),
    disconnect: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('+15550000000'),
    getOrThrow: jest.fn().mockImplementation((key: string) => {
      if (key === 'redis.host') return 'localhost';
      if (key === 'redis.port') return 6379;
      return '+15550000000';
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (Redis as unknown as jest.Mock).mockImplementation(
      () => mockRedisPublisher,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntakeService,
        { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
        {
          provide: getRepositoryToken(Conversation),
          useValue: mockConversationRepo,
        },
        { provide: TwilioService, useValue: mockTwilioService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<IntakeService>(IntakeService);
  });

  describe('processInbound', () => {
    const dto: IncomingSmsDto = {
      MessageSid: 'SM123',
      From: '+15551234567',
      To: '+15550000000',
      Body: 'Hello',
    };

    const conversation: Partial<Conversation> = {
      id: 'conv-1',
      phoneNumber: '+15551234567',
    };

    const inboundMessage: Partial<Message> = {
      id: 'msg-1',
      conversationId: 'conv-1',
      twilioMessageSid: 'SM123',
      direction: MessageDirection.INBOUND,
      body: 'Hello',
      status: MessageStatus.RECEIVED,
    };

    it('should persist inbound, send auto-reply, persist outbound, and emit event', async () => {
      mockConversationRepo.findOne.mockResolvedValue(conversation);
      mockMessageRepo.create
        .mockReturnValueOnce(inboundMessage)
        .mockReturnValueOnce({ id: 'msg-out' });
      mockMessageRepo.save.mockResolvedValue(undefined);
      mockTwilioService.send.mockResolvedValue({
        sid: 'SMout1',
        status: 'queued',
      });

      const result = await service.processInbound(dto);

      expect(result).toEqual(inboundMessage);
      expect(mockConversationRepo.findOne).toHaveBeenCalledWith({
        where: { phoneNumber: '+15551234567' },
      });
      expect(mockMessageRepo.save).toHaveBeenCalledTimes(2);
      expect(mockTwilioService.send).toHaveBeenCalledWith(
        '+15551234567',
        '+15550000000',
        'Thanks for your message! We will get back to you soon.',
      );
      expect(mockRedisPublisher.publish).toHaveBeenCalledWith(
        SSE_REDIS_CHANNEL,
        expect.stringContaining('"conversationId":"conv-1"'),
      );
    });

    it('should create conversation if it does not exist', async () => {
      mockConversationRepo.findOne.mockResolvedValue(null);
      mockConversationRepo.create.mockReturnValue(conversation);
      mockMessageRepo.create
        .mockReturnValueOnce(inboundMessage)
        .mockReturnValueOnce({ id: 'msg-out' });
      mockMessageRepo.save.mockResolvedValue(undefined);
      mockTwilioService.send.mockResolvedValue({
        sid: 'SMout1',
        status: 'queued',
      });

      await service.processInbound(dto);

      expect(mockConversationRepo.create).toHaveBeenCalledWith({
        phoneNumber: '+15551234567',
      });
      expect(mockConversationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should return null on duplicate MessageSid (23505)', async () => {
      mockConversationRepo.findOne.mockResolvedValue(conversation);
      mockMessageRepo.create.mockReturnValue(inboundMessage);

      const driverError = new DatabaseError('duplicate key', 1, 'error');
      Object.assign(driverError, { code: '23505' });
      const pgError = new QueryFailedError('query', [], driverError);
      mockMessageRepo.save.mockRejectedValueOnce(pgError);

      const result = await service.processInbound(dto);

      expect(result).toBeNull();
      expect(mockTwilioService.send).not.toHaveBeenCalled();
      expect(mockRedisPublisher.publish).not.toHaveBeenCalled();
    });

    it('should rethrow non-duplicate errors', async () => {
      mockConversationRepo.findOne.mockResolvedValue(conversation);
      mockMessageRepo.create.mockReturnValue(inboundMessage);
      mockMessageRepo.save.mockRejectedValueOnce(new Error('connection lost'));

      await expect(service.processInbound(dto)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('sendOutbound', () => {
    it('should upsert conversation, send via transport, and persist outbound message', async () => {
      const conversation: Partial<Conversation> = {
        id: 'conv-1',
        phoneNumber: '+15551234567',
      };
      mockConversationRepo.findOne.mockResolvedValue(conversation);
      mockMessageRepo.create.mockReturnValue({ id: 'msg-out' });
      mockMessageRepo.save.mockResolvedValue(undefined);
      mockTwilioService.send.mockResolvedValue({
        sid: 'SMout1',
        status: 'queued',
      });

      const result = await service.sendOutbound('+15551234567', 'Test message');

      expect(result).toEqual({ sid: 'SMout1', status: 'queued' });
      expect(mockTwilioService.send).toHaveBeenCalledWith(
        '+15551234567',
        '+15550000000',
        'Test message',
      );
      expect(mockMessageRepo.save).toHaveBeenCalledTimes(1);
    });
  });
});
