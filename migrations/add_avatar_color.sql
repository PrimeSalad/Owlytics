-- Persist each user's chosen avatar color theme (index into the client palette).
alter table profiles
  add column if not exists avatar_color integer not null default 0;
