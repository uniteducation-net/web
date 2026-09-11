import { getUploadAuthParams } from "@imagekit/next/server";
import { NextResponse } from "next/server";

// Auth params for client-side uploads via `upload()` from @imagekit/next.
// The private key stays server-side; the public key is returned so the
// client doesn't need it bundled as a NEXT_PUBLIC_ variable.
export async function GET() {
  const { token, expire, signature } = getUploadAuthParams({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY!,
  });

  return NextResponse.json({
    token,
    expire,
    signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  });
}
