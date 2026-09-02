// Absolute URLs are required in link previews, and the domain is fixed. The
// override exists so a preview deployment points at itself.
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://parari.kkweb.io",
);
