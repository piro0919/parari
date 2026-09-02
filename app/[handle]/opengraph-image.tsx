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
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const supabase = createAnonClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();

  // The newest episode stands in for the shelf, the way a bookshelf is known
  // by what is on the front of it.
  const { data: episodes, count } = profile
    ? await supabase
        .from("episodes")
        .select("pages(object_key)", { count: "exact" })
        .eq("author_id", profile.id)
        .eq("status", "published")
        .eq("pages.page_index", 0)
        .order("created_at", { ascending: false })
        .limit(1)
    : { data: null, count: 0 };

  const cover = episodes?.[0]?.pages[0];

  return ogCard({
    handle,
    subtitle: plural(count ?? 0, "episode"),
    coverKey: cover?.object_key ?? null,
  });
}
