import {
  createEpisode,
  deleteEpisode,
  publishEpisode,
  type UploadedPage,
} from "@/lib/actions";
import { orderPages } from "@/lib/page-order";
import { CACHE_CONTROL } from "@/lib/r2/cache-control";

// Long edge and quality agreed up front: Twitter-bound manga is drawn around
// 2048px tall, and WebP holds thin lines and lettering better than JPEG.
const LONG_EDGE = 2048;
const QUALITY = 0.85;

type Converted = { blob: Blob; width: number; height: number };

async function toWebp(file: File): Promise<Converted> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("画像を変換できませんでした。別の画像でお試しください");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({
    type: "image/webp",
    quality: QUALITY,
  });
  return { blob, width, height };
}

async function put(url: string, blob: Blob, contentType: string) {
  const response = await fetch(url, {
    method: "PUT",
    body: blob,
    // Both headers are part of the signature, so they have to match exactly.
    headers: { "cache-control": CACHE_CONTROL, "content-type": contentType },
  });
  if (!response.ok) {
    throw new Error("アップロードに失敗しました。もう一度お試しください");
  }
}

// Conversion, upload and publish for one episode. Kept out of the component so
// the posting UI can move without the pipeline moving with it.
export async function uploadEpisode(
  dropped: readonly File[],
  onProgress: (message: string) => void,
): Promise<string> {
  const files = orderPages(dropped);
  if (!files.length) throw new Error("画像ファイルが選択されていません");

  // Held outside the try so a failure can take the row back out. An episode
  // that never finished is invisible to readers but sits on the author's
  // shelf, and the cost of dropping it is one more drop of the same files.
  let created: string | null = null;

  try {
    onProgress(`変換中 0/${files.length}`);
    const converted: Converted[] = [];
    for (const [index, file] of files.entries()) {
      converted.push(await toWebp(file));
      onProgress(`変換中 ${index + 1}/${files.length}`);
    }

    const { episodeId, slots } = await createEpisode(
      files.map((file, index) => ({
        pageIndex: index,
        originalExtension: file.name.split(".").pop()?.toLowerCase() || "bin",
        originalContentType: file.type,
      })),
    );
    created = episodeId;

    let done = 0;
    onProgress(`アップロード中 0/${files.length}`);
    const uploaded: UploadedPage[] = await Promise.all(
      slots.map(async (slot) => {
        const page = converted[slot.pageIndex];
        const file = files[slot.pageIndex];
        await Promise.all([
          put(slot.deliveryUrl, page.blob, "image/webp"),
          put(slot.originalUrl, file, file.type),
        ]);
        done += 1;
        onProgress(`アップロード中 ${done}/${files.length}`);
        return {
          pageIndex: slot.pageIndex,
          deliveryKey: slot.deliveryKey,
          originalKey: slot.originalKey,
          width: page.width,
          height: page.height,
        };
      }),
    );

    onProgress("公開処理中…");
    await publishEpisode(episodeId, uploaded);
    return episodeId;
  } catch (cause) {
    if (created) {
      // Best effort: the error the author sees is the upload's, not this.
      await deleteEpisode(created).catch(() => {});
    }
    throw cause;
  }
}
