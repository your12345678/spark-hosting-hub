
-- Role enum & user_roles table
create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles where user_id = _user_id and role = _role
  )
$$;

create policy "Users can view their own roles"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

create policy "Admins can view all roles"
  on public.user_roles for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Plans catalog
create type public.plan_category as enum ('minecraft', 'budget', 'paid', 'premium', 'vps');

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  category public.plan_category not null,
  name text not null,
  tagline text,
  price_cents integer not null default 0,
  currency text not null default 'USD',
  billing_period text not null default 'month',
  ram_gb numeric,
  cpu_cores numeric,
  cpu_label text,
  storage_gb numeric,
  storage_type text,
  bandwidth_tb numeric,
  player_slots integer,
  location text,
  features jsonb not null default '[]'::jsonb,
  badge text,
  color text,
  icon text,
  cta_label text default 'Order now',
  cta_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "Anyone can view active plans"
  on public.plans for select to anon, authenticated
  using (is_active = true);

create policy "Admins can view all plans"
  on public.plans for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can insert plans"
  on public.plans for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update plans"
  on public.plans for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete plans"
  on public.plans for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger plans_set_updated_at
before update on public.plans
for each row execute function public.set_updated_at();

-- Seed initial plans
insert into public.plans (category, name, tagline, price_cents, ram_gb, cpu_cores, storage_gb, storage_type, player_slots, features, badge, sort_order, is_featured) values
  ('minecraft','Stone','Perfect for small friends groups',299,2,1,20,'NVMe SSD',12,'["DDoS Protection","1-click modpacks","Free subdomain"]'::jsonb,null,1,false),
  ('minecraft','Iron','Most popular Minecraft plan',699,4,2,50,'NVMe SSD',40,'["DDoS Protection","Modpack support","Daily backups","Free subdomain"]'::jsonb,'Popular',2,true),
  ('minecraft','Diamond','High-performance servers',1299,8,4,100,'NVMe SSD',100,'["DDoS Protection","Priority support","Daily backups","Dedicated IP option"]'::jsonb,null,3,false),
  ('minecraft','Netherite','Ultimate Minecraft experience',2499,16,6,200,'NVMe SSD',500,'["DDoS Protection","Priority support","Hourly backups","Dedicated IP"]'::jsonb,'Pro',4,false),
  ('budget','Starter VPS','Entry-level VPS',499,2,1,40,'NVMe SSD',null,'["1Gbps network","Full root access","1 IPv4"]'::jsonb,null,1,false),
  ('budget','Basic VPS','Reliable everyday VPS',899,4,2,80,'NVMe SSD',null,'["1Gbps network","Full root access","Snapshots"]'::jsonb,null,2,false),
  ('paid','Pro VPS','Production-ready VPS',1799,8,4,160,'NVMe SSD',null,'["10Gbps network","Free DDoS protection","Daily snapshots"]'::jsonb,'Popular',1,true),
  ('paid','Business VPS','Heavy workloads',3299,16,6,320,'NVMe SSD',null,'["10Gbps network","Priority support","Daily snapshots"]'::jsonb,null,2,false),
  ('premium','Elite VPS','Top-tier dedicated power',5999,32,8,640,'NVMe SSD',null,'["25Gbps network","24/7 priority support","Hourly snapshots","Dedicated IP"]'::jsonb,'Premium',1,true),
  ('premium','Enterprise VPS','Maxed-out infrastructure',9999,64,16,1280,'NVMe SSD',null,'["25Gbps network","Dedicated account manager","Hourly snapshots","Multiple IPs"]'::jsonb,null,2,false);
