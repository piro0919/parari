import Link from "next/link";

// Every page except the front page carries this: without it, a reader who
// arrived on an episode from a tweet had no way to the rest of the service,
// and /new and /login were dead ends short of the back button.
// It reads no cookies on purpose, so the pages carrying it stay cacheable —
// /new sends a signed-out visitor to the login page anyway.
export function SiteHeader() {
  return (
    <header>
      <Link
        href="/"
      >
        Parari
      </Link>
      <Link
        href="/new"
      >
        投稿する
      </Link>
    </header>
  );
}
