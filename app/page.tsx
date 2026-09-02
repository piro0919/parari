import { SiteHeader } from "@/app/SiteHeader";

// 作り直し中。前の形（大見出し＋説明＋新着の格子）は d1e67f8。
export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader />
    </main>
  );
}
