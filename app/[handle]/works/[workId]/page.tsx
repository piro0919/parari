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
    <main>
      <SiteHeader />
      <section>
        <Link
          href={`/${handle}`}
        >
          ← {handle}
        </Link>
        <h1>
          {loaded.work.title}
        </h1>
      </section>

      <div>
        {loaded.episodes.length ? (
          <ul>
            {loaded.episodes.map((episode, index) => (
              <li
                key={episode.id}
              >
                <Link
                  href={`/${handle}/${episode.id}`}
                >
                  <EpisodeCover cover={episode.pages[0] ?? null} />
                </Link>
                <p>第{index + 1}話</p>
                <p>
                  {formatDate(episode.created_at)} · {episode.page_count}
                  ページ
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>公開中の話はありません。</p>
        )}
      </div>
      <SiteFooter />
    </main>
  );
}
