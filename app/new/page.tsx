import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HandleForm } from "./HandleForm";
import { SiteFooter } from "@/app/SiteFooter";
import { SiteHeader } from "@/app/SiteHeader";
import { Uploader } from "./Uploader";

export default async function NewEpisodePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      {profile ? (
        <>
          <Uploader handle={profile.handle} />
          <Link
            href={`/${profile.handle}`}
            className="text-xs text-ink-muted underline-offset-4 hover:underline"
          >
            自分のページを表示
          </Link>
        </>
      ) : (
        <HandleForm />
      )}
      </div>
      <SiteFooter />
    </main>
  );
}
