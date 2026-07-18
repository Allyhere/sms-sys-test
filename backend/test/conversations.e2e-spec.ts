import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { ConversationsController } from './../src/conversations/conversations.controller';
import { ConversationsService } from './../src/conversations/conversations.service';

describe('ConversationsController (e2e)', () => {
  let app: INestApplication<App>;

  const mockConversationsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [
        {
          provide: ConversationsService,
          useValue: mockConversationsService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/conversations', () => {
    it('should return 200 and a list of conversations', async () => {
      const conversations = [
        {
          id: 'a1b2c3d4-0001-4000-8000-000000000001',
          phoneNumber: '+15551234567',
          messageCount: 2,
          lastMessage: {
            id: 'a1b2c3d4-0002-4000-8000-000000000010',
            direction: 'outbound',
            body: 'Hello back',
            status: 'sent',
            createdAt: '2026-07-17T13:00:00.000Z',
            updatedAt: '2026-07-17T13:00:12.000Z',
          },
          createdAt: '2026-07-17T12:59:50.000Z',
          updatedAt: '2026-07-17T13:00:12.000Z',
        },
      ];
      mockConversationsService.findAll.mockResolvedValue(conversations);

      await request(app.getHttpServer())
        .get('/api/conversations')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(conversations);
        });

      expect(mockConversationsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return 200 with empty array when no conversations exist', async () => {
      mockConversationsService.findAll.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/conversations')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual([]);
        });
    });
  });

  describe('GET /api/conversations/:id', () => {
    it('should return 200 and a single conversation with messages', async () => {
      const id = 'a1b2c3d4-0001-4000-8000-000000000001';
      const conversation = {
        id,
        phoneNumber: '+15551234567',
        createdAt: '2026-07-17T12:59:50.000Z',
        updatedAt: '2026-07-17T13:00:12.000Z',
        messages: [
          {
            id: 'a1b2c3d4-0002-4000-8000-000000000001',
            twilioMessageSid: 'SM00000000000000000000000000000001',
            direction: 'inbound',
            body: 'Hello',
            status: 'received',
            createdAt: '2026-07-17T12:59:50.000Z',
            updatedAt: '2026-07-17T12:59:50.000Z',
          },
        ],
      };
      mockConversationsService.findOne.mockResolvedValue(conversation);

      await request(app.getHttpServer())
        .get(`/api/conversations/${id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(conversation);
        });

      expect(mockConversationsService.findOne).toHaveBeenCalledWith(id);
    });

    it('should return 200 with empty body when conversation is not found', async () => {
      mockConversationsService.findOne.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/conversations/nonexistent-id')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });
  });
});
