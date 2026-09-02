"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  deleteEpisodeObjects,
  deliveryKey,
  originalKey,
  presignDelivery,
  presignOriginal,
} from "@/lib/r2";

const HANDLE = /^[a-z0-9_]{2,20}$/;
const X_HANDLE = /^[A-Za-z0-9_]{1,15}$/;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("ログインが必要です");
  return { supabase, user };
}

async function ownHandle(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
) {
  // `profiles` is world-readable, so this has to filter by id: an unfiltered
  // `.single()` would match every author on the service.
  const { data } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", userId)
    .maybeSingle();
  return data?.handle ?? null;
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

// Unlike the handle, this one is not a URL on Parari, so it can be changed or
// cleared. Emptying the field is how an author unlinks.
export async function setXHandle(_prev: unknown, formData: FormData) {
  const { supabase, user } = await requireUser();
  const entered = String(formData.get("x_handle") ?? "")
    .trim()
    .replace(/^@/, "");

  if (entered && !X_HANDLE.test(entered)) {
    return {
      error: "X のユーザー名は英数字とアンダースコア15文字までです",
      saved: false,
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ x_handle: entered || null })
    .eq("id", user.id);

  if (error) return { error: "保存できませんでした", saved: false };

  const handle = await ownHandle(supabase, user.id);
  if (handle) revalidatePath(`/${handle}`);

  return { error: null, saved: true };
}

// A work is a label an author puts on episodes after the fact, so creating one
// and hanging an episode on it are two steps, not one form.
export async function createWork(title: string) {
  const { supabase, user } = await requireUser();
  const trimmed = title.trim();

  if (!trimmed || trimmed.length > 60) {
    throw new Error("作品名は1〜60文字で決めてください");
  }

  const { data, error } = await supabase
    .from("works")
    .insert({ author_id: user.id, title: trimmed })
    .select("id")
    .single();

  if (error || !data) throw new Error("作品を作れませんでした");

  const handle = await ownHandle(supabase, user.id);
  if (handle) revalidatePath(`/${handle}`);

  return { workId: data.id as string };
}

// `null` takes the episode back out of its work. Row-level security keeps both
// the episode and the work inside the caller's own shelf.
export async function setEpisodeWork(episodeId: string, workId: string | null) {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("episodes")
    .update({ work_id: workId })
    .eq("id", episodeId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("まとめられませんでした");

  const handle = await ownHandle(supabase, user.id);
  if (handle) {
    revalidatePath(`/${handle}`);
    revalidatePath(`/${handle}/${episodeId}`);
  }
}

// Posted as a plain form action, so it has to end somewhere: the top page is
// the only one that reads the same signed in or out.
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
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
        deliveryUrl: await presignDelivery(dKey),
        originalKey: oKey,
        originalUrl: await presignOriginal(oKey, page.originalContentType),
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
  const { supabase, user } = await requireUser();

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

  const handle = await ownHandle(supabase, user.id);
  if (handle) revalidatePath(`/${handle}`);

  return { episodeId };
}

// Row-level security is what actually decides ownership here: the update and
// the delete match nothing when the caller is not the author, so an empty
// result is a refusal, not a missing episode.
export async function setEpisodeHidden(episodeId: string, hidden: boolean) {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("episodes")
    .update({ status: hidden ? "hidden" : "published" })
    .eq("id", episodeId)
    // A half-uploaded episode has no business being published by this button.
    .in("status", ["published", "hidden"])
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("変えられませんでした");

  const handle = await ownHandle(supabase, user.id);
  if (handle) {
    revalidatePath(`/${handle}`);
    revalidatePath(`/${handle}/${episodeId}`);
  }
}

// The row goes first: it is what readers see, and an orphaned object in R2
// costs a fraction of a cent. The reverse order would leave a published
// episode pointing at images that are already gone.
export async function deleteEpisode(episodeId: string) {
  const { supabase, user } = await requireUser();

  const { data, error } = await supabase
    .from("episodes")
    .delete()
    .eq("id", episodeId)
    .select("id")
    .maybeSingle();

  if (error || !data) throw new Error("消せませんでした");

  await deleteEpisodeObjects(episodeId);

  const handle = await ownHandle(supabase, user.id);
  if (handle) revalidatePath(`/${handle}`);
}
