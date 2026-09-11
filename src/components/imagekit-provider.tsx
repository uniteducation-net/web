"use client";

import { ImageKitProvider } from "@imagekit/next";
import type { ReactNode } from "react";

const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

if (!urlEndpoint) {
  throw new Error(
    "NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT is not set. Add it to .env.local (e.g. https://ik.imagekit.io/your_imagekit_id).",
  );
}

export function ImageKitClientProvider({ children }: { children: ReactNode }) {
  return (
    <ImageKitProvider urlEndpoint={urlEndpoint}>{children}</ImageKitProvider>
  );
}
