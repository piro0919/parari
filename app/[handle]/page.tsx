import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { signOut } from "@/lib/actions";
import { EpisodeCover } from "@/app/EpisodeCover";
import { EpisodeControls } from "./EpisodeControls";
import { WorkList } from "./WorkList";
import { XLink } from "./XLink";

export async function generateMetadata({
  params,
}: PageProps<"/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  return {
    title: handle,
    description: `${handle} が置いている漫画。ログインなしで読めます。`,
  };
}

const PER_PAGE = 48;

export default async function AuthorPage({
  params,
  searchParams,
}: PageProps<"/[handle]">) {
  const { handle } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, x_handle")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  // Only the first page of each episode: the cover is how a reader tells
  // episodes apart, since nothing is titled.
  // Bounded on purpose: a shelf that has been filling up for years should not
  // hand back every row and every cover in one response.
  let query = supabase
    .from("episodes")
    .select(
      "id, created_at, page_count, status, work_id, works(title), pages(object_key, width, height)",
      { count: "exact" },
    )
    .eq("author_id", profile.id)
    .eq("pages.page_index", 0)
    .order("created_at", { ascending: false })
    .range((page - 1) * PER_PAGE, page * PER_PAGE - 1);

  // The author sees the whole shelf — what is down and what never finished
  // uploading — because this page is also where they clean it up.
  if (!isOwner) query = query.eq("status", "published");

  const { data: episodes, count } = await query;
  const hasNext = (count ?? 0) > page * PER_PAGE;

  // Only the author picks works, so only the author needs the list.
  const { data: works } = isOwner
    ? await supabase
        .from("works")
        .select("id, title")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs text-black/40 underline-offset-4 hover:underline dark:text-white/40"
          >
            Parari
          </Link>
          <h1 className="mt-1 font-mono text-xl font-semibold tracking-tight">
            {profile.handle}
          </h1>
          <XLink xHandle={profile.x_handle} isOwner={isOwner} />
        </div>
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

      {isOwner ? <WorkList handle={handle} works={works ?? []} /> : null}

      {episodes?.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {episodes.map((episode) => {
            const cover = episode.pages[0];
            const unfinished = episode.status === "processing";
            const frame = `block overflow-hidden rounded-lg border border-black/10 dark:border-white/15 ${
              isOwner && episode.status !== "published" ? "opacity-40" : ""
            }`;
            const tile = <EpisodeCover cover={cover ?? null} />;
            // A many-to-one embed comes back as a single row, but without
            // generated database types the client still types it as an array.
            const work = episode.work_id ? [episode.works].flat()[0] : null;

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
                {work ? (
                  <Link
                    href={`/${handle}/works/${episode.work_id}`}
                    className="mt-1.5 block text-xs text-black/70 underline-offset-4 hover:underline dark:text-white/70"
                  >
                    {work.title}
                  </Link>
                ) : null}
                <p className="mt-1.5 text-xs text-black/50 dark:text-white/50">
                  {formatDate(episode.created_at)} ·{" "}
                  {episode.page_count}ページ
                  {episode.status === "hidden" ? " · 下書き" : ""}
                </p>
                {isOwner ? (
                  <EpisodeControls
                    episodeId={episode.id}
                    status={episode.status}
                    workId={episode.work_id}
                    works={works ?? []}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-black/50 dark:text-white/50">
          {page === 1 ? "まだ何もありません。" : "このページには何もありません。"}
        </p>
      )}

      {page > 1 || hasNext ? (
        <nav className="mt-10 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link
              href={page === 2 ? `/${handle}` : `/${handle}?page=${page - 1}`}
              className="text-black/60 underline-offset-4 hover:underline dark:text-white/60"
            >
              ← 新しい方へ
            </Link>
          ) : (
            <span />
          )}
          {hasNext ? (
            <Link
              href={`/${handle}?page=${page + 1}`}
              className="text-black/60 underline-offset-4 hover:underline dark:text-white/60"
            >
              古い方へ →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </main>
  );
}
