"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { uploadEpisode } from "@/lib/upload";

// The whole page is the drop target: images need somewhere to land, not
// somewhere to type, so a permanent box would only push the work down. The row
// is here to say that dropping works at all.
export function Composer() {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const depth = useRef(0);

  async function upload(list: FileList | null) {
    if (!list?.length || progress) return;
    setError(null);
    try {
      await uploadEpisode(Array.from(list), setProgress);
      setProgress(null);
      // Stay on the shelf: the new episode appears at the top of it.
      router.refresh();
    } catch (cause) {
      setProgress(null);
      setError(cause instanceof Error ? cause.message : "失敗しました");
    }
  }

  useEffect(() => {
    // dragenter and dragleave fire for every child element, so the counter is
    // what keeps the frame from flickering as the pointer crosses the grid.
    const enter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes("Files")) return;
      depth.current += 1;
      setDragging(true);
    };
    const leave = () => {
      depth.current = Math.max(0, depth.current - 1);
      if (depth.current === 0) setDragging(false);
    };
    const over = (event: DragEvent) => event.preventDefault();
    const drop = (event: DragEvent) => {
      event.preventDefault();
      depth.current = 0;
      setDragging(false);
      void upload(event.dataTransfer?.files ?? null);
    };

    window.addEventListener("dragenter", enter);
    window.addEventListener("dragleave", leave);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragenter", enter);
      window.removeEventListener("dragleave", leave);
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  });

  return (
    <>
      <div>
        <span>
          {progress ?? "画像をドラッグ&ドロップ"}
        </span>
        {!progress ? (
          <>
            <label>
              ファイルを選択
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(event) => void upload(event.target.files)}
              />
            </label>
            <span>
              ページの順序はファイル名順です
            </span>
          </>
        ) : null}
        {error ? <span>{error}</span> : null}
      </div>

      {/* Shown only while files are over the window, so the drop target is
          visible exactly when it matters. */}
      {dragging && !progress ? (
        <div>
          <span>ここに落とす</span>
        </div>
      ) : null}
    </>
  );
}
