import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// R2 speaks the S3 API. Region is always "auto".
const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;

// Pages are uploaded straight from the browser, so nothing large ever passes
// through the server. Two objects per page: the WebP we serve, and the
// untouched original we keep so the delivery copy can be rebuilt later.
export function deliveryKey(episodeId: string, pageIndex: number) {
  return `${episodeId}/${String(pageIndex).padStart(3, "0")}.webp`;
}

export function originalKey(
  episodeId: string,
  pageIndex: number,
  extension: string,
) {
  return `${episodeId}/original/${String(pageIndex).padStart(3, "0")}.${extension}`;
}

export function publicUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}

export async function presignUpload(key: string, contentType: string) {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // Images are immutable once written: the key contains the episode id.
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 600 },
  );
}
