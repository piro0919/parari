import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import { signOut } from "@/lib/actions";
import { EpisodeControls } from "./EpisodeControls";

export async function generateMetadata({
  params,
}: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: handle,
    description: `${handle} が置いている漫画。ログインなしで読めます。`,
  };
}

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
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="font-mono text-xl font-semibold tracking-tight">
          {profile.handle}
        </h1>
        {isOwner ? (
          // The author lands here after posting, so this is where the way to
          // post again belongs.
          <div className="flex shrink-0 items-center gap-3 text-sm">
            <Link
              href="/new"
              className="rounded-full bg-black px-4 py-2 text-xs font-medium text-white transition hover:opacity-80 dark:bg-white dark:text-black"
            >
              置く
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-black/50 underline-offset-4 hover:underline dark:text-white/50"
              >
                ログアウト
              </button>
            </form>
          </div>
        ) : null}
      </div>

      {episodes?.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {episodes.map((episode) => {
            const cover = episode.pages[0];
            const unfinished = episode.status === "processing";
            const frame = `block overflow-hidden rounded-lg border border-black/10 dark:border-white/15 ${
              isOwner && episode.status !== "published" ? "opacity-40" : ""
            }`;
            const tile = cover ? (
              // Sizes vary per page, so a plain <img> beats next/image here:
              // the file is already resized and on a CDN.
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
            );

            return (
              <li key={episode.id}>
                {/* An unfinished episode has no pages, so its page would 404.
                    Leave it as a dead tile the author can only delete. */}
                {unfinished ? (
                  <div className={frame}>{tile}</div>
                ) : (
                  <Link
                    href={`/${handle}/${episode.id}`}
                    className={`${frame} transition hover:opacity-80`}
                  >
                    {tile}
                  </Link>
                )}
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
