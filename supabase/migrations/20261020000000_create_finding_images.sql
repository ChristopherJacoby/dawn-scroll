-- Photos for archaeological findings. The files live in the public
-- "findings" storage bucket (uploaded by scripts/upload-finding-images.mjs);
-- this table holds their metadata and attribution, generated from
-- data/archaeology/findings.json like the rest of the catalog.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('findings', 'findings', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create table public.finding_images (
  finding_id bigint not null references public.findings(id) on delete cascade,
  position smallint not null,
  -- Object path in the "findings" bucket, e.g. "tel-dan-stele.jpg".
  path text not null,
  width smallint not null,
  height smallint not null,
  alt text not null,
  caption text not null,
  -- Photographer or institution, as the source credits them.
  credit text not null,
  license text not null,
  license_url text,
  -- Where the image came from (e.g. its Wikimedia Commons file page).
  source_url text not null,

  primary key (finding_id, position),
  constraint finding_images_path_format check (path ~ '^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9-]+)*\.(?:jpg|png|webp)$'),
  constraint finding_images_size_positive check (width > 0 and height > 0),
  constraint finding_images_alt_present check (alt ~ '\S' and char_length(alt) <= 300),
  constraint finding_images_caption_present check (caption ~ '\S' and char_length(caption) <= 400),
  constraint finding_images_credit_present check (credit ~ '\S' and char_length(credit) <= 200),
  constraint finding_images_license_present check (license ~ '\S' and char_length(license) <= 60),
  constraint finding_images_license_url_https check (license_url ~ '^https?://[^\s]+$'),
  constraint finding_images_source_url_https check (source_url ~ '^https://[^\s]+$')
);

alter table public.finding_images enable row level security;

grant select on public.finding_images to anon, authenticated;
grant all on public.finding_images to service_role;
revoke insert, update, delete, truncate, references, trigger
  on public.finding_images from anon, authenticated;

create policy "Anyone can read finding images"
on public.finding_images for select to anon, authenticated using (true);
