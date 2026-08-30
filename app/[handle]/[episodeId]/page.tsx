import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import { Viewer } from "./Viewer";

export default async function EpisodePage({
  params,
}: PageProps<"/[handle]/[episodeId]">) {
  const { handle, episodeId } = await params;
  const supabase = await createClient();

  const { data: episode } = await supabase
    .from("episodes")
    .select("id, author_id, profiles!inner(handle), pages(page_index, object_key)")
    .eq("id", episodeId)
    .eq("profiles.handle", handle)
    .maybeSingle();

  if (!episode || !episode.pages.length) notFound();

  const pages = [...episode.pages]
    .sort((a, b) => a.page_index - b.page_index)
    .map((page) => publicUrl(page.object_key));

  return (
    <main className="flex flex-1 flex-col">
      <header className="px-4 py-3">
        <Link
          href={`/${handle}`}
          className="text-sm text-black/60 underline-offset-4 hover:underline dark:text-white/60"
        >
          ← {handle}
        </Link>
      </header>
      <Viewer pages={pages} />
    </main>
  );
}
