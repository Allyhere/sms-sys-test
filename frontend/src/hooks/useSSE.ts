import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BASE_URL } from "../api/client/client.constants";

interface SsePayload {
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

export function useSSE() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const eventSource = new EventSource(`${BASE_URL}/events/sse`);

    eventSource.addEventListener("message.processed", (event) => {
      const payload = JSON.parse(event.data) as SsePayload;

      void queryClient.refetchQueries({ queryKey: ["conversations"] });
      void queryClient.refetchQueries({
        queryKey: ["conversation", payload.conversationId],
      });
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects; nothing to do here
    };

    return () => {
      eventSource.close();
    };
  }, [queryClient]);
}
