// Provider fetch (16): when a step serves a small part of a big provider's
// site, grab that page live AT STEP CREATION and quote the small part into
// the step file with attribution (Resources repo contract:
// 20-resources/30_providers/CONTEXT.md). PDFs can't be text-extracted
// without a dependency, so they degrade to the card's description + link —
// the contract's documented fallback. Never throws: an unreachable provider
// degrades to link-out.

// Server-only module — never import from client components.

const FETCH_TIMEOUT_MS = 10_000;
const MAX_BYTES = 1_000_000;
const MAX_EXCERPT_CHARS = 2000;

export interface ProviderExcerpt {
  /** Extracted readable text, null when the page can't be used. */
  text: string | null;
  /** True when the provider page is a PDF — extraction unsupported. */
  isPdf: boolean;
}

/** Naive HTML → text: drop script/style, block tags become line breaks,
 *  strip the rest, collapse whitespace. Good enough for a quoted excerpt —
 *  the source link is always shown alongside. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|section|article|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n\n")
    .trim();
}

/**
 * Fetch one provider page and return a small readable excerpt. Caller picks
 * the card's "What we take" part; this just produces clean, capped text.
 */
export async function fetchProviderExcerpt(url: string): Promise<ProviderExcerpt> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { "user-agent": "UnitEd-Resource-Fetch/1.0" },
      redirect: "follow",
    });
    if (!res.ok) return { text: null, isPdf: false };

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) {
      return { text: null, isPdf: true };
    }

    const reader = res.body?.getReader();
    if (!reader) return { text: null, isPdf: false };
    const chunks: Uint8Array[] = [];
    let received = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.length;
      chunks.push(value);
      if (received >= MAX_BYTES) {
        await reader.cancel();
        break;
      }
    }
    const html = new TextDecoder().decode(
      Buffer.concat(chunks.map((c) => Buffer.from(c))),
    );
    const text = htmlToText(html).slice(0, MAX_EXCERPT_CHARS);
    return { text: text.length > 0 ? text : null, isPdf: false };
  } catch {
    return { text: null, isPdf: false };
  }
}
