// Vercel BotID client registration (docs: vercel.com/docs/botid/get-started).
// Lists every mutating route so the challenge headers get attached to their
// fetch/XHR calls; src/lib/botid.ts enforces server-side. GET routes and the
// GitHub OAuth navigation flow are deliberately excluded — BotID hooks
// fetch/XHR, not browser navigations.
//
// Production blocks curl/direct hits on these routes — clients must fetch
// from a real page (they already do). Local dev skips the challenge script
// entirely (the server-side wrapper bypasses too).

import { initBotId } from "botid/client/core";

if (process.env.NODE_ENV === "production") {
  initBotId({
    protect: [
      { path: "/api/newsletter", method: "POST" },
      { path: "/api/chat", method: "POST" },
      { path: "/api/agent", method: "POST" },
      { path: "/api/settings", method: "POST" },
      { path: "/api/workspace/create", method: "POST" },
      { path: "/api/workspace/file", method: "PUT" },
      { path: "/api/workspace/save-chat", method: "POST" },
      { path: "/api/auth/logout", method: "POST" },
    ],
  });
}
