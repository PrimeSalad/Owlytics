-- ── Org chat messages ─────────────────────────────────────────
-- A single org-wide channel. `kind` separates normal chat from
-- pinned-style announcements (only President/Secretary may post those).
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  author_id   uuid not null references profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  kind        text not null default 'message' check (kind in ('message', 'announcement')),
  created_at  timestamptz not null default now()
);

create index if not exists idx_messages_created_at on messages (created_at desc);
create index if not exists idx_messages_kind_created on messages (kind, created_at desc);

-- RLS enabled with no policies: the API talks to this table with the
-- service-role key (which bypasses RLS), and clients never query it directly.
alter table messages enable row level security;
