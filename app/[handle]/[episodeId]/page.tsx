import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import { Viewer } from "./Viewer";

export async function generateMetadata({
  params,
}: PageProps<"/[handle]/[episodeId]">): Promise<Metadata> {
  const { handle, episodeId } = await params;

  // No cookies here: a link preview is the same for everyone, and reading them
  // would take this response out of the cache.
  const { data: episode } = await createAnonClient()
    .from("episodes")
    .select("page_count")
    .eq("id", episodeId)
    .maybeSingle();

  return {
    title: handle,
    description: episode
      ? `${handle} の漫画 ${episode.page_count}ページ。ログインなしで読めます。`
      : `${handle} の漫画。ログインなしで読めます。`,
  };
}

export default async function EpisodePage({
  params,
}: PageProps<"/[handle]/[episodeId]">) {
  const { handle, episodeId } = await params;
  const supabase = await createClient();

  const { data: episode } = await supabase
    .from("episodes")
    .select(
      "id, author_id, created_at, profiles!inner(handle, x_handle), pages(page_index, object_key)",
    )
    .eq("id", episodeId)
    .eq("profiles.handle", handle)
    .maybeSingle();

  if (!episode || !episode.pages.length) notFound();

  // A many-to-one embed comes back as a single row, but without generated
  // database types the client still types it as an array.
  const author = [episode.profiles].flat()[0];

  // Neighbours by date, published only: finishing one episode and having to
  // go back to the shelf for the next is exactly the friction Parari exists to
  // remove. A hidden episode is not part of the sequence a reader follows.
  const neighbour = (direction: "older" | "newer") =>
    supabase
      .from("episodes")
      .select("id")
      .eq("author_id", episode.author_id)
      .eq("status", "published")
      [direction === "older" ? "lt" : "gt"]("created_at", episode.created_at)
      .order("created_at", { ascending: direction === "newer" })
      .limit(1)
      .maybeSingle();

  const [{ data: older }, { data: newer }] = await Promise.all([
    neighbour("older"),
    neighbour("newer"),
  ]);

  const pages = [...episode.pages]
    .sort((a, b) => a.page_index - b.page_index)
    .map((page) => publicUrl(page.object_key));

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 px-4 py-3">
        <Link
          href={`/${handle}`}
          className="text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
        >
          ← {handle}
        </Link>
        {/* A reader who arrived from a tweet checks the author here: the pair
            of links is what stands in for an X login. */}
        {author.x_handle ? (
          <a
            href={`https://x.com/${author.x_handle}`}
            target="_blank"
            rel="me noreferrer"
            className="text-xs text-black/50 underline-offset-4 hover:underline dark:text-white/50"
          >
            @{author.x_handle} on X
          </a>
        ) : null}
      </header>
      <Viewer pages={pages} />
      <footer className="flex items-center justify-between gap-4 px-4 py-4 text-sm">
        {older ? (
          <Link
            href={`/${handle}/${older.id}`}
            className="text-black/60 underline-offset-4 hover:underline dark:text-white/60"
          >
            ← 前の話
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link
            href={`/${handle}/${newer.id}`}
            className="text-black/60 underline-offset-4 hover:underline dark:text-white/60"
          >
            次の話 →
          </Link>
        ) : (
          <span />
        )}
      </footer>
    </main>
  );
}
