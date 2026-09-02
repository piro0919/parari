import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/date";
import { signOut } from "@/lib/actions";
import { EpisodeCover } from "@/app/EpisodeCover";
import { SiteFooter } from "@/app/SiteFooter";
import { SiteHeader } from "@/app/SiteHeader";
import { Composer } from "./Composer";
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
    <main>
      <SiteHeader />
      <section>
        <div>
          <div>
            <h1>
              {profile.handle}
            </h1>
            <XLink xHandle={profile.x_handle} isOwner={isOwner} />
          </div>
          {isOwner ? (
            // 投稿口はすぐ下にあるので、ここには置かない
            <div>
              <form action={signOut}>
                <button
                  type="submit"
                >
                  ログアウト
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </section>

      <div>
        {/* The author's shelf doubles as where they post: one place, one URL. */}
        {isOwner ? <Composer /> : null}
        {isOwner ? <WorkList handle={handle} works={works ?? []} /> : null}

        {episodes?.length ? (
          // Rules are drawn by the cells themselves, so an incomplete row ends
          // where the cells end instead of trailing off.
          <ul>
            {episodes.map((episode) => {
              const cover = episode.pages[0];
              const unfinished = episode.status === "processing";
              const tile = <EpisodeCover cover={cover ?? null} />;
              // A many-to-one embed comes back as a single row, but without
              // generated database types the client still types it as an array.
              const work = episode.work_id ? [episode.works].flat()[0] : null;

              return (
                <li
                  key={episode.id}
                >
                  {/* An unfinished episode has no pages, so its page would 404.
                      Leave it as a dead tile the author can only delete. */}
                  {unfinished ? (
                    <div>{tile}</div>
                  ) : (
                    <Link href={`/${handle}/${episode.id}`}>
                      {tile}
                    </Link>
                  )}
                  {work ? (
                    <Link
                      href={`/${handle}/works/${episode.work_id}`}
                    >
                      {work.title}
                    </Link>
                  ) : null}
                  <p>
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
          <p>
            {page === 1 ? "投稿はまだありません。" : "このページに表示する投稿はありません。"}
          </p>
        )}

        {page > 1 || hasNext ? (
          <nav>
            {page > 1 ? (
              <Link
                href={page === 2 ? `/${handle}` : `/${handle}?page=${page - 1}`}
              >
                前のページ
              </Link>
            ) : (
              <span />
            )}
            {hasNext ? (
              <Link
                href={`/${handle}?page=${page + 1}`}
              >
                次のページ
              </Link>
            ) : (
              <span />
            )}
          </nav>
        ) : null}
      </div>
      <SiteFooter />
    </main>
  );
}
