import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginButton } from "./LoginButton";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/new";

  if (user) redirect(next);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Parari</h1>
        <p className="mt-2 text-sm text-black/60 dark:text-white/60">
          描いた人だけログインします。読む人は要りません。
        </p>
      </div>
      <LoginButton next={next} />
    </main>
  );
}
