import Link from "next/link";

// Reached by a mistyped handle or an episode that has since been taken down.
// Both are dead ends without a way back to something readable.
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <div>
        <h1 className="text-2xl font-light tracking-[-0.02em] text-ink-strong">
          ここには何もありません
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          URL が違うか、置いた人が下げたあとかもしれません。
        </p>
      </div>
      <Link
        href="/"
        className="border border-line px-5 py-2.5 text-sm transition hover:bg-ink/5"
      >
        あたらしい話を見る
      </Link>
    </main>
  );
}
