import Link from "next/link";
import { EpisodeCover } from "@/app/EpisodeCover";
import { createAnonClient } from "@/lib/supabase/anon";
import { formatDate } from "@/lib/date";

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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="flex flex-col items-center gap-6 py-8 text-center">
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
      </div>

      {episodes?.length ? (
        <section className="mt-12">
          <h2 className="text-xs font-medium tracking-wide text-black/40 dark:text-white/40">
            あたらしい話
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {episodes.map((episode) => {
              // A many-to-one embed comes back as a single row, but without
              // generated database types the client still types it as an array.
              const author = [episode.profiles].flat()[0];
              const work = episode.work_id ? [episode.works].flat()[0] : null;
              return (
                <li key={episode.id}>
                  <Link
                    href={`/${author.handle}/${episode.id}`}
                    className="block overflow-hidden rounded-lg border border-black/10 transition hover:opacity-80 dark:border-white/15"
                  >
                    <EpisodeCover cover={episode.pages[0] ?? null} />
                  </Link>
                  {/* The handle is the other half of the loop: a reader who
                      liked one episode goes to the rest from here. */}
                  <Link
                    href={`/${author.handle}`}
                    className="mt-1.5 block font-mono text-xs text-black/60 underline-offset-4 hover:underline dark:text-white/60"
                  >
                    {author.handle}
                  </Link>
                  {work ? (
                    <Link
                      href={`/${author.handle}/works/${episode.work_id}`}
                      className="block text-xs text-black/70 underline-offset-4 hover:underline dark:text-white/70"
                    >
                      {work.title}
                    </Link>
                  ) : null}
                  <p className="text-xs text-black/40 dark:text-white/40">
                    {formatDate(episode.created_at)} ·{" "}
                    {episode.page_count}ページ
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
