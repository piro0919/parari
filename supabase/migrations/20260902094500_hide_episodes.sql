-- 出したものを引っ込められるようにする。
-- 'processing'（変換中）と 'hidden'（作者が下げた）は読者に見えない点では同じだが、
-- 前者は失敗の残骸で後者は意図的な状態なので、作者の管理画面で区別が要る。
alter table episodes drop constraint episodes_status_check;

alter table episodes add constraint episodes_status_check
  check (status in ('processing', 'published', 'hidden'));
