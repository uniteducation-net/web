// TODO(02-auth): OAuth callback — exchange code for user access token,
// verify `state`, create the encrypted cookie session, redirect to install.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
