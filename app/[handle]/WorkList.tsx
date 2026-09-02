"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWork, renameWork } from "@/lib/actions";
import type { Work } from "./EpisodeControls";

// The shelf is where an author tidies, so the works they have made are listed
// here rather than on each work's own page — that one is for reading.
export function WorkList({ handle, works }: { handle: string; works: Work[] }) {
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

  if (!works.length) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xs font-medium tracking-wide text-ink-muted">
        作品
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {works.map((work) => (
          <li key={work.id} className="flex flex-wrap items-center gap-3">
            <Link
              href={`/${handle}/works/${work.id}`}
              className="text-sm underline-offset-4 hover:underline"
            >
              {work.title}
            </Link>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                const title = window.prompt("作品名を入力してください", work.title);
                if (!title?.trim() || title === work.title) return;
                run(() => renameWork(work.id, title));
              }}
              className="text-xs text-ink-muted underline-offset-4 hover:underline disabled:opacity-40"
            >
              名前を変更
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (
                  !confirm(
                    `作品「${work.title}」を削除します。話は削除されません。`,
                  )
                ) {
                  return;
                }
                run(() => deleteWork(work.id));
              }}
              className="text-xs text-danger underline-offset-4 hover:underline disabled:opacity-40"
            >
              削除
            </button>
          </li>
        ))}
      </ul>
      {error ? (
        <p className="mt-2 text-xs text-danger">{error}</p>
      ) : null}
    </section>
  );
}
