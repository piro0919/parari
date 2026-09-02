import Link from "next/link";

// The last row of every page. Small on purpose: it exists so no page is a
// dead end, and so there is somewhere to put the terms once they are written.
export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-6 text-sm text-ink-muted sm:px-10">
      <p>漫画を公開できるサービス。閲覧にログインは必要ありません。</p>
      <nav className="flex items-center gap-5">
        <Link href="/" className="underline-offset-4 hover:underline">
          ホーム
        </Link>
        <Link href="/new" className="underline-offset-4 hover:underline">
          投稿する
        </Link>
      </nav>
    </footer>
  );
}
