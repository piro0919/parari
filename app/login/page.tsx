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
    <main>
      {/* ヘッダーが無いので、名前そのものが唯一の出口 */}
      <h1>
        <Link href="/">Parari</Link>
      </h1>
      <LoginButton next={next} />
    </main>
  );
}
