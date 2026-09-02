import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import { EpisodeControls } from "./EpisodeControls";

export default async function AuthorPage({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  // Only the first page of each episode: the cover is how a reader tells
  // episodes apart, since nothing is titled.
  let query = supabase
    .from("episodes")
    .select("id, created_at, page_count, status, pages(object_key, width, height)")
    .eq("author_id", profile.id)
    .eq("pages.page_index", 0)
    .order("created_at", { ascending: false });

  // The author sees the whole shelf — what is down and what never finished
  // uploading — because this page is also where they clean it up.
  if (!isOwner) query = query.eq("status", "published");

  const { data: episodes } = await query;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <h1 className="font-mono text-xl font-semibold tracking-tight">
        {profile.handle}
      </h1>

      {episodes?.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {episodes.map((episode) => {
            const cover = episode.pages[0];
            const dimmed = isOwner && episode.status !== "published";
            return (
              <li key={episode.id}>
                <Link
                  href={`/${handle}/${episode.id}`}
                  className={`block overflow-hidden rounded-lg border border-black/10 transition hover:opacity-80 dark:border-white/15 ${
                    dimmed ? "opacity-40" : ""
                  }`}
                >
                  {cover ? (
                    // Sizes vary per page, so a plain <img> beats next/image
                    // here: the file is already resized and on a CDN.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={publicUrl(cover.object_key)}
                      alt=""
                      width={cover.width}
                      height={cover.height}
                      loading="lazy"
                      className="h-auto w-full"
                    />
                  ) : (
                    <div className="aspect-[3/4] w-full bg-black/5 dark:bg-white/10" />
                  )}
                </Link>
                <p className="mt-1.5 text-xs text-black/50 dark:text-white/50">
                  {new Date(episode.created_at).toLocaleDateString("ja-JP")} ·{" "}
                  {episode.page_count}ページ
                  {episode.status === "hidden" ? " · 下書き" : ""}
                </p>
                {isOwner ? (
                  <EpisodeControls
                    episodeId={episode.id}
                    status={episode.status}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-black/50 dark:text-white/50">
          まだ何もありません。
        </p>
      )}
    </main>
  );
}
