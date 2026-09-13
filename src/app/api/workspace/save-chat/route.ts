// TODO(11-agent-panel): Persist the current agent conversation as markdown
// under chats/ in the user's repo.
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
