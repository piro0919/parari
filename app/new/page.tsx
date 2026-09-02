import Link from "next/link";

// 作り直し中。前の形（ログインへの誘導、ID の登録、投稿欄）は d1e67f8。
// Uploader.tsx と HandleForm.tsx はそのまま残してある。
export default function NewEpisodePage() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b border-line px-6 py-3 sm:px-10">
        <Link
          href="/"
          className="font-display text-base tracking-[-0.02em] text-ink-strong"
        >
          Parari
        </Link>
      </header>
    </main>
  );
}
