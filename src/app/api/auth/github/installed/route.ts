// TODO(02-auth): Post-installation setup URL — record the installation id in
// the session and redirect into /workspace.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
