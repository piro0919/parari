import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Session-less client, for anything that has to stay cacheable: touching
// cookies makes the response per-visitor and takes it out of the cache. Row
// level security hands this exactly what a logged-out reader sees, which is
// also exactly what belongs in a link preview.
export function createAnonClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
