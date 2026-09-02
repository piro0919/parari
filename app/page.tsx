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
      {/* A contact sheet, not a landing page: a rule across the top, the name
          set light and large, and nothing else competing with the covers. */}
      <section className="border-b-2 border-line px-6 py-20 sm:px-10">
        <h1 className=" text-[clamp(2.5rem,6vw,2.7rem)] leading-tight font-light tracking-[-0.02em] text-ink-strong">
          Parari
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed">
          {/* 日本語は JSX の改行が空白になるので、一文を折り返さずに置く */}
          漫画を公開できるサービスです。画像をアップロードするだけで読める形に変換されます。閲覧にログインは必要ありません。
        </p>
        {/* No accent colour exists in this system, so the one action is a
            bordered rectangle like everything else. */}
        <Link
          href="/new"
          className="mt-8 inline-block border border-line px-6 py-2.5 font-label text-sm tracking-[0.1em] uppercase transition hover:bg-ink hover:text-surface"
        >
          投稿する
        </Link>
      </section>

      {episodes?.length ? (
        <section className="px-6 py-16 sm:px-10">
          <h2 className="font-label text-xs tracking-[0.1em] text-ink-muted uppercase">
            新着
          </h2>
          {/* Cells of a grid, divided by rules rather than boxed as cards. */}
          {/* Rules are drawn by the cells themselves, so an incomplete row
              ends where the cells end instead of trailing off. */}
          <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {episodes.map((episode) => {
              // A many-to-one embed comes back as a single row, but without
              // generated database types the client still types it as an array.
              const author = [episode.profiles].flat()[0];
              const work = episode.work_id ? [episode.works].flat()[0] : null;
              return (
                <li
                  key={episode.id}
                  className="border-t border-l border-line p-4 last:border-r [&:nth-child(2n)]:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(3n)]:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(4n)]:border-r"
                >
                  <Link
                    href={`/${author.handle}/${episode.id}`}
                    className="block transition hover:opacity-80"
                  >
                    <EpisodeCover cover={episode.pages[0] ?? null} />
                  </Link>
                  {work ? (
                    <Link
                      href={`/${author.handle}/works/${episode.work_id}`}
                      className="mt-3 block text-base leading-tight underline-offset-4 hover:underline"
                    >
                      {work.title}
                    </Link>
                  ) : null}
                  {/* The handle is the other half of the loop: a reader who
                      liked one episode goes to the rest from here. */}
                  <Link
                    href={`/${author.handle}`}
                    className="mt-1 block font-label text-sm tracking-[0.06em] uppercase underline-offset-4 hover:underline"
                  >
                    {author.handle}
                  </Link>
                  <p className="mt-1 text-sm text-ink-muted">
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
