-- T'wwasteful demo: jalankan sekali di Supabase SQL Editor.
-- Gunakan anon/publishable key di frontend. JANGAN pernah masukkan service_role/secret key ke VITE_ env.
create table if not exists public.listings_demo (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  title text not null,
  category text not null,
  description text not null,
  quantity numeric not null check (quantity > 0),
  unit text not null default 'kg',
  price numeric not null check (price >= 0),
  location text not null,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.listings_demo enable row level security;

drop policy if exists "Public can read listings" on public.listings_demo;
create policy "Public can read listings"
on public.listings_demo for select
to anon, authenticated
using (true);

drop policy if exists "Users can create own listings" on public.listings_demo;
create policy "Users can create own listings"
on public.listings_demo for insert
to authenticated
with check (auth.uid() = owner_id);

drop policy if exists "Users can update own listings" on public.listings_demo;
create policy "Users can update own listings"
on public.listings_demo for update
to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists "Users can delete own listings" on public.listings_demo;
create policy "Users can delete own listings"
on public.listings_demo for delete
to authenticated
using (auth.uid() = owner_id);

insert into storage.buckets (id, name, public)
values ('twwasteful-materials', 'twwasteful-materials', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can view material images" on storage.objects;
create policy "Public can view material images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'twwasteful-materials');

drop policy if exists "Authenticated users upload material images" on storage.objects;
create policy "Authenticated users upload material images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'twwasteful-materials' and (storage.foldername(name))[1] = auth.uid()::text);
