import StatusBadge from "../StatusBadge/StatusBadge";
import type { MessageBubbleProps } from "./MessageBubble.types";

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isInbound = message.direction === "inbound";

  return (
    <div className={`flex ${isInbound ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isInbound ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white"
        }`}
      >
        <p className="whitespace-pre-wrap wrap-break-word text-sm">
          {message.body}
        </p>
        <div
          className={`mt-1.5 flex items-center gap-2 ${
            isInbound ? "text-gray-500" : "text-white/70"
          }`}
        >
          <StatusBadge status={message.status} light={!isInbound} />
          <span className="text-xs">
            {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
}
