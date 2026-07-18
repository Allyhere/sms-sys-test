import { BASE_URL } from './client.constants';
import type { Conversation, ConversationDetail } from './client.types';

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function fetchConversations(): Promise<Conversation[]> {
  return request<Conversation[]>('/conversations');
}

export function fetchConversation(id: string): Promise<ConversationDetail> {
  return request<ConversationDetail>(`/conversations/${id}`);
}
