import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { createAnonClient } from "@/lib/supabase/anon";

// Being findable is half the point: a comic buried in last month's timeline
// should still turn up in a search.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAnonClient();
  const url = (path: string) => new URL(path, SITE_URL).toString();

  const [{ data: profiles }, { data: works }, { data: episodes }] =
    await Promise.all([
      supabase.from("profiles").select("handle"),
      supabase.from("works").select("id, profiles!inner(handle)"),
      supabase
        .from("episodes")
        .select("id, created_at, profiles!inner(handle)")
        .eq("status", "published")
        .order("created_at", { ascending: false }),
    ]);

  return [
    { url: url("/"), changeFrequency: "daily" as const, priority: 1 },
    ...(profiles ?? []).map((profile) => ({
      url: url(`/${profile.handle}`),
      changeFrequency: "weekly" as const,
    })),
    ...(works ?? []).map((work) => ({
      url: url(`/${[work.profiles].flat()[0].handle}/works/${work.id}`),
      changeFrequency: "weekly" as const,
    })),
    ...(episodes ?? []).map((episode) => {
      // A many-to-one embed comes back as a single row, but without generated
      // database types the client still types it as an array.
      const author = [episode.profiles].flat()[0];
      return {
        url: url(`/${author.handle}/${episode.id}`),
        lastModified: new Date(episode.created_at),
      };
    }),
  ];
}
