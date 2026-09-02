"use client";

import { useActionState } from "react";
import { claimHandle } from "@/lib/actions";

export function HandleForm() {
  const [state, action, pending] = useActionState(claimHandle, {
    error: null as string | null,
  });

  return (
    <form action={action}>
      <label htmlFor="handle">
        ユーザー ID を入力してください
      </label>
      <p>
        parari.kkweb.io/<span>ユーザーID</span>
        があなたのページの URL になります。登録後は変更できません。
      </p>
      <input
        id="handle"
        name="handle"
        required
        autoCapitalize="none"
        autoComplete="off"
        spellCheck={false}
        pattern="[a-z0-9_]{2,20}"
      />
      {state?.error ? (
        <p>{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
      >
        {pending ? "登録中…" : "登録"}
      </button>
    </form>
  );
}
