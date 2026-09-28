// Workspace repo paths shared between server and client. Kept dependency-free
// on purpose: workspace-shell.tsx (client) needs START_HERE_MAIN, and pulling
// it from lib/provisioning.ts drags the server-only chain (github → session →
// next/headers) into the client bundle and breaks the build.

export const PROFILE_DIR = "00-Profile";
export const START_HERE_DIR = "01-Start Here";

export const PROFILE_CONTEXT = `${PROFILE_DIR}/CONTEXT.md`;
export const PROFILE_MAIN = `${PROFILE_DIR}/profile.md`;
export const START_HERE_CONTEXT = `${START_HERE_DIR}/CONTEXT.md`;
export const START_HERE_MAIN = `${START_HERE_DIR}/Start Here.md`;

/**
 * Repo-relative path guard (moved from api/workspace/file/route.ts so the
 * create route's template-files payload can reuse it — 17 step 7). Rejects
 * traversal, absolute paths, backslashes, control chars, and empty segments.
 */
export function isValidPath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 500 &&
    !path.startsWith("/") &&
    !path.endsWith("/") &&
    !path.includes("\\") &&
    !/[\x00-\x1f]/.test(path) && // no control characters
    path.split("/").every((seg) => seg !== "" && seg !== "." && seg !== "..")
  );
}
