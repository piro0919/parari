"use client";

import { useActionState } from "react";
import { claimHandle } from "@/lib/actions";

export function HandleForm() {
  const [state, action, pending] = useActionState(claimHandle, {
    error: null as string | null,
  });

  return (
    <form action={action} className="flex w-full max-w-sm flex-col gap-3">
      <label htmlFor="handle" className="text-sm font-medium">
        あなたの ID を決めてください
      </label>
      <p className="text-xs text-black/50 dark:text-white/50">
        parari.kkweb.io/<span className="font-mono">あなたのID</span>{" "}
        があなたの置き場になります。あとから変えられません。
      </p>
      <input
        id="handle"
        name="handle"
        required
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        pattern="[a-z0-9_]{2,20}"
        className="rounded-lg border border-black/15 px-3 py-2 font-mono text-sm dark:border-white/20 dark:bg-transparent"
      />
      {state?.error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:opacity-80 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {pending ? "登録中…" : "決定"}
      </button>
    </form>
  );
}
