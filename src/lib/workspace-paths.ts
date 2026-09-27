// Workspace repo paths shared between server and client. Kept dependency-free
// on purpose: workspace-shell.tsx (client) needs START_HERE_MAIN, and pulling
// it from lib/provisioning.ts drags the server-only chain (github → session →
// next/headers) into the client bundle and breaks the build.

export const START_HERE_MAIN = "01-Start Here/Start Here.md";
