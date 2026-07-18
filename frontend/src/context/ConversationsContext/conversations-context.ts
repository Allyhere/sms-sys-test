import { createContext, useContext } from 'react';
import type { ConversationsContextValue } from './ConversationsContext.types';

export const ConversationsContext = createContext<ConversationsContextValue | undefined>(undefined);

export function useConversations() {
  const ctx = useContext(ConversationsContext);
  if (!ctx) {
    throw new Error('useConversations must be used within ConversationsProvider');
  }
  return ctx;
}
