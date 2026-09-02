// Object keys and the public URL, with no S3 client behind them. Kept apart
// from the credentials-bearing module for the same reason as the cache header:
// so anything can import them.
export function deliveryKey(episodeId: string, pageIndex: number) {
  return `${episodeId}/${pad(pageIndex)}.webp`;
}

export function originalKey(
  episodeId: string,
  pageIndex: number,
  extension: string,
) {
  return `${episodeId}/${pad(pageIndex)}.${extension}`;
}

export function publicUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}

// `page_index` counts from 0; the key is zero-padded so the objects of an
// episode sort in reading order wherever they are listed.
function pad(pageIndex: number) {
  return String(pageIndex).padStart(3, "0");
}
