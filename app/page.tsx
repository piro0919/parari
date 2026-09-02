import Link from "next/link";
import { EpisodeCover } from "@/app/EpisodeCover";
import { formatDate } from "@/lib/date";
import { createAnonClient } from "@/lib/supabase/anon";

// No cookies are read here, so the page is one cached copy for everyone. A
// minute is close enough to "just posted" without rebuilding on every visit.
export const revalidate = 60;

const LIMIT = 24;

export default async function Home() {
  const { data: episodes } = await createAnonClient()
    .from("episodes")
    .select(
      "id, created_at, page_count, work_id, works(title), profiles!inner(handle), pages(object_key, width, height)",
    )
    .eq("status", "published")
    .eq("pages.page_index", 0)
    .order("created_at", { ascending: false })
    .limit(LIMIT);

  return (
    <main className="flex-1">
      {/* The broadsheet banner: ink block, the name set huge and tight enough
          that the letters nearly touch. Latin-only word, so the display serif
          applies cleanly. */}
      <section className="bg-ink-black px-6 py-8 text-parchment">
        {/* Sized so the six letters span the block: the banner only reads as a
            banner when the word fills it. */}
        <h1 className="font-display text-[clamp(3.5rem,26vw,21rem)] leading-[0.78] font-medium tracking-[-0.05em]">
          PARARI
        </h1>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-6">
        <div className="flex flex-col gap-6 border-b border-ink-black/25 py-11 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-base leading-relaxed">
            描いた漫画を置いておく場所です。画像を落とすだけで読める形になります。
            読む側にログインは要りません。
          </p>
          <Link
            href="/new"
            className="shrink-0 self-start rounded-tag bg-ink-black px-6 py-3 text-sm text-parchment transition hover:bg-black sm:self-auto"
          >
            置いてみる
          </Link>
        </div>

        {episodes?.length ? (
          <section className="py-11">
            <h2 className="text-sm tracking-[0.2em] text-charcoal">
              あたらしい話
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-x-[14px] gap-y-11 sm:grid-cols-3 md:grid-cols-4">
              {episodes.map((episode) => {
                // A many-to-one embed comes back as a single row, but without
                // generated database types the client still types it as an array.
                const author = [episode.profiles].flat()[0];
                const work = episode.work_id ? [episode.works].flat()[0] : null;
                return (
                  <li key={episode.id}>
                    {/* Images bleed to the edge with no radius — sharp corners
                        are the print language. */}
                    <Link
                      href={`/${author.handle}/${episode.id}`}
                      className="block overflow-hidden shadow-ink transition hover:opacity-90"
                    >
                      <EpisodeCover cover={episode.pages[0] ?? null} />
                    </Link>
                    {work ? (
                      <Link
                        href={`/${author.handle}/works/${episode.work_id}`}
                        className="mt-3.5 block text-base leading-tight underline-offset-4 hover:underline"
                      >
                        {work.title}
                      </Link>
                    ) : null}
                    {/* The handle is the other half of the loop: a reader who
                        liked one episode goes to the rest from here. */}
                    <Link
                      href={`/${author.handle}`}
                      className="mt-1 block font-display text-sm underline-offset-4 hover:underline"
                    >
                      {author.handle}
                    </Link>
                    <p className="mt-1 text-sm text-charcoal">
                      {formatDate(episode.created_at)} · {episode.page_count}
                      ページ
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
