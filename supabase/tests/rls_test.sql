-- 読者はログインせずに読み、書けるのは自分のものだけ。ここが崩れると、
-- 下げたはずの話が読まれるか、他人に消される。ポリシーを直接突いて確かめる。
begin;
create extension if not exists pgtap;
select plan(13);

-- 下ごしらえは postgres のまま
insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.test'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@example.test');

insert into profiles (id, handle) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'author_a'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'author_b');

insert into works (id, author_id, title) values
  ('11111111-0000-0000-0000-00000000000f',
   'aaaaaaaa-0000-0000-0000-000000000001', 'A の作品');

insert into episodes (id, author_id, status, page_count, work_id) values
  ('e0000000-0000-0000-0000-000000000001',
   'aaaaaaaa-0000-0000-0000-000000000001', 'published', 1,
   '11111111-0000-0000-0000-00000000000f'),
  ('e0000000-0000-0000-0000-000000000002',
   'aaaaaaaa-0000-0000-0000-000000000001', 'hidden', 1, null),
  ('e0000000-0000-0000-0000-000000000003',
   'aaaaaaaa-0000-0000-0000-000000000001', 'processing', 0, null);

insert into pages (episode_id, page_index, object_key, original_key, width, height)
values
  ('e0000000-0000-0000-0000-000000000001', 0, 'rls-p/000.webp', 'rls-p/000.jpg', 100, 200),
  ('e0000000-0000-0000-0000-000000000002', 0, 'rls-h/000.webp', 'rls-h/000.jpg', 100, 200);

-- ローカルの開発用データが同じ DB にいるので、数えるのは仕込んだ行だけに絞る。
-- 見出しの `a` は作者 A、`rls-` はこのテストが入れたページ。
-- 匿名の読者
set local role anon;

select is(
  (select count(*)::int from episodes
   where author_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  '匿名に見えるのは公開済みの話だけ'
);

select is(
  (select count(*)::int from pages where object_key like 'rls-%'),
  1,
  '下げた話のページは匿名に見えない'
);

select is(
  (select count(*)::int from profiles where handle like 'author\_%'),
  2,
  '作者ページは誰でも見える'
);
select is(
  (select count(*)::int from works
   where author_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  1,
  '作品は誰でも見える'
);

select throws_ok(
  $$insert into works (author_id, title)
    values ('aaaaaaaa-0000-0000-0000-000000000001', '割り込み')$$,
  '42501',
  null,
  '匿名は作品を作れない'
);

update episodes set status = 'published';
delete from episodes;

reset role;

select is(
  (select status from episodes where id = 'e0000000-0000-0000-0000-000000000002'),
  'hidden',
  '匿名は話を公開できない'
);

select is(
  (select count(*)::int from episodes
   where author_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  3,
  '匿名は話を消せない'
);

-- 作者本人
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::int from episodes
   where author_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  3,
  '作者には下げた話も未完成の話も見える'
);

update episodes set status = 'hidden'
where id = 'e0000000-0000-0000-0000-000000000001';

select is(
  (select status from episodes where id = 'e0000000-0000-0000-0000-000000000001'),
  'hidden',
  '作者は自分の話を下げられる'
);

-- 他人
set local role authenticated;
set local request.jwt.claims =
  '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}';

update works set title = 'のっとり'
where id = '11111111-0000-0000-0000-00000000000f';

delete from episodes where author_id = 'aaaaaaaa-0000-0000-0000-000000000001';

update profiles set handle = 'stolen'
where id = 'aaaaaaaa-0000-0000-0000-000000000001';

reset role;

select is(
  (select title from works where id = '11111111-0000-0000-0000-00000000000f'),
  'A の作品',
  '他人は作品の名前を変えられない'
);

select is(
  (select count(*)::int from episodes
   where author_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  3,
  '他人は話を消せない'
);

select is(
  (select handle from profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'author_a',
  '他人は作者 ID を書き換えられない'
);

-- 作品を消しても話は残る（名札を外すだけ）
delete from works where id = '11111111-0000-0000-0000-00000000000f';

select is(
  (select work_id from episodes where id = 'e0000000-0000-0000-0000-000000000001'),
  null,
  '作品を消すと話の名札だけが外れる'
);

select * from finish();
rollback;
