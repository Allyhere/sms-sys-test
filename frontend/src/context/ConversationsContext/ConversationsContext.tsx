import { ConversationsContext } from './conversations-context';
import type { ConversationsContextValue } from './ConversationsContext.types';

export function ConversationsProvider({
  children,
  conversations,
}: ConversationsContextValue & { children: React.ReactNode }) {
  return (
    <ConversationsContext.Provider value={{ conversations }}>
      {children}
    </ConversationsContext.Provider>
  );
}
