# Parari

A place to keep comics that would otherwise scroll away.

Manga drawn for Twitter has three problems its readers keep running into: pixiv
asks them to sign in, a tweet holds only four images, and last month's episode
is already unreachable. Parari removes all three. Authors drop images and get a
page; readers need no account, hit no page limit, and find every past episode
under the author's handle.

**https://parari.kkweb.io**

## How it works

An author signs in with Google, picks a handle once, and drops images. Nothing
else is asked — no title, no tags, no page ordering. Pages are sorted by file
name, which is the order the author already exports in.

The browser converts each page to WebP and uploads it straight to Cloudflare R2,
so no large file passes through the server and delivery costs no egress. The
untouched original is kept in a separate, private bucket so the delivery copy
can be rebuilt later.

Reading is handled by [react-comic-viewer](https://github.com/piro0919/react-comic-viewer):
right-to-left, swipeable, with thumbnails and a page indicator.

## Stack

- Next.js 16 on Vercel
- Supabase for Google auth and three tables, guarded by row-level security
- Cloudflare R2 for images, served from `img.parari.kkweb.io`

## Development

Requires Docker for the local Supabase stack.

```sh
set -a && . ./.env.local && set +a && supabase start
npm run dev
```

The app runs on port 3001. See `CLAUDE.md` for the decisions behind the design
and the traps worth knowing about.
