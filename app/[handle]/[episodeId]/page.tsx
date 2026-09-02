import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import { SiteFooter } from "@/app/SiteFooter";
import { SiteHeader } from "@/app/SiteHeader";
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
      ? `${handle} が公開している漫画（全${episode.page_count}ページ）。ログイン不要で閲覧できます。`
      : `${handle} が公開している漫画。ログイン不要で閲覧できます。`,
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
      "id, author_id, created_at, work_id, works(title), profiles!inner(handle, x_handle), pages(page_index, object_key)",
    )
    .eq("id", episodeId)
    .eq("profiles.handle", handle)
    .maybeSingle();

  if (!episode || !episode.pages.length) notFound();

  // A many-to-one embed comes back as a single row, but without generated
  // database types the client still types it as an array.
  const author = [episode.profiles].flat()[0];
  const work = episode.work_id ? [episode.works].flat()[0] : null;

  // Neighbours by date, published only: finishing one episode and having to
  // go back to the shelf for the next is exactly the friction Parari exists to
  // remove. A hidden episode is not part of the sequence a reader follows.
  const neighbour = (direction: "older" | "newer") => {
    const query = supabase
      .from("episodes")
      .select("id")
      .eq("author_id", episode.author_id)
      .eq("status", "published")
      [direction === "older" ? "lt" : "gt"]("created_at", episode.created_at)
      .order("created_at", { ascending: direction === "newer" })
      .limit(1);

    // Inside a work, the next episode is the next one of that work — a reader
    // following a series should not be dropped into an unrelated one-shot.
    return (
      episode.work_id ? query.eq("work_id", episode.work_id) : query
    ).maybeSingle();
  };

  const [{ data: older }, { data: newer }] = await Promise.all([
    neighbour("older"),
    neighbour("newer"),
  ]);

  const pages = [...episode.pages]
    .sort((a, b) => a.page_index - b.page_index)
    .map((page) => publicUrl(page.object_key));

  return (
    <main>
      <SiteHeader />
      <header>
        <Link
          href={`/${handle}`}
        >
          ← {handle}
        </Link>
        {work ? (
          <Link
            href={`/${handle}/works/${episode.work_id}`}
          >
            {work.title}
          </Link>
        ) : null}
        {/* A reader who arrived from a tweet checks the author here: the pair
            of links is what stands in for an X login. */}
        {author.x_handle ? (
          <a
            href={`https://x.com/${author.x_handle}`}
            target="_blank"
            rel="me noreferrer"
          >
            @{author.x_handle} on X
          </a>
        ) : null}
      </header>
      <Viewer pages={pages} />
      {/* Nothing to show when an episode stands alone; an empty rule reads as
          a missing link. */}
      {older || newer ? (
        <footer>
          {older ? (
            <Link
              href={`/${handle}/${older.id}`}
            >
              ← 前の話
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link
              href={`/${handle}/${newer.id}`}
            >
              次の話 →
            </Link>
          ) : (
            <span />
          )}
        </footer>
      ) : null}
      <SiteFooter />
    </main>
  );
}
