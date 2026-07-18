import { Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { ConversationList, ConversationDetail } from "./pages";
import { fetchConversations } from "./api";
import { ErrorBoundary } from "./components";

const spinner = (
  <div className="flex justify-center py-20">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
  </div>
);

const errorFallback = (
  <div className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
    Failed to load conversations. Is the backend running?
  </div>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    loader: async () => {
      const conversations = await fetchConversations();
      return { conversations };
    },
    ErrorBoundary: () => (
      <div className="mx-auto mt-8 max-w-md rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load data. Is the backend running?
      </div>
    ),
    children: [
      {
        index: true,
        element: (
          <ErrorBoundary fallback={errorFallback}>
            <Suspense fallback={spinner}>
              <ConversationList />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      { path: "conversations/:id", element: <ConversationDetail /> },
    ],
  },
]);
