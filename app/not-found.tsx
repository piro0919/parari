import Link from "next/link";
import { SiteFooter } from "@/app/SiteFooter";
import { SiteHeader } from "@/app/SiteHeader";

// Reached by a mistyped handle or an episode that has since been taken down.
// Both are dead ends without a way back to something readable.
export default function NotFound() {
  return (
    <main>
      <SiteHeader />
      <div>
      <div>
        <h1>
          ページが見つかりません
        </h1>
        <p>
          URL が正しくないか、投稿が削除または非公開にされた可能性があります。
        </p>
      </div>
      <Link
        href="/"
      >
        ホームに戻る
      </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
