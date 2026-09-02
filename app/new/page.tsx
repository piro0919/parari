import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// 作り直し中。前の形（ログインへの誘導、ID の登録、投稿欄）は d1e67f8。
// 投稿の処理は lib/upload.ts、投稿口は置き場（/[handle]）へ移した。
// HandleForm.tsx（ID の登録）はここに残っている。
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
    <main>
      <header>
        <Link
          href="/"
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
          />
        ) : null}
      </header>
    </main>
  );
}
