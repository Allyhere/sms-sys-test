export type MessageStatus =
  | 'received'
  | 'processing'
  | 'sent'
  | 'delivered'
  | 'undelivered'
  | 'failed';

export type MessageDirection = 'inbound' | 'outbound';

export interface Message {
  id: string;
  conversationId: string;
  twilioMessageSid: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  phoneNumber: string;
  messageCount: number;
  lastMessage: Message | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  id: string;
  phoneNumber: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}
