// TODO(09-file-tree): Return the repo file tree (git trees API) for the
// left sidebar.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
