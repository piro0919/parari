import { OG_SIZE, ogCard } from "@/lib/og-card";
import { createAnonClient } from "@/lib/supabase/anon";
import { plural } from "@/lib/plural";

export const alt = "Parari";
export const size = OG_SIZE;
export const contentType = "image/png";
// Re-encoding a cover for every crawl is wasted work: the card changes rarely
// and the networks cache it anyway.
export const revalidate = 3600;

export default async function Image({
  params,
}: {
  params: Promise<{ handle: string; episodeId: string }>;
}) {
  const { handle, episodeId } = await params;

  const { data: episode } = await createAnonClient()
    .from("episodes")
    .select("page_count, pages(object_key)")
    .eq("id", episodeId)
    .eq("pages.page_index", 0)
    .maybeSingle();

  const cover = episode?.pages[0];

  return ogCard({
    handle,
    subtitle: episode ? plural(episode.page_count, "page") : "",
    coverKey: cover?.object_key ?? null,
  });
}
