import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { CACHE_CONTROL } from "./cache-control";

export { deliveryKey, originalKey, publicUrl } from "./keys";

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

function presign(bucket: string, key: string, contentType: string) {
  return getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      CacheControl: CACHE_CONTROL,
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

// Both buckets key everything under the episode id, so the prefix is the whole
// episode. Listing beats deriving keys from the `pages` rows: an episode that
// died mid-upload has objects in R2 and no rows at all.
async function purgePrefix(bucket: string, prefix: string) {
  let token: string | undefined;
  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: token,
      }),
    );
    const keys = listed.Contents?.map(({ Key }) => ({ Key: Key! })) ?? [];
    if (keys.length) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: keys },
        }),
      );
    }
    token = listed.NextContinuationToken;
  } while (token);
}

export async function deleteEpisodeObjects(episodeId: string) {
  const prefix = `${episodeId}/`;
  await Promise.all([
    purgePrefix(DELIVERY_BUCKET, prefix),
    purgePrefix(ORIGINALS_BUCKET, prefix),
  ]);
}
