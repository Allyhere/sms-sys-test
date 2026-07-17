import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/conversations')
export class ConversationsController {
  @Get()
  findAll() {
    return [
      {
        id: 'a1b2c3d4-0001-4000-8000-000000000001',
        phoneNumber: '+15551234567',
        messageCount: 2,
        lastMessage: {
          id: 'a1b2c3d4-0002-4000-8000-000000000010',
          direction: 'outbound',
          body: 'Thanks for your message! You said: "Hello". We\'ll get back to you soon.',
          status: 'sent',
          createdAt: '2026-07-17T13:00:00.000Z',
          updatedAt: '2026-07-17T13:00:12.000Z',
        },
        createdAt: '2026-07-17T12:59:50.000Z',
        updatedAt: '2026-07-17T13:00:12.000Z',
      },
      {
        id: 'a1b2c3d4-0001-4000-8000-000000000002',
        phoneNumber: '+15559876543',
        messageCount: 1,
        lastMessage: {
          id: 'a1b2c3d4-0002-4000-8000-000000000020',
          direction: 'inbound',
          body: 'Hi, I need help',
          status: 'processing',
          createdAt: '2026-07-17T13:01:00.000Z',
          updatedAt: '2026-07-17T13:01:05.000Z',
        },
        createdAt: '2026-07-17T13:01:00.000Z',
        updatedAt: '2026-07-17T13:01:05.000Z',
      },
    ];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return {
      id: id,
      phoneNumber: '+15551234567',
      createdAt: '2026-07-17T12:59:50.000Z',
      updatedAt: '2026-07-17T13:00:12.000Z',
      messages: [
        {
          id: 'a1b2c3d4-0002-4000-8000-000000000001',
          twilioMessageSid: 'SM00000000000000000000000000000001',
          direction: 'inbound',
          body: 'Hello',
          status: 'sent',
          createdAt: '2026-07-17T12:59:50.000Z',
          updatedAt: '2026-07-17T12:59:50.000Z',
        },
        {
          id: 'a1b2c3d4-0002-4000-8000-000000000010',
          twilioMessageSid: 'SM00000000000000000000000000000002',
          direction: 'outbound',
          body: 'Thanks for your message! You said: "Hello". We\'ll get back to you soon.',
          status: 'sent',
          createdAt: '2026-07-17T13:00:00.000Z',
          updatedAt: '2026-07-17T13:00:12.000Z',
        },
      ],
    };
  }
}
