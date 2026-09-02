"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginButton({ next }: { next: string }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) setPending(false);
  }

  return (
    <button
      type="button"
      onClick={signIn}
      disabled={pending}
      className="flex items-center gap-3 border border-line px-6 py-3 text-sm transition hover:bg-ink/5 disabled:opacity-50"
    >
      {/* ブランドの取り扱いガイドラインは、独自のボタンにも Google の「G」を
          標準色・縦横比のままで入れることを求めている。ロゴは 200x204 で正方形
          ではないので、高さだけ指定して幅は比率に任せる。
          色と書体は指定（塗り #FFFFFF / Roboto Medium）に寄せず、サイトの側に
          合わせている。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/google-g.png"
        alt=""
        width={53}
        height={54}
        className="h-[18px] w-auto"
      />
      {pending ? "ログインしています…" : "Google でログイン"}
    </button>
  );
}
