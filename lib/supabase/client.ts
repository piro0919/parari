import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Reads the session from cookies written by
// @supabase/ssr, so Server Components see the same auth state.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
