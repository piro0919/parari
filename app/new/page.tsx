import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// 作り直し中。前の形（ログインへの誘導、ID の登録、投稿欄）は d1e67f8。
// Uploader.tsx と HandleForm.tsx はそのまま残してある。
export default async function NewEpisodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Google が渡してくる写真。項目名は provider によって揺れるので両方見る
  const avatar =
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user?.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : null;

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-6 py-3 sm:px-10">
        <Link
          href="/"
          className="font-display text-base tracking-[-0.02em] text-ink-strong"
        >
          Parari
        </Link>
        {avatar ? (
          // 角丸ゼロはこの系の決まり。丸く抜くと、ここだけ別の言葉になる
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatar}
            alt=""
            width={28}
            height={28}
            className="size-7 border border-line object-cover"
          />
        ) : null}
      </header>
    </main>
  );
}
