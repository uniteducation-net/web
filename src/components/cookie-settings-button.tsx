"use client";

import { Cookie } from "lucide-react";

import { requestConsentSettings } from "@/lib/consent";

/**
 * Re-opens the cookie banner so visitors can review or withdraw their
 * choices — withdrawing consent must be as easy as giving it (GDPR).
 * Client island inside the otherwise server-rendered footer.
 */
const CookieSettingsButton = ({ label }: { label: string }) => {
  return (
    <button
      type="button"
      onClick={requestConsentSettings}
      className="inline-flex cursor-pointer items-center gap-2 hover:text-primary"
    >
      <Cookie className="size-4" />
      {label}
    </button>
  );
};

export { CookieSettingsButton };
