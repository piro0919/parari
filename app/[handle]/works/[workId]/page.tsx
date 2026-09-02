import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeCover } from "@/app/EpisodeCover";
import { SiteFooter } from "@/app/SiteFooter";
import { SiteHeader } from "@/app/SiteHeader";
import { formatDate } from "@/lib/date";
import { createAnonClient } from "@/lib/supabase/anon";

// A work is read front to back, so this page is one cached copy for everyone
// and never shows an episode the author has taken down.
export const revalidate = 60;

async function load(handle: string, workId: string) {
  const supabase = createAnonClient();

  const { data: work } = await supabase
    .from("works")
    .select("id, title, profiles!inner(handle)")
    .eq("id", workId)
    .eq("profiles.handle", handle)
    .maybeSingle();

  if (!work) return null;

  const { data: episodes } = await supabase
    .from("episodes")
    .select("id, created_at, page_count, pages(object_key, width, height)")
    .eq("work_id", workId)
    .eq("status", "published")
    .eq("pages.page_index", 0)
    // Oldest first: this is the order it was drawn in, which is the order it
    // is read in.
    .order("created_at", { ascending: true });

  return { work, episodes: episodes ?? [] };
}

export async function generateMetadata({
  params,
}: PageProps<"/[handle]/works/[workId]">): Promise<Metadata> {
  const { handle, workId } = await params;
  const loaded = await load(handle, workId);

  return {
    title: loaded ? `${loaded.work.title} · ${handle}` : handle,
    description: loaded
      ? `${handle} が公開している「${loaded.work.title}」。ログイン不要で閲覧できます。`
      : undefined,
  };
}

export default async function WorkPage({
  params,
}: PageProps<"/[handle]/works/[workId]">) {
  const { handle, workId } = await params;
  const loaded = await load(handle, workId);

  if (!loaded) notFound();

  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader />
      <section className="border-b-2 border-line px-6 py-14 sm:px-10">
        <Link
          href={`/${handle}`}
          className="font-label text-xs tracking-[0.1em] text-ink-muted uppercase underline-offset-4 hover:underline"
        >
          ← {handle}
        </Link>
        <h1 className="mt-3 text-[clamp(2rem,5vw,2.5rem)] leading-tight font-light tracking-[-0.02em] text-ink-strong">
          {loaded.work.title}
        </h1>
      </section>

      <div className="px-6 py-14 sm:px-10">
        {loaded.episodes.length ? (
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {loaded.episodes.map((episode, index) => (
              <li
                key={episode.id}
                className="border-t border-l border-line p-4 [&:nth-child(2n)]:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(3n)]:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(4n)]:border-r"
              >
                <Link
                  href={`/${handle}/${episode.id}`}
                  className="block transition hover:opacity-80"
                >
                  <EpisodeCover cover={episode.pages[0] ?? null} />
                </Link>
                <p className="mt-3 text-sm">第{index + 1}話</p>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(episode.created_at)} · {episode.page_count}
                  ページ
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">公開中の話はありません。</p>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
