import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";

export default async function AuthorPage({ params }: PageProps<"/[handle]">) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle")
    .eq("handle", handle)
    .maybeSingle();

  if (!profile) notFound();

  // Only the first page of each episode: the cover is how a reader tells
  // episodes apart, since nothing is titled.
  const { data: episodes } = await supabase
    .from("episodes")
    .select("id, created_at, page_count, pages(object_key, width, height)")
    .eq("author_id", profile.id)
    .eq("status", "published")
    .eq("pages.page_index", 0)
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <h1 className="font-mono text-xl font-semibold tracking-tight">
        {profile.handle}
      </h1>

      {episodes?.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {episodes.map((episode) => {
            const cover = episode.pages[0];
            return (
              <li key={episode.id}>
                <Link
                  href={`/${handle}/${episode.id}`}
                  className="block overflow-hidden rounded-lg border border-black/10 transition hover:opacity-80 dark:border-white/15"
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
                  ) : null}
                </Link>
                <p className="mt-1.5 text-xs text-black/50 dark:text-white/50">
                  {new Date(episode.created_at).toLocaleDateString("ja-JP")} ·{" "}
                  {episode.page_count}ページ
                </p>
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
