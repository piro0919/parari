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
        <h1 className="text-3xl font-light tracking-[-0.02em] text-ink-strong">
          Parari
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          漫画を投稿するにはログインが必要です。閲覧のみの場合は不要です。
        </p>
      </div>
      <LoginButton next={next} />
    </main>
  );
}
