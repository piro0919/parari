import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EpisodeCover } from "@/app/EpisodeCover";
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
      ? `${handle} の「${loaded.work.title}」。ログインなしで読めます。`
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
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <Link
        href={`/${handle}`}
        className="font-mono text-xs text-black/50 underline-offset-4 hover:underline dark:text-white/50"
      >
        ← {handle}
      </Link>
      <h1 className="mt-1 text-xl font-semibold tracking-tight">
        {loaded.work.title}
      </h1>

      {loaded.episodes.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {loaded.episodes.map((episode, index) => (
            <li key={episode.id}>
              <Link
                href={`/${handle}/${episode.id}`}
                className="block overflow-hidden rounded-lg border border-black/10 transition hover:opacity-80 dark:border-white/15"
              >
                <EpisodeCover cover={episode.pages[0] ?? null} />
              </Link>
              <p className="mt-1.5 text-xs text-black/50 dark:text-white/50">
                {index + 1}話 · {formatDate(episode.created_at)} ·{" "}
                {episode.page_count}ページ
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-black/50 dark:text-white/50">
          まだ何もありません。
        </p>
      )}
    </main>
  );
}
