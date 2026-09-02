-- X のログインは採れないので、本人性は相互リンクで代用する。作者ページから X へ
-- 出せるようにし、読者は X 側のプロフィールに戻るリンクがあるかで確かめる。
-- `handle` と違ってこれは URL にならないので、あとから変えられる。
alter table profiles add column x_handle text
  check (x_handle is null or x_handle ~ '^[A-Za-z0-9_]{1,15}$');
