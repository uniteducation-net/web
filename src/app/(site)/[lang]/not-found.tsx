import { NotFoundView } from "@/components/not-found-view";

/**
 * Localized 404, rendered inside the site layout (header/footer, ImageKit
 * provider). Receives no props — the view reads the locale from `<html lang>`.
 * "/" is proxied to the negotiated locale, so it works as the home link.
 */
export default function NotFound() {
  return <NotFoundView homeHref="/" />;
}
