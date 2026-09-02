"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteEpisode, setEpisodeHidden } from "@/lib/actions";

type Props = { episodeId: string; status: string };

const BUTTON =
  "rounded-full border border-black/15 px-2.5 py-1 text-xs transition hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10";

export function EpisodeControls({ episodeId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "失敗しました");
      }
    });
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {status === "processing" ? (
        // Nothing to show or hide: the upload never finished, so the only
        // useful action is getting rid of it.
        <span className="text-xs text-amber-600 dark:text-amber-400">
          未完成
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(() => setEpisodeHidden(episodeId, status === "published"))
          }
          className={BUTTON}
        >
          {status === "published" ? "下げる" : "出す"}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("この話を消します。元に戻せません。")) return;
          run(() => deleteEpisode(episodeId));
        }}
        className={`${BUTTON} text-red-600 dark:text-red-400`}
      >
        削除
      </button>
      {error ? (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      ) : null}
    </div>
  );
}
