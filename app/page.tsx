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
      {/* No banner here: a full-width dark block on a dark canvas is nothing.
          This system separates with hairlines and lets the type carry it. */}
      <section className="border-b border-line">
        <div className="mx-auto w-full max-w-[1200px] px-6 py-24">
          <h1 className="font-display text-[clamp(2.5rem,7vw,4.5rem)] leading-none font-medium tracking-[-0.022em] text-ink-strong">
            Parari
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink-muted">
            描いた漫画を置いておく場所です。画像を落とすだけで読める形になります。
            読む側にログインは要りません。
          </p>
          {/* The single primary action on the page, and the only chromatic
              element anywhere in the system. */}
          <Link
            href="/new"
            className="mt-8 inline-block rounded-control bg-accent px-5 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
          >
            置いてみる
          </Link>
        </div>
      </section>

      {episodes?.length ? (
        <section className="mx-auto w-full max-w-[1200px] px-6 py-24">
          <h2 className="text-[13px] text-ink-muted">あたらしい話</h2>
          <ul className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {episodes.map((episode) => {
              // A many-to-one embed comes back as a single row, but without
              // generated database types the client still types it as an array.
              const author = [episode.profiles].flat()[0];
              const work = episode.work_id ? [episode.works].flat()[0] : null;
              return (
                <li key={episode.id}>
                  {/* Elevation comes from a hairline border, never a shadow. */}
                  <Link
                    href={`/${author.handle}/${episode.id}`}
                    className="block overflow-hidden rounded-panel border border-line bg-surface-raised transition hover:border-ink-muted"
                  >
                    <EpisodeCover cover={episode.pages[0] ?? null} />
                  </Link>
                  {work ? (
                    <Link
                      href={`/${author.handle}/works/${episode.work_id}`}
                      className="mt-3 block text-[15px] leading-tight text-ink underline-offset-4 hover:underline"
                    >
                      {work.title}
                    </Link>
                  ) : null}
                  {/* The handle is the other half of the loop: a reader who
                      liked one episode goes to the rest from here. */}
                  <Link
                    href={`/${author.handle}`}
                    className="mt-2 block text-[13px] text-ink underline-offset-4 hover:underline"
                  >
                    {author.handle}
                  </Link>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {formatDate(episode.created_at)} · {episode.page_count}
                    ページ
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
