"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createWork,
  deleteEpisode,
  setEpisodeHidden,
  setEpisodeWork,
} from "@/lib/actions";

export type Work = { id: string; title: string };

type Props = {
  episodeId: string;
  status: string;
  workId: string | null;
  works: Work[];
};

const NEW_WORK = "__new";

const BUTTON =
  "rounded-full border border-black/15 px-2.5 py-1 text-xs transition hover:bg-black/5 disabled:opacity-40 dark:border-white/20 dark:hover:bg-white/10";

export function EpisodeControls({
  episodeId,
  status,
  workId,
  works,
}: Props) {
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

  function assign(value: string) {
    if (value === NEW_WORK) {
      const title = window.prompt("作品名");
      if (!title?.trim()) return;
      run(async () => {
        const { workId: created } = await createWork(title);
        await setEpisodeWork(episodeId, created);
      });
      return;
    }
    run(() => setEpisodeWork(episodeId, value || null));
  }

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
      {/* Grouping is a label put on afterwards, so it lives with the other
          things an author changes about an episode they already posted. */}
      <select
        value={workId ?? ""}
        disabled={pending}
        onChange={(event) => assign(event.target.value)}
        className="max-w-full rounded-full border border-black/15 px-2 py-1 text-xs disabled:opacity-40 dark:border-white/20 dark:bg-transparent"
      >
        <option value="">作品なし</option>
        {works.map((work) => (
          <option key={work.id} value={work.id}>
            {work.title}
          </option>
        ))}
        <option value={NEW_WORK}>＋ 新しい作品…</option>
      </select>
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
