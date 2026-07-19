export const MESSAGE_PROCESSED_EVENT = 'message.processed';

export interface MessageProcessedPayload {
  message: {
    id: string;
    conversationId: string;
    twilioMessageSid: string;
    direction: string;
    body: string;
    status: string;
  };
  conversationId: string;
}
