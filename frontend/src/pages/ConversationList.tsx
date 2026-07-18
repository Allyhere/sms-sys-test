import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchConversations, type Conversation } from "../api";
import { StatusBadge } from "../components";
import { useConversations } from "../context";

export default function ConversationList() {
  const navigate = useNavigate();
  const { conversations: initialConversations } = useConversations();
  const { data: conversations } = useSuspenseQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    initialData: initialConversations,
    refetchInterval: 5_000,
  });

  if (conversations.length === 0) {
    return (
      <div className="mx-auto mt-8 max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-gray-600">No conversations yet</p>
        <p className="mt-2 text-sm text-gray-600">
          Try sending a test message:
        </p>
        <code className="mt-2 block rounded bg-gray-100 px-3 py-2 text-sm text-gray-700">
          POST http://localhost:4000/simulate-inbound
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv: Conversation) => (
        <button
          key={conv.id}
          onClick={() => navigate(`/conversations/${conv.id}`)}
          aria-label={`Conversation with ${conv.phoneNumber}, ${conv.messageCount} ${conv.messageCount === 1 ? "message" : "messages"}`}
          className="block w-full cursor-pointer rounded-lg border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{conv.phoneNumber}</h3>
            <span className="text-sm text-gray-500">
              {conv.messageCount}{" "}
              {conv.messageCount === 1 ? "message" : "messages"}
            </span>
          </div>

          {conv.lastMessage && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
              <span className="font-mono">
                {conv.lastMessage.direction === "inbound" ? "←" : "→"}
              </span>
              <span className="truncate">{conv.lastMessage.body}</span>
            </div>
          )}

          {conv.lastMessage && (
            <div className="mt-2 flex items-center justify-between">
              <StatusBadge status={conv.lastMessage.status} />
              <span className="text-xs text-gray-600">
                {new Date(conv.lastMessage.createdAt).toLocaleTimeString()}
              </span>
            </div>
          )}

          <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-600">
            Updated {new Date(conv.updatedAt).toLocaleString()}
          </div>
        </button>
      ))}
    </div>
  );
}
