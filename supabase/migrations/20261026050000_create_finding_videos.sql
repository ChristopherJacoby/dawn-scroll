-- Videos for archaeological findings (DS-142): YouTube videos embedded on
-- the finding page, generated from data/archaeology/findings.json like the
-- rest of the catalog. Each says who made it and what it shows, since many
-- present a claim as its proponents see it.

create table public.finding_videos (
  finding_id bigint not null references public.findings(id) on delete cascade,
  position smallint not null,
  youtube_id text not null,
  title text not null,
  -- The channel or producer, as YouTube credits it.
  channel text not null,
  -- What the video shows and whose view it presents.
  note text not null,

  primary key (finding_id, position),
  constraint finding_videos_youtube_id_format check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint finding_videos_title_present check (title ~ '\S' and char_length(title) <= 200),
  constraint finding_videos_channel_present check (channel ~ '\S' and char_length(channel) <= 120),
  constraint finding_videos_note_present check (note ~ '\S' and char_length(note) <= 400)
);

alter table public.finding_videos enable row level security;

grant select on public.finding_videos to anon, authenticated;
grant all on public.finding_videos to service_role;
revoke insert, update, delete, truncate, references, trigger
  on public.finding_videos from anon, authenticated;

create policy "Anyone can read finding videos"
on public.finding_videos for select to anon, authenticated using (true);
