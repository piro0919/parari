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

// Two buckets on purpose. The delivery bucket is world-readable; the originals
// bucket is not. Keeping them together would let anyone derive the full-size
// key from the delivery key and pull the uncompressed art.
const DELIVERY_BUCKET = process.env.R2_BUCKET!;
const ORIGINALS_BUCKET = process.env.R2_ORIGINALS_BUCKET!;

export function deliveryKey(episodeId: string, pageIndex: number) {
  return `${episodeId}/${String(pageIndex).padStart(3, "0")}.webp`;
}

export function originalKey(
  episodeId: string,
  pageIndex: number,
  extension: string,
) {
  return `${episodeId}/${String(pageIndex).padStart(3, "0")}.${extension}`;
}

export function publicUrl(key: string) {
  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}

function presign(bucket: string, key: string, contentType: string) {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      // Images are immutable once written: the key contains the episode id.
      CacheControl: "public, max-age=31536000, immutable",
    }),
    { expiresIn: 600 },
  );
}

export function presignDelivery(key: string) {
  return presign(DELIVERY_BUCKET, key, "image/webp");
}

export function presignOriginal(key: string, contentType: string) {
  return presign(ORIGINALS_BUCKET, key, contentType);
}
