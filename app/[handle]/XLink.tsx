"use client";

import { useActionState, useState } from "react";
import { setXHandle } from "@/lib/actions";

// Readers only ever see the link. The author gets the field behind it, since
// the point of the pairing is that they went and linked back from X.
export function XLink({
  xHandle,
  isOwner,
}: {
  xHandle: string | null;
  isOwner: boolean;
}) {
  const [editing, setEditing] = useState(false);
  // Closing here rather than on submit: a rejected handle has to stay on
  // screen with the reason next to it.
  const [state, action, pending] = useActionState(
    async (
      previous: { error: string | null; saved: boolean },
      formData: FormData,
    ) => {
      const result = await setXHandle(previous, formData);
      if (result.saved) setEditing(false);
      return result;
    },
    { error: null as string | null, saved: false },
  );

  if (!editing) {
    return (
      <div className="mt-2 flex items-center gap-3 text-xs">
        {xHandle ? (
          <a
            href={`https://x.com/${xHandle}`}
            target="_blank"
            rel="me noreferrer"
            className="text-ink underline-offset-4 hover:underline"
          >
            @{xHandle} on X
          </a>
        ) : null}
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-ink-muted underline-offset-4 hover:underline"
          >
            {xHandle ? "変更" : "X アカウントを追加"}
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      action={action}
      className="mt-2 flex items-center gap-2 text-xs"
    >
      <span className="text-ink-muted">x.com/</span>
      <input
        name="x_handle"
        defaultValue={xHandle ?? ""}
        autoFocus
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        className="w-40 border border-line px-2 py-1 font-mono"
      />
      <button
        type="submit"
        disabled={pending}
        className="border border-line px-2.5 py-1 transition hover:bg-ink/5 disabled:opacity-40"
      >
        保存
      </button>
      {state?.error ? (
        <span className="text-danger">{state.error}</span>
      ) : null}
    </form>
  );
}
