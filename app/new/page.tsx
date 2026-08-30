import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HandleForm } from "./HandleForm";
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
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      {profile ? <Uploader handle={profile.handle} /> : <HandleForm />}
    </main>
  );
}
