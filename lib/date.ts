// Rendered on the server, so the timezone has to be stated: Vercel runs in UTC
// and a comic posted in the evening would show yesterday's date.
export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
  });
}
