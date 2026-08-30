"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createEpisode,
  publishEpisode,
  type UploadedPage,
} from "@/lib/actions";
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
  if (!context) throw new Error("画像を変換できませんでした");
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
  if (!response.ok) throw new Error("アップロードに失敗しました");
}

export function Uploader({ handle }: { handle: string }) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(fileList: FileList | null) {
    if (!fileList?.length) return;

    // No ordering UI: file name order is what the author already uses.
    const files = Array.from(fileList)
      .filter((file) => file.type.startsWith("image/"))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    if (!files.length) {
      setError("画像が見つかりませんでした");
      return;
    }

    setError(null);
    try {
      setProgress(`変換中 0 / ${files.length}`);
      const converted: Converted[] = [];
      for (const [index, file] of files.entries()) {
        converted.push(await toWebp(file));
        setProgress(`変換中 ${index + 1} / ${files.length}`);
      }

      const { episodeId, slots } = await createEpisode(
        files.map((file, index) => ({
          pageIndex: index,
          originalExtension: file.name.split(".").pop()?.toLowerCase() || "bin",
          originalContentType: file.type,
        })),
      );

      let done = 0;
      setProgress(`送信中 0 / ${files.length}`);
      const uploaded: UploadedPage[] = await Promise.all(
        slots.map(async (slot) => {
          const page = converted[slot.pageIndex];
          const file = files[slot.pageIndex];
          await Promise.all([
            put(slot.deliveryUrl, page.blob, "image/webp"),
            put(slot.originalUrl, file, file.type),
          ]);
          done += 1;
          setProgress(`送信中 ${done} / ${files.length}`);
          return {
            pageIndex: slot.pageIndex,
            deliveryKey: slot.deliveryKey,
            originalKey: slot.originalKey,
            width: page.width,
            height: page.height,
          };
        }),
      );

      setProgress("公開しています…");
      await publishEpisode(episodeId, uploaded);
      router.push(`/${handle}/${episodeId}`);
    } catch (cause) {
      setProgress(null);
      setError(cause instanceof Error ? cause.message : "失敗しました");
    }
  }

  return (
    <div className="w-full max-w-lg">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void upload(event.dataTransfer.files);
        }}
        className={`flex h-64 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 text-center transition ${
          dragging
            ? "border-black bg-black/5 dark:border-white dark:bg-white/10"
            : "border-black/15 dark:border-white/20"
        } ${progress ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          hidden
          disabled={Boolean(progress)}
          onChange={(event) => void upload(event.target.files)}
        />
        <span className="text-sm font-medium">
          {progress ?? "画像をここに落とす"}
        </span>
        {!progress ? (
          <span className="text-xs text-black/50 dark:text-white/50">
            ファイル名の順に並びます。タイトルは要りません
          </span>
        ) : null}
      </label>
      {error ? (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
