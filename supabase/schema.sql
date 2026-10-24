-- Zuzu: Supabase کے SQL Editor میں پوری فائل پیسٹ کر کے ایک بار Run کریں

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  pen_name text not null check (char_length(pen_name) between 2 and 40),
  bio text not null default '' check (char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

create table posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references profiles(id) on delete cascade,
  kind text not null check (kind in ('column','article','story','poetry','diary','letter')),
  title text not null check (char_length(title) between 3 and 150),
  subtitle text not null default '' check (char_length(subtitle) <= 300),
  body text not null check (char_length(body) <= 60000),
  cover_url text,
  thumb_url text,
  read_min int not null default 1,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index posts_feed_idx on posts (published, created_at desc);
create index posts_kind_idx on posts (kind, created_at desc);

create table bookmarks (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id bigint not null references posts(id) on delete cascade,
  primary key (user_id, post_id)
);

-- حفاظتی اصول: سب پڑھ سکتے ہیں، لکھنے/بدلنے کا حق صرف مالک کو
alter table profiles enable row level security;
alter table posts enable row level security;
alter table bookmarks enable row level security;

create policy "profiles: anyone reads" on profiles for select using (true);
create policy "profiles: owner updates" on profiles for update using (auth.uid() = id);

create policy "posts: read published or own" on posts for select using (published or auth.uid() = author_id);
create policy "posts: owner inserts" on posts for insert with check (auth.uid() = author_id);
create policy "posts: owner updates" on posts for update using (auth.uid() = author_id);
create policy "posts: owner deletes" on posts for delete using (auth.uid() = author_id);

create policy "bookmarks: owner only" on bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- نیا اکاؤنٹ بنتے ہی پروفائل (تخلص) خود بن جائے
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, pen_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'pen_name'), ''), 'قلم کار'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- تصاویر کا بکٹ: زیادہ سے زیادہ 1 MB، ہر کوئی دیکھ سکے، اپ لوڈ صرف اپنے فولڈر میں
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 1048576, array['image/jpeg','image/webp','image/png'])
on conflict (id) do nothing;

create policy "covers: anyone views" on storage.objects for select using (bucket_id = 'covers');
create policy "covers: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "covers: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
