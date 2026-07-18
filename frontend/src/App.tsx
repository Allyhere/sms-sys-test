import { Outlet, useLoaderData } from "react-router-dom";
import { ConversationsProvider } from "./context";
import type { Conversation } from "./api";

export default function App() {
  const { conversations } = useLoaderData() as {
    conversations: Conversation[];
  };

  return (
    <ConversationsProvider conversations={conversations}>
      <div className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <h1 className="mx-auto max-w-5xl px-4 py-4 text-xl font-bold text-gray-900">
            SMS System Admin
          </h1>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </ConversationsProvider>
  );
}
