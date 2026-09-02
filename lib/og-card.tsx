import { ImageResponse } from "next/og";
import sharp from "sharp";
import { publicUrl } from "@/lib/r2";

export const OG_SIZE = { width: 1200, height: 630 };
const COVER_WIDTH = 480;

// The delivery copy is WebP, which satori cannot read, so the cover is
// re-encoded here and inlined. Failing to fetch it is not worth losing the
// card over — the text half still says who drew this.
async function coverDataUri(key: string) {
  try {
    const response = await fetch(publicUrl(key));
    if (!response.ok) return null;

    const jpeg = await sharp(Buffer.from(await response.arrayBuffer()))
      .resize(COVER_WIDTH, OG_SIZE.height, { fit: "cover", position: "top" })
      .jpeg({ quality: 80 })
      .toBuffer();

    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

// One card for both the shelf and a single episode: the cover on the right,
// who drew it on the left. Text stays in latin — handles already are, and the
// default font that ships with `next/og` carries no Japanese glyphs.
export async function ogCard({
  handle,
  subtitle,
  coverKey,
}: {
  handle: string;
  subtitle: string;
  coverKey: string | null;
}) {
  const cover = coverKey ? await coverDataUri(coverKey) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0a0a",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 64px",
          }}
        >
          <div style={{ fontSize: 72, letterSpacing: -2 }}>{handle}</div>
          <div style={{ fontSize: 32, color: "#a1a1a1", marginTop: 16 }}>
            {subtitle}
          </div>
          <div style={{ fontSize: 24, color: "#5c5c5c", marginTop: 48 }}>
            parari.kkweb.io
          </div>
        </div>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            width={COVER_WIDTH}
            height={OG_SIZE.height}
            style={{ objectFit: "cover" }}
          />
        ) : null}
      </div>
    ),
    OG_SIZE,
  );
}
