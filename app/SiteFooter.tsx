import Link from "next/link";

// The last row of every page. Small on purpose: it exists so no page is a
// dead end, and so there is somewhere to put the terms once they are written.
export function SiteFooter() {
  return (
    <footer>
      <p>漫画を公開できるサービス。閲覧にログインは必要ありません。</p>
      <nav>
        <Link href="/">
          ホーム
        </Link>
        <Link href="/new">
          投稿する
        </Link>
      </nav>
    </footer>
  );
}
