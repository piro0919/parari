"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { deliveryKey, originalKey, presignUpload } from "@/lib/r2";

const HANDLE = /^[a-z0-9_]{2,20}$/;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  return { supabase, user };
}

// The handle becomes the URL, so it is the one thing an author has to type.
export async function claimHandle(_prev: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const handle = String(formData.get("handle") ?? "").trim();

  if (!HANDLE.test(handle)) {
    return { error: "英小文字・数字・アンダースコア 2〜20文字で決めてください" };
  }

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, handle });

  if (error) {
    return {
      error:
        error.code === "23505"
          ? "その ID はもう使われています"
          : "登録できませんでした",
    };
  }

  revalidatePath("/new");
  return { error: null };
}

export type PageUpload = {
  pageIndex: number;
  originalExtension: string;
  originalContentType: string;
};

export type PageSlot = {
  pageIndex: number;
  deliveryKey: string;
  deliveryUrl: string;
  originalKey: string;
  originalUrl: string;
};

// Creates the episode row up front so the object keys can be namespaced by its
// id, and hands back one presigned PUT per object. The episode stays
// `processing` until every page has landed.
export async function createEpisode(pages: PageUpload[]) {
  const { supabase, user } = await requireUser();

  const { data: episode, error } = await supabase
    .from("episodes")
    .insert({ author_id: user.id, page_count: pages.length })
    .select("id")
    .single();

  if (error || !episode) throw new Error("話を作れませんでした");

  const slots: PageSlot[] = await Promise.all(
    pages.map(async (page) => {
      const dKey = deliveryKey(episode.id, page.pageIndex);
      const oKey = originalKey(
        episode.id,
        page.pageIndex,
        page.originalExtension,
      );
      return {
        pageIndex: page.pageIndex,
        deliveryKey: dKey,
        deliveryUrl: await presignUpload(dKey, "image/webp"),
        originalKey: oKey,
        originalUrl: await presignUpload(oKey, page.originalContentType),
      };
    }),
  );

  return { episodeId: episode.id, slots };
}

export type UploadedPage = {
  pageIndex: number;
  deliveryKey: string;
  originalKey: string;
  width: number;
  height: number;
};

// Called once every object is in R2. Writing the rows and flipping to
// `published` in that order means a reader never sees a half-empty episode.
export async function publishEpisode(
  episodeId: string,
  pages: UploadedPage[],
) {
  const { supabase } = await requireUser();

  const { error: pagesError } = await supabase.from("pages").insert(
    pages.map((page) => ({
      episode_id: episodeId,
      page_index: page.pageIndex,
      object_key: page.deliveryKey,
      original_key: page.originalKey,
      width: page.width,
      height: page.height,
    })),
  );

  if (pagesError) throw new Error("ページを保存できませんでした");

  const { error: episodeError } = await supabase
    .from("episodes")
    .update({ status: "published", page_count: pages.length })
    .eq("id", episodeId);

  if (episodeError) throw new Error("公開できませんでした");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .single();

  if (profile) revalidatePath(`/${profile.handle}`);

  return { episodeId };
}
