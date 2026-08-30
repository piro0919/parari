// Signed into the upload URL, so the browser has to send it back verbatim on
// the PUT or R2 stores the object without it and the CDN re-fetches on every
// miss. Kept apart from the S3 client so the browser can import it without
// pulling the credentials-bearing module into the bundle.
export const CACHE_CONTROL = "public, max-age=31536000, immutable";
