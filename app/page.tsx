import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Parari</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-black/60 dark:text-white/60">
          描いた漫画を置いておく場所です。画像を落とすだけで読める形になります。
          読む側にログインは要りません。
        </p>
      </div>
      <Link
        href="/new"
        className="rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:opacity-80 dark:bg-white dark:text-black"
      >
        置いてみる
      </Link>
    </main>
  );
}
