-- 話を「作品」へ束ねる。単位はあくまで話のままで、作品は後から付けられる名札。
-- 束ねていない話は work_id が null のまま、いままでどおり単体で読める。
create table works (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  created_at timestamptz not null default now()
);

-- 作品を消しても話は残す。名札を外すだけで、読めなくする操作ではない
alter table episodes
  add column work_id uuid references works (id) on delete set null;

create index episodes_work_created_idx on episodes (work_id, created_at);

alter table works enable row level security;

create policy "works are public" on works
  for select using (true);

create policy "own works are writable" on works
  for all using (auth.uid() = author_id) with check (auth.uid() = author_id);
