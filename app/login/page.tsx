import Link from "next/link";
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
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      {/* ヘッダーが無いので、名前そのものが唯一の出口 */}
      <h1 className="text-3xl font-light tracking-[-0.02em] text-ink-strong">
        <Link href="/">Parari</Link>
      </h1>
      <LoginButton next={next} />
    </main>
  );
}
