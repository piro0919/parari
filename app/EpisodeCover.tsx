import { publicUrl } from "@/lib/r2";

export type Cover = {
  object_key: string;
  width: number;
  height: number;
} | null;

// Nothing is titled, so the first page is how a reader tells one episode from
// another. An episode still uploading has no page yet and gets the empty
// frame.
export function EpisodeCover({ cover }: { cover: Cover }) {
  if (!cover) {
    return <div />;
  }

  return (
    // Sizes vary per page, so a plain <img> beats next/image here: the file is
    // already resized and on a CDN.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={publicUrl(cover.object_key)}
      alt=""
      width={cover.width}
      height={cover.height}
      loading="lazy"
    />
  );
}
