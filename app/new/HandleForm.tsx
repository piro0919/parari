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
      <p className="text-xs text-ink-muted">
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
        className="border border-line px-3 py-2 font-mono text-sm"
      />
      {state?.error ? (
        <p className="text-xs text-danger">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-ink px-6 py-2.5 text-sm text-surface transition hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "登録中…" : "決定"}
      </button>
    </form>
  );
}
