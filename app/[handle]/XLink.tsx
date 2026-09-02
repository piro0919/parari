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
      <div>
        {xHandle ? (
          <a
            href={`https://x.com/${xHandle}`}
            target="_blank"
            rel="me noreferrer"
          >
            @{xHandle} on X
          </a>
        ) : null}
        {isOwner ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
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
    >
      <span>x.com/</span>
      <input
        name="x_handle"
        defaultValue={xHandle ?? ""}
        autoFocus
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        disabled={pending}
      >
        保存
      </button>
      {state?.error ? (
        <span>{state.error}</span>
      ) : null}
    </form>
  );
}
