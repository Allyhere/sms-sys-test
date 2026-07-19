import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { fetchConversation } from "../api";
import { MessageBubble } from "../components";

export default function ConversationDetail() {
  const { id } = useParams<{ id: string }>();

  const {
    data: conversation,
    isPending,
    isError,
  } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => fetchConversation(id!),
  });

  if (isPending) {
    return (
      <div
        className="flex justify-center py-20"
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        <span className="sr-only">Loading conversation…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        role="alert"
      >
        Failed to load conversation. Is the backend running?
      </div>
    );
  }

  return (
    <div>
      <Link
        to="/"
        className="text-sm text-blue-600 hover:underline focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:rounded focus-visible:outline-none"
      >
        ← Back to conversations
      </Link>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          {conversation.phoneNumber}
        </h2>
        <span className="text-sm text-gray-600">
          {conversation.messages.length}{" "}
          {conversation.messages.length === 1 ? "message" : "messages"}
        </span>
      </div>

      <div className="mt-6 space-y-4">
        {conversation.messages.length === 0 ? (
          <p className="text-center text-gray-600">
            No messages in this conversation.
          </p>
        ) : (
          conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
      </div>

      <p className="mt-8 text-center text-xs text-gray-600">
        Live updates via SSE
      </p>
    </div>
  );
}
