-- Review and run this in Supabase SQL Editor only after confirming the target project.
-- The script creates the CMS tables and row-level security policies.

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.portfolio_admins enable row level security;
grant select on public.portfolio_admins to authenticated;

drop policy if exists "admins can read own grant" on public.portfolio_admins;
create policy "admins can read own grant"
  on public.portfolio_admins for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.portfolio_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('project', 'experience', 'skill', 'education', 'section')),
  locale text not null check (locale in ('id', 'en')),
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_content_public_order_idx
  on public.portfolio_content (kind, locale, is_published, sort_order);

create or replace function public.set_portfolio_content_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_portfolio_content_updated_at on public.portfolio_content;
create trigger set_portfolio_content_updated_at
  before update on public.portfolio_content
  for each row execute function public.set_portfolio_content_updated_at();

alter table public.portfolio_content enable row level security;
grant select on public.portfolio_content to anon, authenticated;
grant insert, update, delete on public.portfolio_content to authenticated;

drop policy if exists "published portfolio content is public" on public.portfolio_content;
create policy "published portfolio content is public"
  on public.portfolio_content for select to anon, authenticated
  using (is_published = true);

drop policy if exists "portfolio admins manage content" on public.portfolio_content;
create policy "portfolio admins manage content"
  on public.portfolio_content for all to authenticated
  using (exists (
    select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.portfolio_admins a where a.user_id = (select auth.uid())
  ));

-- Create an Auth user first, then grant admin access with that user's UUID:
-- insert into public.portfolio_admins (user_id) values ('<AUTH_USER_UUID>');

-- Public project media. Existing bucket settings are left untouched by this insert.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "project images are publicly readable" on storage.objects;
create policy "project images are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'project-images');

drop policy if exists "admins can upload project images" on storage.objects;
create policy "admins can upload project images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "admins can update project images" on storage.objects;
create policy "admins can update project images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-images'
    and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid()))
  )
  with check (
    bucket_id = 'project-images'
    and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid()))
  );

drop policy if exists "admins can delete project images" on storage.objects;
create policy "admins can delete project images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-images'
    and exists (select 1 from public.portfolio_admins a where a.user_id = (select auth.uid()))
  );
