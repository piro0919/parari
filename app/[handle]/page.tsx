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
    description: `${handle} が公開している漫画の一覧。ログイン不要で閲覧できます。`,
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
    <main className="flex-1">
      <section className="border-b-2 border-line px-6 py-14 sm:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Link
              href="/"
              className="font-label text-xs tracking-[0.1em] text-ink-muted uppercase underline-offset-4 hover:underline"
            >
              Parari
            </Link>
            <h1 className="mt-3 text-[clamp(2rem,5vw,2.5rem)] leading-tight font-light tracking-[-0.02em] text-ink-strong">
              {profile.handle}
            </h1>
            <XLink xHandle={profile.x_handle} isOwner={isOwner} />
          </div>
          {isOwner ? (
            // The author lands here after posting, so this is where the way to
            // post again belongs.
            <div className="flex shrink-0 items-center gap-4">
              <Link
                href="/new"
                className="border border-line px-5 py-2 font-label text-sm tracking-[0.1em] uppercase transition hover:bg-ink hover:text-surface"
              >
                投稿
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-xs text-ink-muted underline-offset-4 hover:underline"
                >
                  ログアウト
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </section>

      <div className="px-6 py-14 sm:px-10">
        {isOwner ? <WorkList handle={handle} works={works ?? []} /> : null}

        {episodes?.length ? (
          // Rules are drawn by the cells themselves, so an incomplete row ends
          // where the cells end instead of trailing off.
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
            {episodes.map((episode) => {
              const cover = episode.pages[0];
              const unfinished = episode.status === "processing";
              const tile = <EpisodeCover cover={cover ?? null} />;
              // A many-to-one embed comes back as a single row, but without
              // generated database types the client still types it as an array.
              const work = episode.work_id ? [episode.works].flat()[0] : null;
              const frame = `block transition hover:opacity-80 ${
                isOwner && episode.status !== "published" ? "opacity-40" : ""
              }`;

              return (
                <li
                  key={episode.id}
                  className="border-t border-l border-line p-4 [&:nth-child(2n)]:border-r sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-child(3n)]:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(4n)]:border-r"
                >
                  {/* An unfinished episode has no pages, so its page would 404.
                      Leave it as a dead tile the author can only delete. */}
                  {unfinished ? (
                    <div className={frame}>{tile}</div>
                  ) : (
                    <Link href={`/${handle}/${episode.id}`} className={frame}>
                      {tile}
                    </Link>
                  )}
                  {work ? (
                    <Link
                      href={`/${handle}/works/${episode.work_id}`}
                      className="mt-3 block text-base leading-tight underline-offset-4 hover:underline"
                    >
                      {work.title}
                    </Link>
                  ) : null}
                  <p className="mt-1 text-sm text-ink-muted">
                    {formatDate(episode.created_at)} · {episode.page_count}
                    ページ
                    {episode.status === "hidden" ? " · 非公開" : ""}
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
          <p className="text-sm text-ink-muted">
            {page === 1 ? "投稿はまだありません。" : "このページに表示する投稿はありません。"}
          </p>
        )}

        {page > 1 || hasNext ? (
          <nav className="mt-10 flex items-center justify-between font-label text-sm tracking-[0.1em] uppercase">
            {page > 1 ? (
              <Link
                href={page === 2 ? `/${handle}` : `/${handle}?page=${page - 1}`}
                className="underline-offset-4 hover:underline"
              >
                前のページ
              </Link>
            ) : (
              <span />
            )}
            {hasNext ? (
              <Link
                href={`/${handle}?page=${page + 1}`}
                className="underline-offset-4 hover:underline"
              >
                次のページ
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
