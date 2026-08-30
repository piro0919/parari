-- Parari: 作者ごとの置き場と、そこに積まれる話。
-- 読者はログインせずに読む。書けるのは自分の話だけ。

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  -- URL になるので、あとから変えられない前提の文字種に絞る
  handle text not null unique check (handle ~ '^[a-z0-9_]{2,20}$'),
  created_at timestamptz not null default now()
);

create table episodes (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  -- 変換が終わるまで published にしない。壊れた話を読者に見せないため
  status text not null default 'processing' check (status in ('processing', 'published')),
  page_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index episodes_author_created_idx on episodes (author_id, created_at desc);

create table pages (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references episodes (id) on delete cascade,
  -- ファイル名の昇順で振る。作者は並びを指定しない
  page_index integer not null,
  -- R2 のオブジェクトキー。配信用の WebP と、作り直しのための原寸
  object_key text not null,
  original_key text not null,
  width integer not null,
  height integer not null,
  unique (episode_id, page_index)
);

alter table profiles enable row level security;
alter table episodes enable row level security;
alter table pages enable row level security;

create policy "profiles are public" on profiles
  for select using (true);

create policy "own profile is writable" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "published episodes are public" on episodes
  for select using (status = 'published' or auth.uid() = author_id);

create policy "own episodes are writable" on episodes
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "pages of published episodes are public" on pages
  for select using (
    exists (
      select 1 from episodes
      where episodes.id = pages.episode_id
        and (episodes.status = 'published' or episodes.author_id = auth.uid())
    )
  );

create policy "pages of own episodes are writable" on pages
  for all using (
    exists (
      select 1 from episodes
      where episodes.id = pages.episode_id and episodes.author_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from episodes
      where episodes.id = pages.episode_id and episodes.author_id = auth.uid()
    )
  );
