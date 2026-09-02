import Link from "next/link";

// ロゴと投稿への導線だけ。見た目は付けていない——並べ方（左右振り分けと
// 上下の余白、下の罫）以外のクラスは、デザインを決めてから足す。
// cookie を読まないので、これを載せたページはキャッシュできる。
export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/">Parari</Link>
      <Link href="/new">投稿する</Link>
    </header>
  );
}
