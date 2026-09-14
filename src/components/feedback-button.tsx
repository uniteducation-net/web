"use client";

import { MessageSquare } from "lucide-react";
import { useCallback } from "react";

const TALLY_FORM_ID = "OD60EM";
const TALLY_FORM_URL = `https://tally.so/r/${TALLY_FORM_ID}`;
const TALLY_EMBED_SCRIPT = "https://tally.so/widgets/embed.js";

/**
 * Tally's documented hash-link trigger — keep in sync with TALLY_POPUP_OPTIONS.
 * No `tally-align-left` / `tally-layout` params: the default popup layout is
 * the fixed bottom-right panel, which is what we want.
 */
const TALLY_POPUP_HASH = `#tally-open=${TALLY_FORM_ID}&tally-width=380&tally-hide-title=1&tally-auto-close=4000&tally-form-events-forwarding=1`;

/** Same options as TALLY_POPUP_HASH, for the programmatic openPopup call. */
const TALLY_POPUP_OPTIONS = {
  width: 380,
  hideTitle: true,
  autoClose: 4000,
  formEventsForwarding: true,
} as const;

interface TallyPopupOptions {
  width?: number;
  hideTitle?: boolean;
  autoClose?: number;
  formEventsForwarding?: boolean;
}

declare global {
  interface Window {
    Tally?: {
      openPopup: (formId: string, options?: TallyPopupOptions) => void;
    };
  }
}

let embedScriptPromise: Promise<void> | null = null;

/** Lazily loads Tally's embed script on first click — never upfront. */
const loadEmbedScript = () => {
  embedScriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = TALLY_EMBED_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      embedScriptPromise = null;
      reject(new Error("Failed to load Tally embed script"));
    };
    document.body.appendChild(script);
  });
  return embedScriptPromise;
};

const FeedbackButton = () => {
  const openPopup = useCallback(async () => {
    try {
      await loadEmbedScript();
      window.Tally?.openPopup(TALLY_FORM_ID, TALLY_POPUP_OPTIONS);
    } catch {
      window.open(TALLY_FORM_URL, "_blank", "noopener");
    }
  }, []);

  return (
    <a
      href={TALLY_POPUP_HASH}
      onClick={(event) => {
        event.preventDefault();
        void openPopup();
      }}
      className="inline-flex items-center gap-2 hover:text-primary"
    >
      <MessageSquare className="size-4" />
      Feedback
    </a>
  );
};

export { FeedbackButton };
