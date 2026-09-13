// TODO(02-auth): GitHub App authorize redirect — build the OAuth authorize URL
// with CSRF `state` and redirect to github.com/login/oauth/authorize.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
