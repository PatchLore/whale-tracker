-- Enable required extensions (if not already enabled)
create extension if not exists "uuid-ossp";

-- PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  tier text, -- Deprecated: kept for backward compatibility, Whop now controls access
  whop_user_id text, -- Whop user ID mapping for access control
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.profiles
  add column if not exists telegram_chat_id text;

alter table public.profiles
  add column if not exists default_threshold numeric;

alter table public.profiles enable row level security;

-- Only allow authenticated users to interact with their own profile row
create policy if not exists "Profiles: users can select own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy if not exists "Profiles: users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

create policy if not exists "Profiles: users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- WALLETS
create table if not exists public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  address text not null,
  chain text not null, -- 'ethereum', 'bsc', 'solana'
  threshold numeric,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.wallets enable row level security;

-- Users can only see and manage wallets belonging to their profile
create policy if not exists "Wallets: users can select own wallets"
  on public.wallets
  for select
  using (auth.uid() = user_id);

create policy if not exists "Wallets: users can insert own wallets"
  on public.wallets
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Wallets: users can update own wallets"
  on public.wallets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Wallets: users can delete own wallets"
  on public.wallets
  for delete
  using (auth.uid() = user_id);


-- TRANSACTIONS
create table if not exists public.transactions (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid not null references public.wallets (id) on delete cascade,
  hash text not null unique,
  direction text not null, -- 'incoming' or 'outgoing'
  eth_value numeric,
  from_address text,
  to_address text,
  block_timestamp bigint,
  is_whale boolean,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table public.transactions enable row level security;

-- Users can only see transactions for their own wallets
create policy if not exists "Transactions: users can select own wallet transactions"
  on public.transactions
  for select
  using (
    exists (
      select 1
      from public.wallets w
      where w.id = transactions.wallet_id
        and w.user_id = auth.uid()
    )
  );

create policy if not exists "Transactions: users can insert own wallet transactions"
  on public.transactions
  for insert
  with check (
    exists (
      select 1
      from public.wallets w
      where w.id = wallet_id
        and w.user_id = auth.uid()
    )
  );

create policy if not exists "Transactions: users can update own wallet transactions"
  on public.transactions
  for update
  using (
    exists (
      select 1
      from public.wallets w
      where w.id = transactions.wallet_id
        and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.wallets w
      where w.id = wallet_id
        and w.user_id = auth.uid()
    )
  );

create policy if not exists "Transactions: users can delete own wallet transactions"
  on public.transactions
  for delete
  using (
    exists (
      select 1
      from public.wallets w
      where w.id = transactions.wallet_id
        and w.user_id = auth.uid()
    )
  );

