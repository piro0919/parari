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
  " border border-line px-2.5 py-1 text-xs transition hover:bg-ink/5 disabled:opacity-40  ";

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
      const title = window.prompt("作品名を入力してください");
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
        className="max-w-full border border-line px-2 py-1 text-xs disabled:opacity-40"
      >
        <option value="">作品を選択しない</option>
        {works.map((work) => (
          <option key={work.id} value={work.id}>
            {work.title}
          </option>
        ))}
        <option value={NEW_WORK}>新しい作品を作成</option>
      </select>
      {status === "processing" ? (
        // Nothing to show or hide: the upload never finished, so the only
        // useful action is getting rid of it.
        <span className="text-xs text-ink-muted">
          アップロード未完了
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
          {status === "published" ? "非公開にする" : "公開する"}
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("この話を削除します。元に戻せません。")) return;
          run(() => deleteEpisode(episodeId));
        }}
        className={`${BUTTON} text-danger`}
      >
        削除
      </button>
      {error ? (
        <span className="text-xs text-danger">{error}</span>
      ) : null}
    </div>
  );
}
