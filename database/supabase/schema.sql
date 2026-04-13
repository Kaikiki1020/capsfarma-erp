create extension if not exists pgcrypto;

create table if not exists public.document_sequences (
  document_type text not null,
  year_value integer not null,
  last_value integer not null default 0,
  primary key (document_type, year_value)
);

create or replace function public.get_document_prefix(p_document_type text)
returns text
language plpgsql
immutable
as $$
begin
  return case p_document_type
    when 'quote' then 'ORC'
    when 'sale' then 'VEN'
    when 'contract' then 'CONT'
    else upper(coalesce(p_document_type, 'DOC'))
  end;
end;
$$;

create or replace function public.next_document_sequence(p_document_type text, p_year integer default extract(year from current_date)::integer)
returns integer
language plpgsql
as $$
declare
  v_next_value integer;
begin
  insert into public.document_sequences (document_type, year_value, last_value)
  values (p_document_type, p_year, 1)
  on conflict (document_type, year_value)
  do update set last_value = public.document_sequences.last_value + 1
  returning last_value into v_next_value;

  return v_next_value;
end;
$$;

create or replace function public.format_document_code(p_document_type text, p_sequence integer, p_year integer default extract(year from current_date)::integer)
returns text
language plpgsql
immutable
as $$
begin
  return public.get_document_prefix(p_document_type)
    || '-'
    || lpad(p_sequence::text, 2, '0')
    || right(p_year::text, 2);
end;
$$;

create or replace function public.generate_contract_number()
returns text
language plpgsql
as $$
declare
  v_year integer := extract(year from current_date)::integer;
  v_sequence integer;
begin
  v_sequence := public.next_document_sequence('contract', v_year);
  return public.format_document_code('contract', v_sequence, v_year);
end;
$$;

create or replace function public.generate_sale_number(p_document_type text default 'sale')
returns text
language plpgsql
as $$
declare
  v_year integer := extract(year from current_date)::integer;
  v_sequence integer;
begin
  v_sequence := public.next_document_sequence(p_document_type, v_year);
  return public.format_document_code(p_document_type, v_sequence, v_year);
end;
$$;

create or replace function public.assign_sales_document_codes()
returns trigger
language plpgsql
as $$
declare
  v_year integer := extract(year from current_date)::integer;
  v_sale_type text := case when new.status = 'finalized' then 'sale' else 'quote' end;
begin
  if tg_op = 'INSERT'
    or old.status is distinct from new.status
    or new.sale_number is null
    or new.sale_document_type is distinct from v_sale_type
  then
    new.sale_document_type := v_sale_type;
    new.sale_year := v_year;
    new.sale_sequence := public.next_document_sequence(v_sale_type, v_year);
    new.sale_number := public.format_document_code(v_sale_type, new.sale_sequence, v_year);
  end if;

  if coalesce(new.contract_number, '') = '' and coalesce(old.contract_number, '') <> '' then
    new.contract_document_type := old.contract_document_type;
    new.contract_year := old.contract_year;
    new.contract_sequence := old.contract_sequence;
    new.contract_number := old.contract_number;
  elsif coalesce(new.contract_number, '') = '' then
    new.contract_document_type := null;
    new.contract_year := null;
    new.contract_sequence := null;
    new.contract_number := null;
  elsif tg_op = 'INSERT'
    or coalesce(old.contract_number, '') = ''
    or new.contract_document_type is null
    or new.contract_year is null
    or new.contract_sequence is null
  then
    new.contract_document_type := 'contract';
    new.contract_year := v_year;
    new.contract_sequence := public.next_document_sequence('contract', v_year);
    new.contract_number := public.format_document_code('contract', new.contract_sequence, v_year);
  end if;

  return new;
end;
$$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  login_code char(3) not null unique check (login_code ~ '^[0-9]{3}$'),
  password_hash text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.module_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  module_key text not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  unique (user_id, module_key)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text not null,
  cpf text,
  email text,
  phone text,
  contact text,
  address text not null,
  city text,
  state text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.customers add column if not exists cpf text;
alter table public.customers add column if not exists email text;
alter table public.customers add column if not exists phone text;
alter table public.customers add column if not exists contact text;
alter table public.customers add column if not exists city text;
alter table public.customers add column if not exists state text;
alter table public.customers add column if not exists notes text;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  sku text not null unique,
  category text not null,
  quantity numeric(14,2) not null default 0,
  unit text not null,
  reorder_point numeric(14,2) not null default 0,
  location text,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  category text not null,
  unit text not null,
  minimum_stock numeric(14,2) not null default 0,
  current_stock numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0,
  sale_price numeric(14,2) not null default 0,
  supplier text,
  batch text,
  machine_serial text,
  expiration_date date,
  location text,
  description text,
  last_moved_by_user_id uuid references public.app_users(id) on delete set null,
  last_moved_by_name text,
  last_movement_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  product_code text not null,
  movement_type text not null check (movement_type in ('entry', 'exit', 'adjustment')),
  quantity numeric(14,2) not null,
  batch text,
  machine_serial text,
  notes text,
  moved_by_user_id uuid references public.app_users(id) on delete set null,
  moved_by_name text,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists last_moved_by_user_id uuid references public.app_users(id) on delete set null;
alter table public.products add column if not exists last_moved_by_name text;
alter table public.products add column if not exists last_movement_at timestamptz;

alter table public.inventory_movements add column if not exists moved_by_user_id uuid references public.app_users(id) on delete set null;
alter table public.inventory_movements add column if not exists moved_by_name text;

create table if not exists public.bom_materials (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text not null,
  unit text not null,
  unit_cost numeric(14,2) not null default 0,
  supplier text,
  current_stock numeric(14,2) not null default 0,
  minimum_stock numeric(14,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.bom_structures (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  product_id uuid references public.products(id) on delete restrict,
  product_code text,
  product_name text,
  name text not null,
  version text not null,
  batch_size numeric(14,2) not null default 1,
  batch_unit text not null,
  status text not null default 'draft' check (status in ('draft', 'active')),
  total_cost numeric(14,2) not null default 0,
  instructions text,
  height numeric(14,2),
  width numeric(14,2),
  length numeric(14,2),
  weight numeric(14,2),
  notes text,
  attachments jsonb not null default '[]'::jsonb,
  structure_items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (code, version)
);

alter table public.bom_structures add column if not exists product_id uuid references public.products(id) on delete restrict;
alter table public.bom_structures add column if not exists product_code text;
alter table public.bom_structures add column if not exists product_name text;
alter table public.bom_structures add column if not exists height numeric(14,2);
alter table public.bom_structures add column if not exists width numeric(14,2);
alter table public.bom_structures add column if not exists length numeric(14,2);
alter table public.bom_structures add column if not exists weight numeric(14,2);
alter table public.bom_structures add column if not exists notes text;
alter table public.bom_structures add column if not exists attachments jsonb not null default '[]'::jsonb;

create table if not exists public.bom_items (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  version text not null,
  component_name text not null,
  component_code text not null,
  quantity_required numeric(14,4) not null,
  unit text not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.production_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  product_id uuid references public.products(id) on delete restrict,
  product_code text,
  product_name text not null,
  batch_size numeric(14,2) not null,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed', 'cancelled')),
  planned_start date not null,
  planned_end date not null,
  lot_number text,
  responsible_name text,
  sale_id uuid,
  sale_number text,
  customer_name text,
  origin text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.logs_sistema (
  id uuid primary key default gen_random_uuid(),
  modulo text not null,
  acao text not null,
  usuario_id uuid references public.app_users(id) on delete set null,
  usuario_nome text,
  usuario_perfil text,
  ip text,
  item_afetado text,
  descricao text,
  nivel text not null default 'Informativo' check (nivel in ('Informativo', 'Atencao', 'Critico')),
  entidade_id text,
  entidade_tipo text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists logs_sistema_modulo_idx on public.logs_sistema (modulo);
create index if not exists logs_sistema_usuario_nome_idx on public.logs_sistema (usuario_nome);
create index if not exists logs_sistema_acao_idx on public.logs_sistema (acao);
create index if not exists logs_sistema_nivel_idx on public.logs_sistema (nivel);
create index if not exists logs_sistema_created_at_idx on public.logs_sistema (created_at desc);

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  opened_at date not null default current_date,
  created_by_user_id uuid references public.app_users(id) on delete set null,
  created_by_name text,
  sector text,
  order_type text,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text,
  customer_phone text,
  customer_email text,
  customer_document text,
  customer_address text,
  title text not null,
  description text,
  reported_problem text,
  planned_solution text,
  internal_notes text,
  priority text not null default 'medium',
  status text not null default 'open',
  started_at timestamptz,
  deadline_at date,
  expected_completion_at date,
  completed_at timestamptz,
  estimated_time text,
  actual_time text,
  responsible_user_id uuid references public.app_users(id) on delete set null,
  responsible_name text,
  assistant_user_ids jsonb not null default '[]'::jsonb,
  assistant_names jsonb not null default '[]'::jsonb,
  estimated_cost numeric(14,2) not null default 0,
  final_cost numeric(14,2) not null default 0,
  financial_notes text,
  materials jsonb not null default '[]'::jsonb,
  linked_production_id uuid references public.production_orders(id) on delete set null,
  linked_production_number text,
  production_demand_requested boolean not null default false,
  production_demand_notes text,
  result_summary text,
  final_notes text,
  history_entries jsonb not null default '[]'::jsonb,
  progress_entries jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.production_orders add column if not exists product_id uuid references public.products(id) on delete restrict;
alter table public.production_orders add column if not exists product_code text;
alter table public.production_orders add column if not exists priority text not null default 'media';
alter table public.production_orders add column if not exists lot_number text;
alter table public.production_orders add column if not exists responsible_name text;
alter table public.production_orders add column if not exists sale_id uuid;
alter table public.production_orders add column if not exists sale_number text;
alter table public.production_orders add column if not exists customer_name text;
alter table public.production_orders add column if not exists origin text;

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique,
  requester_id uuid references public.app_users(id) on delete set null,
  requester_name text not null,
  department text,
  sector text not null,
  item_name text not null,
  quantity numeric(14,2) not null,
  priority text not null default 'media' check (priority in ('baixa', 'media', 'alta', 'urgente')),
  urgency text not null default 'media' check (urgency in ('baixa', 'media', 'alta', 'urgente')),
  needed_by date,
  justification text,
  status text not null default 'pending' check (status in ('pending', 'in_analysis', 'approved', 'in_purchase', 'purchase_completed', 'completed', 'cancelled', 'rejected')),
  request_items jsonb not null default '[]'::jsonb,
  estimated_total numeric(14,2) not null default 0,
  purchase_details jsonb not null default '{}'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.purchase_requests add column if not exists request_number text;
alter table public.purchase_requests add column if not exists requester_id uuid references public.app_users(id) on delete set null;
alter table public.purchase_requests add column if not exists department text;
alter table public.purchase_requests add column if not exists urgency text not null default 'media';
alter table public.purchase_requests add column if not exists request_items jsonb not null default '[]'::jsonb;
alter table public.purchase_requests add column if not exists estimated_total numeric(14,2) not null default 0;
alter table public.purchase_requests add column if not exists purchase_details jsonb not null default '{}'::jsonb;
alter table public.purchase_requests add column if not exists notifications jsonb not null default '[]'::jsonb;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'purchase_requests_priority_check'
      and conrelid = 'public.purchase_requests'::regclass
  ) then
    alter table public.purchase_requests drop constraint purchase_requests_priority_check;
  end if;
exception
  when undefined_table then null;
end $$;

alter table public.purchase_requests
  add constraint purchase_requests_priority_check
  check (priority in ('baixa', 'media', 'alta', 'urgente'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'purchase_requests_urgency_check'
      and conrelid = 'public.purchase_requests'::regclass
  ) then
    alter table public.purchase_requests drop constraint purchase_requests_urgency_check;
  end if;
exception
  when undefined_table then null;
end $$;

alter table public.purchase_requests
  add constraint purchase_requests_urgency_check
  check (urgency in ('baixa', 'media', 'alta', 'urgente'));

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'purchase_requests_status_check'
      and conrelid = 'public.purchase_requests'::regclass
  ) then
    alter table public.purchase_requests drop constraint purchase_requests_status_check;
  end if;
exception
  when undefined_table then null;
end $$;

alter table public.purchase_requests
  add constraint purchase_requests_status_check
  check (status in ('pending', 'in_analysis', 'approved', 'in_purchase', 'purchase_completed', 'completed', 'cancelled', 'rejected'));

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_document_type text not null default 'quote',
  sale_sequence integer not null default 1,
  sale_year integer not null default extract(year from current_date)::integer,
  sale_number text not null unique default public.generate_sale_number('quote'),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  cnpj text not null,
  address text not null,
  invoice_number text,
  contract_document_type text,
  contract_sequence integer,
  contract_year integer,
  contract_number text unique,
  contract_notes text,
  payment_method text,
  status text not null default 'quote' check (status in ('quote', 'finalized')),
  sale_items jsonb not null default '[]'::jsonb,
  subtotal_amount numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  production_generated boolean not null default false,
  production_order_ids jsonb not null default '[]'::jsonb,
  sale_date date not null,
  delivery_date date not null,
  created_at timestamptz not null default now()
);

alter table public.sales add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.sales add column if not exists sale_document_type text not null default 'quote';
alter table public.sales add column if not exists sale_sequence integer not null default 1;
alter table public.sales add column if not exists sale_year integer not null default extract(year from current_date)::integer;
alter table public.sales alter column invoice_number drop not null;
alter table public.sales add column if not exists contract_document_type text;
alter table public.sales add column if not exists contract_sequence integer;
alter table public.sales add column if not exists contract_year integer;
alter table public.sales add column if not exists payment_method text;
alter table public.sales add column if not exists status text not null default 'quote';
alter table public.sales add column if not exists sale_items jsonb not null default '[]'::jsonb;
alter table public.sales add column if not exists subtotal_amount numeric(14,2) not null default 0;
alter table public.sales add column if not exists discount_amount numeric(14,2) not null default 0;
alter table public.sales add column if not exists total_amount numeric(14,2) not null default 0;
alter table public.sales add column if not exists production_generated boolean not null default false;
alter table public.sales add column if not exists production_order_ids jsonb not null default '[]'::jsonb;
alter table public.sales alter column contract_number drop not null;
alter table public.sales alter column contract_number drop default;

update public.sales
set sale_document_type = case when status = 'finalized' then 'sale' else 'quote' end
where sale_document_type is null or sale_document_type = '';

update public.sales
set sale_year = coalesce(sale_year, extract(year from coalesce(created_at, now()))::integer)
where sale_year is null;

update public.sales
set contract_document_type = case when coalesce(contract_number, '') <> '' then 'contract' else null end
where contract_document_type is null and coalesce(contract_number, '') <> '';

update public.sales
set contract_year = coalesce(contract_year, extract(year from coalesce(created_at, now()))::integer)
where contract_year is null and coalesce(contract_number, '') <> '';

with ranked_sales as (
  select
    id,
    row_number() over (
      partition by sale_document_type, sale_year
      order by created_at, id
    )::integer as next_sequence
  from public.sales
)
update public.sales as s
set sale_sequence = ranked_sales.next_sequence,
    sale_number = public.format_document_code(s.sale_document_type, ranked_sales.next_sequence, s.sale_year)
from ranked_sales
where s.id = ranked_sales.id
  and (
    s.sale_sequence is null
    or s.sale_sequence <> ranked_sales.next_sequence
    or s.sale_number is null
    or s.sale_number = ''
  );

with ranked_contracts as (
  select
    id,
    row_number() over (
      partition by contract_document_type, contract_year
      order by created_at, id
    )::integer as next_sequence
  from public.sales
  where contract_document_type is not null
)
update public.sales as s
set contract_sequence = ranked_contracts.next_sequence,
    contract_number = public.format_document_code('contract', ranked_contracts.next_sequence, s.contract_year)
from ranked_contracts
where s.id = ranked_contracts.id
  and (
    s.contract_sequence is null
    or s.contract_sequence <> ranked_contracts.next_sequence
    or s.contract_number is null
    or s.contract_number = ''
  );

insert into public.document_sequences (document_type, year_value, last_value)
select sale_document_type, sale_year, max(sale_sequence)
from public.sales
group by sale_document_type, sale_year
on conflict (document_type, year_value)
do update set last_value = greatest(public.document_sequences.last_value, excluded.last_value);

insert into public.document_sequences (document_type, year_value, last_value)
select 'contract', contract_year, max(contract_sequence)
from public.sales
where contract_document_type is not null
group by contract_year
on conflict (document_type, year_value)
do update set last_value = greatest(public.document_sequences.last_value, excluded.last_value);

create unique index if not exists sales_document_identity_unique_idx
  on public.sales (sale_document_type, sale_year, sale_sequence);

create unique index if not exists sales_contract_identity_unique_idx
  on public.sales (contract_document_type, contract_year, contract_sequence)
  where contract_document_type is not null;

drop trigger if exists assign_sales_document_codes_trigger on public.sales;
create trigger assign_sales_document_codes_trigger
before insert or update on public.sales
for each row execute function public.assign_sales_document_codes();

create or replace function public.seed_default_permissions(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
as $$
declare
  module_name text;
  modules text[] := array[
    'dashboard',
    'products',
    'bom',
    'inventory',
    'production',
    'service_orders',
    'customers',
    'sales',
    'purchases',
    'permissions'
  ];
begin
  foreach module_name in array modules loop
    insert into public.module_permissions (user_id, module_key, can_view, can_edit)
    values (
      p_user_id,
      module_name,
      p_is_admin,
      p_is_admin
    )
    on conflict (user_id, module_key) do nothing;
  end loop;
end;
$$;

create or replace function public.register_user(
  p_full_name text,
  p_phone text,
  p_login_code text,
  p_password text
)
returns table (
  user_id uuid,
  full_name text,
  role text
)
language plpgsql
security definer
as $$
declare
  existing_users integer;
  new_role text;
  new_user_id uuid;
begin
  if p_login_code !~ '^[0-9]{3}$' then
    raise exception 'Codigo de login deve conter exatamente 3 numeros';
  end if;

  select count(*) into existing_users from public.app_users;
  new_role := case when existing_users = 0 then 'admin' else 'user' end;

  insert into public.app_users (
    full_name,
    phone,
    login_code,
    password_hash,
    role
  )
  values (
    p_full_name,
    p_phone,
    p_login_code,
    crypt(p_password, gen_salt('bf')),
    new_role
  )
  returning id into new_user_id;

  perform public.seed_default_permissions(new_user_id, new_role = 'admin');

  return query
  select
    u.id,
    u.full_name,
    u.role
  from public.app_users u
  where u.id = new_user_id;
end;
$$;

create or replace view public.user_permissions_view as
select
  u.id as user_id,
  u.full_name,
  u.phone,
  u.role,
  p.module_key,
  p.can_view,
  p.can_edit
from public.app_users u
left join public.module_permissions p on p.user_id = u.id;

alter table public.app_users enable row level security;
alter table public.module_permissions enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.bom_materials enable row level security;
alter table public.bom_structures enable row level security;
alter table public.bom_items enable row level security;
alter table public.production_orders enable row level security;
alter table public.logs_sistema enable row level security;
alter table public.service_orders enable row level security;
alter table public.purchase_requests enable row level security;
alter table public.sales enable row level security;

drop policy if exists "Allow app read users" on public.app_users;
drop policy if exists "Allow app update users" on public.app_users;
drop policy if exists "Allow app read permissions" on public.module_permissions;
drop policy if exists "Allow app write permissions" on public.module_permissions;
drop policy if exists "Allow app write customers" on public.customers;
drop policy if exists "Allow app write products" on public.products;
drop policy if exists "Allow app write inventory" on public.inventory_items;
drop policy if exists "Allow app write inventory movements" on public.inventory_movements;
drop policy if exists "Allow app write bom materials" on public.bom_materials;
drop policy if exists "Allow app write bom structures" on public.bom_structures;
drop policy if exists "Allow app write bom" on public.bom_items;
drop policy if exists "Allow app write production" on public.production_orders;
drop policy if exists "Allow app write audit logs" on public.logs_sistema;
drop policy if exists "Allow app write service_orders" on public.service_orders;
drop policy if exists "Allow app write purchase_requests" on public.purchase_requests;
drop policy if exists "Allow app write sales" on public.sales;

create policy "Allow app read users" on public.app_users
for select using (true);

create policy "Allow app update users" on public.app_users
for update using (true);

create policy "Allow app read permissions" on public.module_permissions
for select using (true);

create policy "Allow app write permissions" on public.module_permissions
for all using (true) with check (true);

create policy "Allow app write customers" on public.customers
for all using (true) with check (true);

create policy "Allow app write products" on public.products
for all using (true) with check (true);

create policy "Allow app write inventory" on public.inventory_items
for all using (true) with check (true);

create policy "Allow app write inventory movements" on public.inventory_movements
for all using (true) with check (true);

create policy "Allow app write bom materials" on public.bom_materials
for all using (true) with check (true);

create policy "Allow app write bom structures" on public.bom_structures
for all using (true) with check (true);

create policy "Allow app write bom" on public.bom_items
for all using (true) with check (true);

create policy "Allow app write production" on public.production_orders
for all using (true) with check (true);

create policy "Allow app write audit logs" on public.logs_sistema
for all using (true) with check (true);

create policy "Allow app write service_orders" on public.service_orders
for all using (true) with check (true);

create policy "Allow app write purchase_requests" on public.purchase_requests
for all using (true) with check (true);

create policy "Allow app write sales" on public.sales
for all using (true) with check (true);

alter table public.app_users drop constraint if exists app_users_role_check;
alter table public.app_users alter column role drop default;
alter table public.app_users add column if not exists email text;
alter table public.app_users add column if not exists department text;
alter table public.app_users add column if not exists permission_role_id uuid;
alter table public.app_users add column if not exists failed_login_attempts integer not null default 0;
alter table public.app_users add column if not exists locked_until timestamptz;
alter table public.app_users add column if not exists last_failed_login_at timestamptz;
alter table public.app_users add column if not exists last_login_at timestamptz;
alter table public.app_users add column if not exists session_nonce uuid not null default gen_random_uuid();

create table if not exists public.permission_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.permission_role_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_role_id uuid not null references public.permission_roles(id) on delete cascade,
  module_key text not null,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  unique (permission_role_id, module_key)
);

alter table public.app_users drop constraint if exists app_users_permission_role_id_fkey;
alter table public.app_users
  add constraint app_users_permission_role_id_fkey
  foreign key (permission_role_id)
  references public.permission_roles(id)
  on delete set null;

create table if not exists public.app_private_settings (
  setting_key text primary key,
  setting_value text not null,
  created_at timestamptz not null default now()
);

insert into public.app_private_settings (setting_key, setting_value)
values ('app_jwt_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (setting_key) do nothing;

create or replace function public.normalize_staff_role(p_role text)
returns text
language sql
immutable
as $$
  select case upper(trim(coalesce(p_role, '')))
    when 'ADMNISTRADOR' then 'ADMINISTRADOR'
    when 'ADMINISTRADOR' then 'ADMINISTRADOR'
    when 'ADM' then 'ADMINISTRADOR'
    else upper(trim(coalesce(p_role, '')))
  end;
$$;

create or replace function public.is_permissions_admin_role(p_role text)
returns boolean
language sql
immutable
as $$
  select public.normalize_staff_role(p_role) in ('TI', 'ADMINISTRADOR');
$$;

create or replace function public.is_ti_role(p_role text)
returns boolean
language sql
immutable
as $$
  select public.normalize_staff_role(p_role) = 'TI';
$$;

create or replace function public.base64url_encode(p_data bytea)
returns text
language sql
immutable
as $$
  select rtrim(translate(replace(encode(p_data, 'base64'), E'\n', ''), '+/', '-_'), '=');
$$;

create or replace function public.base64url_decode_text(p_data text)
returns text
language sql
immutable
as $$
  select convert_from(
    decode(
      translate(
        p_data || repeat('=', (4 - length(p_data) % 4) % 4),
        '-_',
        '+/'
      ),
      'base64'
    ),
    'utf8'
  );
$$;

create or replace function public.get_app_jwt_secret()
returns text
language sql
security definer
stable
as $$
  select setting_value
  from public.app_private_settings
  where setting_key = 'app_jwt_secret';
$$;


create or replace function public.generate_app_jwt(
  p_user_id uuid,
  p_role text,
  p_expires_at timestamptz,
  p_session_nonce uuid default null
)
returns text
language plpgsql
security definer
stable
as $$
declare
  header_text text := '{"alg":"HS256","typ":"JWT"}';
  payload_text text;
  encoded_header text;
  encoded_payload text;
  signature text;
  secret text;
begin
  secret := public.get_app_jwt_secret();
  payload_text := jsonb_build_object(
    'sub', p_user_id,
    'role', public.normalize_staff_role(p_role),
    'exp', floor(extract(epoch from p_expires_at)),
    'nonce', coalesce(p_session_nonce, gen_random_uuid())
  )::text;

  encoded_header := public.base64url_encode(convert_to(header_text, 'utf8'));
  encoded_payload := public.base64url_encode(convert_to(payload_text, 'utf8'));
  signature := public.base64url_encode(hmac(encoded_header || '.' || encoded_payload, secret, 'sha256'));

  return encoded_header || '.' || encoded_payload || '.' || signature;
end;
$$;

create or replace function public.get_session_user_from_token(p_access_token text)
returns public.app_users
language plpgsql
security definer
stable
as $$
declare
  parts text[];
  payload jsonb;
  expected_signature text;
  user_record public.app_users%rowtype;
  token_nonce uuid;
begin
  if coalesce(trim(p_access_token), '') = '' then
    raise exception 'Token JWT ausente';
  end if;

  parts := string_to_array(p_access_token, '.');
  if array_length(parts, 1) <> 3 then
    raise exception 'Token JWT invalido';
  end if;

  expected_signature := public.base64url_encode(
    hmac(parts[1] || '.' || parts[2], public.get_app_jwt_secret(), 'sha256')
  );

  if expected_signature <> parts[3] then
    raise exception 'Token JWT invalido';
  end if;

  payload := public.base64url_decode_text(parts[2])::jsonb;
  if coalesce((payload ->> 'exp')::bigint, 0) < extract(epoch from now())::bigint then
    raise exception 'Token JWT expirado';
  end if;

  begin
    token_nonce := nullif(payload ->> 'nonce', '')::uuid;
  exception
    when others then
      raise exception 'Sessao invalida ou expirada';
  end;

  select *
    into user_record
  from public.app_users
  where id = (payload ->> 'sub')::uuid
    and is_active = true;

  if not found then
    raise exception 'Sessao invalida ou usuario inativo';
  end if;

  if token_nonce is null or token_nonce <> user_record.session_nonce then
    raise exception 'Sessao invalida ou expirada';
  end if;

  return user_record;
end;
$$;

create or replace function public.require_permissions_admin(p_access_token text)
returns public.app_users
language plpgsql
security definer
stable
as $$
declare
  actor_user public.app_users;
begin
  actor_user := public.get_session_user_from_token(p_access_token);
  if not public.is_permissions_admin_role(actor_user.role) then
    raise exception 'Acesso negado. Somente TI e ADMNISTRADOR podem acessar este modulo.' using errcode = '42501';
  end if;
  return actor_user;
end;
$$;

create or replace function public.require_ti_user(p_access_token text)
returns public.app_users
language plpgsql
security definer
stable
as $$
declare
  actor_user public.app_users;
begin
  actor_user := public.get_session_user_from_token(p_access_token);
  if not public.is_ti_role(actor_user.role) then
    raise exception 'Acesso nao autorizado' using errcode = '42501';
  end if;
  return actor_user;
end;
$$;

create or replace function public.get_sales_document_settings(p_access_token text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  settings_text text;
begin
  perform public.get_session_user_from_token(p_access_token);

  select setting_value
    into settings_text
  from public.app_private_settings
  where setting_key = 'sales_document_settings';

  return coalesce(settings_text::jsonb, '{}'::jsonb);
exception
  when invalid_text_representation then
    return '{}'::jsonb;
end;
$$;

create or replace function public.save_sales_document_settings(
  p_access_token text,
  p_settings jsonb
)
returns jsonb
language plpgsql
security definer
as $$
begin
  perform public.require_permissions_admin(p_access_token);

  insert into public.app_private_settings (setting_key, setting_value)
  values ('sales_document_settings', coalesce(p_settings, '{}'::jsonb)::text)
  on conflict (setting_key) do update
    set setting_value = excluded.setting_value;

  return coalesce(p_settings, '{}'::jsonb);
end;
$$;

create or replace function public.seed_permission_role_modules(
  p_permission_role_id uuid,
  p_allow_permissions_module boolean,
  p_allow_vps_module boolean
)
returns void
language plpgsql
security definer
as $$
declare
  module_name text;
  modules text[] := array[
    'dashboard',
    'products',
    'bom',
    'inventory',
    'production',
    'service_orders',
    'machining',
    'customers',
    'sales',
    'purchases',
    'permissions',
    'vps'
  ];
begin
  foreach module_name in array modules loop
    insert into public.permission_role_permissions (permission_role_id, module_key, can_view, can_edit)
    values (
      p_permission_role_id,
      module_name,
      case
        when module_name = 'permissions' then p_allow_permissions_module
        when module_name = 'vps' then p_allow_vps_module
        else true
      end,
      case
        when module_name = 'permissions' then p_allow_permissions_module
        when module_name = 'vps' then p_allow_vps_module
        else true
      end
    )
    on conflict (permission_role_id, module_key) do update
      set can_view = excluded.can_view,
          can_edit = excluded.can_edit;
  end loop;
end;
$$;

create or replace function public.seed_system_permission_roles()
returns void
language plpgsql
security definer
as $$
declare
  admin_role_id uuid;
  ti_role_id uuid;
  operational_role_id uuid;
begin
  insert into public.permission_roles (name, description, is_system)
  values ('ADMINISTRADOR', 'Acesso total ao ERP e ao modulo de permissoes.', true)
  on conflict (name) do update
    set description = excluded.description,
        is_system = true
  returning id into admin_role_id;

  insert into public.permission_roles (name, description, is_system)
  values ('TI', 'Gestao tecnica, seguranca e administracao de acessos.', true)
  on conflict (name) do update
    set description = excluded.description,
        is_system = true
  returning id into ti_role_id;

  insert into public.permission_roles (name, description, is_system)
  values ('OPERACIONAL PADRAO', 'Perfil padrao para operacao sem acesso ao modulo de permissoes.', true)
  on conflict (name) do update
    set description = excluded.description,
        is_system = true
  returning id into operational_role_id;

  perform public.seed_permission_role_modules(admin_role_id, true, false);
  perform public.seed_permission_role_modules(ti_role_id, true, true);
  perform public.seed_permission_role_modules(operational_role_id, false, false);
end;
$$;

select public.seed_system_permission_roles();

insert into public.permission_role_permissions (permission_role_id, module_key, can_view, can_edit)
select
  pr.id,
  'vps',
  pr.name = 'TI',
  pr.name = 'TI'
from public.permission_roles pr
on conflict (permission_role_id, module_key) do update
set
  can_view = excluded.can_view,
  can_edit = excluded.can_edit;

update public.app_users
set role = case
  when role = 'admin' then 'ADMINISTRADOR'
  when role = 'user' then 'USINAGEM'
  when public.normalize_staff_role(role) in ('TI', 'ADMINISTRADOR', 'USINAGEM', 'MONTAGEM', 'FABRICACAO', 'VENDEDOR', 'COMPRAS', 'FINANCEIRO')
    then public.normalize_staff_role(role)
  else 'USINAGEM'
end;

alter table public.app_users add constraint app_users_role_check check (
  role in ('TI', 'ADMINISTRADOR', 'USINAGEM', 'MONTAGEM', 'FABRICACAO', 'VENDEDOR', 'COMPRAS', 'FINANCEIRO')
);

update public.app_users
set permission_role_id = pr.id
from public.permission_roles pr
where public.app_users.permission_role_id is null
  and (
    (public.is_ti_role(public.app_users.role) and pr.name = 'TI')
    or (public.normalize_staff_role(public.app_users.role) = 'ADMINISTRADOR' and pr.name = 'ADMINISTRADOR')
    or (not public.is_permissions_admin_role(public.app_users.role) and pr.name = 'OPERACIONAL PADRAO')
  );

update public.app_users
set department = role
where department is null or trim(department) = '';

create or replace function public.permission_role_grants_permissions_module(p_permission_role_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.permission_role_permissions
    where permission_role_id = p_permission_role_id
      and module_key = 'permissions'
      and (can_view = true or can_edit = true)
  );
$$;

create or replace function public.permission_role_grants_vps_module(p_permission_role_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.permission_role_permissions
    where permission_role_id = p_permission_role_id
      and module_key = 'vps'
      and (can_view = true or can_edit = true)
  );
$$;

create or replace function public.get_my_permissions(p_access_token text)
returns table (
  module_key text,
  can_view boolean,
  can_edit boolean
)
language plpgsql
security definer
stable
as $$
declare
  actor_user public.app_users;
begin
  actor_user := public.get_session_user_from_token(p_access_token);

  return query
  select
    p.module_key,
    case
      when p.module_key = 'permissions' then public.is_permissions_admin_role(actor_user.role)
      when p.module_key = 'vps' then public.is_ti_role(actor_user.role)
      else p.can_view
    end as can_view,
    case
      when p.module_key = 'permissions' then public.is_permissions_admin_role(actor_user.role)
      when p.module_key = 'vps' then public.is_ti_role(actor_user.role)
      else p.can_edit
    end as can_edit
  from public.permission_role_permissions p
  where p.permission_role_id = actor_user.permission_role_id;
end;
$$;

create or replace function public.register_user(
  p_full_name text,
  p_phone text,
  p_login_code text,
  p_password text
)
returns table (
  user_id uuid,
  full_name text,
  role text
)
language plpgsql
security definer
as $$
declare
  existing_users integer;
  new_user_id uuid;
  admin_permission_role_id uuid;
begin
  select count(*) into existing_users from public.app_users;
  if existing_users > 0 then
    raise exception 'Cadastro publico desativado. Use o modulo de permissoes para cadastrar funcionarios.';
  end if;

  if p_login_code !~ '^[0-9]{3}$' then
    raise exception 'Codigo de login deve conter exatamente 3 numeros';
  end if;

  select id into admin_permission_role_id
  from public.permission_roles
  where name = 'ADMINISTRADOR';

  insert into public.app_users (
    full_name,
    phone,
    login_code,
    password_hash,
    role,
    permission_role_id
  )
  values (
    p_full_name,
    p_phone,
    p_login_code,
    crypt(p_password, gen_salt('bf')),
    'ADMINISTRADOR',
    admin_permission_role_id
  )
  returning id into new_user_id;

  return query
  select
    u.id,
    u.full_name,
    u.role
  from public.app_users u
  where u.id = new_user_id;
end;
$$;

drop function if exists public.login_user(text, text);

create function public.login_user(
  p_login_code text,
  p_password text
)
returns table (
  user_id uuid,
  full_name text,
  phone text,
  role text,
  email text,
  department text,
  permission_role_id uuid,
  access_token text
)
language plpgsql
security definer
as $$
declare
  target_user public.app_users%rowtype;
  v_session_nonce uuid := gen_random_uuid();
  invalid_credentials_message text := 'Codigo ou senha invalidos';
begin
  if coalesce(trim(p_login_code), '') !~ '^[0-9]{3}$'
    or coalesce(trim(p_password), '') = '' then
    raise exception '%', invalid_credentials_message;
  end if;

  select *
    into target_user
  from public.app_users u
  where u.login_code = p_login_code
    and u.is_active = true;

  if not found then
    raise exception '%', invalid_credentials_message;
  end if;

  if target_user.locked_until is not null and target_user.locked_until > now() then
    raise exception '%', invalid_credentials_message;
  end if;

  if target_user.password_hash <> crypt(p_password, target_user.password_hash) then
    update public.app_users
    set failed_login_attempts = failed_login_attempts + 1,
      last_failed_login_at = now(),
      locked_until = case
        when failed_login_attempts + 1 >= 5 then now() + interval '15 minutes'
        else null
      end
    where id = target_user.id;

    raise exception '%', invalid_credentials_message;
  end if;

  update public.app_users
    set failed_login_attempts = 0,
      locked_until = null,
      last_failed_login_at = null,
      last_login_at = now(),
      session_nonce = v_session_nonce
  where id = target_user.id
  returning * into target_user;

  return query
  select
    target_user.id,
    target_user.full_name,
    target_user.phone,
    target_user.role,
    target_user.email,
    target_user.department,
    target_user.permission_role_id,
    public.generate_app_jwt(target_user.id, target_user.role, now() + interval '8 hours', v_session_nonce);
end;
$$;

create or replace function public.list_active_app_users(p_access_token text)
returns table (
  id uuid,
  full_name text,
  email text,
  role text,
  is_active boolean
)
language plpgsql
security definer
stable
as $$
begin
  perform public.get_session_user_from_token(p_access_token);

  return query
  select
    u.id,
    u.full_name,
    u.email,
    u.role,
    u.is_active
  from public.app_users u
  where u.is_active = true
  order by u.full_name asc;
end;
$$;

create or replace function public.get_permissions_admin_snapshot(p_access_token text)
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  actor_user public.app_users;
  roles_json jsonb;
  users_json jsonb;
begin
  actor_user := public.require_permissions_admin(p_access_token);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', pr.id,
        'name', pr.name,
        'description', pr.description,
        'is_system', pr.is_system,
        'permissions', coalesce(role_permissions.permissions, '[]'::jsonb)
      )
      order by pr.created_at desc
    ),
    '[]'::jsonb
  )
  into roles_json
  from public.permission_roles pr
  left join lateral (
    select jsonb_agg(
      jsonb_build_object(
        'module_key', pp.module_key,
        'can_view', pp.can_view,
        'can_edit', pp.can_edit
      )
      order by pp.module_key asc
    ) as permissions
    from public.permission_role_permissions pp
    where pp.permission_role_id = pr.id
  ) role_permissions on true;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'full_name', u.full_name,
        'email', u.email,
        'phone', u.phone,
        'login_code', u.login_code,
        'role', u.role,
        'department', u.department,
        'is_active', u.is_active,
        'created_at', u.created_at,
        'permission_role_id', u.permission_role_id,
        'permission_role_name', pr.name
      )
      order by u.created_at desc
    ),
    '[]'::jsonb
  )
  into users_json
  from public.app_users u
  left join public.permission_roles pr on pr.id = u.permission_role_id;

  return jsonb_build_object(
    'roles', roles_json,
    'users', users_json,
    'current_user_id', actor_user.id
  );
end;
$$;

create or replace function public.save_permission_role(
  p_access_token text,
  p_role_id uuid,
  p_name text,
  p_description text,
  p_permissions jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  normalized_name text;
  saved_role_id uuid;
  permission_item jsonb;
  existing_role public.permission_roles;
begin
  actor_user := public.require_permissions_admin(p_access_token);
  normalized_name := public.normalize_staff_role(p_name);

  if normalized_name = '' then
    raise exception 'Nome do papel e obrigatorio';
  end if;

  if normalized_name not in ('TI', 'ADMINISTRADOR')
     and exists (
       select 1
       from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) as item
       where item ->> 'module_key' = 'permissions'
         and (
           coalesce((item ->> 'can_view')::boolean, false) = true
           or coalesce((item ->> 'can_edit')::boolean, false) = true
         )
     ) then
    raise exception 'Apenas os papeis TI e ADMINISTRADOR podem receber acesso ao modulo Permissoes.' using errcode = '42501';
  end if;

  if normalized_name not in ('TI', 'ADMINISTRADOR')
     and exists (
       select 1
       from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) as item
       where item ->> 'module_key' = 'dashboard'
         and coalesce((item ->> 'can_edit')::boolean, false) = true
     ) then
    raise exception 'Apenas os papeis TI e ADMINISTRADOR podem editar o dashboard.' using errcode = '42501';
  end if;

  if normalized_name <> 'TI'
     and exists (
       select 1
       from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb)) as item
       where item ->> 'module_key' = 'vps'
         and (
           coalesce((item ->> 'can_view')::boolean, false) = true
           or coalesce((item ->> 'can_edit')::boolean, false) = true
         )
     ) then
    raise exception 'Somente o papel TI pode receber acesso ao modulo Controle da VPS.' using errcode = '42501';
  end if;

  if p_role_id is null then
    insert into public.permission_roles (name, description, is_system)
    values (normalized_name, nullif(trim(coalesce(p_description, '')), ''), false)
    returning id into saved_role_id;
  else
    select * into existing_role
    from public.permission_roles
    where id = p_role_id;

    if not found then
      raise exception 'Papel nao encontrado';
    end if;

    if existing_role.is_system and existing_role.name <> normalized_name then
      raise exception 'Nao e permitido renomear papeis de sistema.';
    end if;

    update public.permission_roles
    set
      name = normalized_name,
      description = nullif(trim(coalesce(p_description, '')), '')
    where id = p_role_id
    returning id into saved_role_id;

    delete from public.permission_role_permissions
    where permission_role_id = saved_role_id;
  end if;

  for permission_item in
    select * from jsonb_array_elements(coalesce(p_permissions, '[]'::jsonb))
  loop
    insert into public.permission_role_permissions (
      permission_role_id,
      module_key,
      can_view,
      can_edit
    )
    values (
      saved_role_id,
      permission_item ->> 'module_key',
      case
        when permission_item ->> 'module_key' = 'permissions' and normalized_name not in ('TI', 'ADMINISTRADOR') then false
        when permission_item ->> 'module_key' = 'vps' and normalized_name <> 'TI' then false
        else coalesce((permission_item ->> 'can_view')::boolean, false)
      end,
      case
        when permission_item ->> 'module_key' = 'permissions' and normalized_name not in ('TI', 'ADMINISTRADOR') then false
        when permission_item ->> 'module_key' = 'dashboard' and normalized_name not in ('TI', 'ADMINISTRADOR') then false
        when permission_item ->> 'module_key' = 'vps' and normalized_name <> 'TI' then false
        else coalesce((permission_item ->> 'can_edit')::boolean, false)
      end
    );
  end loop;

  return saved_role_id;
end;
$$;

create table if not exists public.vps_snapshots (
  id uuid primary key default gen_random_uuid(),
  server_status text not null default 'unknown',
  cpu_usage numeric(5,2) not null default 0,
  memory_usage numeric(5,2) not null default 0,
  disk_usage numeric(5,2) not null default 0,
  uptime_seconds bigint not null default 0,
  uptime_label text,
  server_ip text,
  operating_system text,
  updated_at timestamptz not null default now(),
  raw_payload jsonb not null default '{}'::jsonb
);

create table if not exists public.vps_service_status (
  id uuid primary key default gen_random_uuid(),
  service_name text not null unique,
  status text not null default 'unknown',
  uptime_label text,
  details jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vps_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  log_level text not null default 'info',
  summary text not null,
  message text not null,
  occurred_at timestamptz not null default now(),
  is_critical boolean not null default false,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.vps_hosted_applications (
  id uuid primary key default gen_random_uuid(),
  app_name text not null unique,
  domain text,
  port text,
  project_path text,
  status text not null default 'unknown',
  last_updated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.vps_security_snapshots (
  id uuid primary key default gen_random_uuid(),
  firewall_active boolean not null default false,
  open_ports jsonb not null default '[]'::jsonb,
  recent_access_attempts jsonb not null default '[]'::jsonb,
  suspicious_ips jsonb not null default '[]'::jsonb,
  ssh_users jsonb not null default '[]'::jsonb,
  auth_status jsonb not null default '{}'::jsonb,
  alerts jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.vps_backups (
  id uuid primary key default gen_random_uuid(),
  backup_type text not null,
  status text not null default 'unknown',
  artifact_name text,
  size_bytes bigint,
  started_at timestamptz,
  finished_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.vps_database_status (
  id uuid primary key default gen_random_uuid(),
  engine text not null,
  database_name text,
  status text not null default 'unknown',
  size_mb numeric(12,2),
  connection_count integer,
  last_backup_at timestamptz,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.vps_domain_status (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  domain_type text not null default 'primary',
  ssl_status text not null default 'unknown',
  ssl_valid_until timestamptz,
  redirect_target text,
  reverse_proxy_active boolean not null default false,
  updated_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.vps_action_queue (
  id uuid primary key default gen_random_uuid(),
  action_type text not null,
  target_type text not null,
  target_name text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  result_message text,
  requested_by_user_id uuid references public.app_users(id) on delete set null,
  requested_by_name text,
  origin_ip text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.vps_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.app_users(id) on delete set null,
  actor_name text not null,
  actor_role text not null,
  action text not null,
  service_affected text,
  target_name text,
  origin_ip text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.get_vps_control_snapshot(p_access_token text)
returns jsonb
language plpgsql
security definer
volatile
as $$
declare
  actor_user public.app_users;
  summary_json jsonb;
  services_json jsonb;
  applications_json jsonb;
  security_json jsonb;
  backups_json jsonb;
  database_json jsonb;
  database_tables_json jsonb;
  domains_json jsonb;
  audit_json jsonb;
begin
  actor_user := public.require_ti_user(p_access_token);

  select to_jsonb(s)
  into summary_json
  from (
    select *
    from public.vps_snapshots
    order by updated_at desc
    limit 1
  ) s;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.service_name asc), '[]'::jsonb)
  into services_json
  from public.vps_service_status s;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.app_name asc), '[]'::jsonb)
  into applications_json
  from public.vps_hosted_applications a;

  select to_jsonb(s)
  into security_json
  from (
    select *
    from public.vps_security_snapshots
    order by updated_at desc
    limit 1
  ) s;

  select coalesce(jsonb_agg(to_jsonb(b) order by b.finished_at desc nulls last, b.started_at desc nulls last), '[]'::jsonb)
  into backups_json
  from (
    select *
    from public.vps_backups
    order by finished_at desc nulls last, started_at desc nulls last
    limit 12
  ) b;

  select to_jsonb(d)
  into database_json
  from (
    select *
    from public.vps_database_status
    order by updated_at desc
    limit 1
  ) d;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.schema_name asc, t.table_name asc), '[]'::jsonb)
  into database_tables_json
  from (
    select
      st.schemaname as schema_name,
      st.relname as table_name,
      coalesce(st.n_live_tup, 0) as live_rows_estimate,
      coalesce(st.n_dead_tup, 0) as dead_rows_estimate,
      pg_size_pretty(pg_total_relation_size(format('%I.%I', st.schemaname, st.relname)::regclass)) as total_size,
      st.last_vacuum,
      st.last_autovacuum,
      st.last_analyze,
      st.last_autoanalyze,
      case
        when coalesce(st.n_dead_tup, 0) > 50000 then 'critical'
        when coalesce(st.n_dead_tup, 0) > 10000 then 'warning'
        else 'healthy'
      end as health_status
    from pg_stat_user_tables st
    where st.schemaname = 'public'
    order by st.schemaname asc, st.relname asc
  ) t;

  database_json := coalesce(database_json, '{}'::jsonb) || jsonb_build_object(
    'tables', database_tables_json
  );

  select coalesce(jsonb_agg(to_jsonb(d) order by d.domain asc), '[]'::jsonb)
  into domains_json
  from public.vps_domain_status d;

  select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc), '[]'::jsonb)
  into audit_json
  from (
    select *
    from public.vps_audit_log
    order by created_at desc
    limit 25
  ) a;

  insert into public.vps_audit_log (
    actor_user_id,
    actor_name,
    actor_role,
    action,
    details
  )
  values (
    actor_user.id,
    actor_user.full_name,
    actor_user.role,
    'VPS_VIEW_SNAPSHOT',
    jsonb_build_object('source', 'rpc')
  );

  return jsonb_build_object(
    'summary', summary_json,
    'services', services_json,
    'applications', applications_json,
    'security', security_json,
    'backups', backups_json,
    'database', database_json,
    'domains', domains_json,
    'audit', audit_json
  );
end;
$$;

create or replace function public.get_vps_logs(
  p_access_token text,
  p_source text default 'all',
  p_level text default 'all',
  p_search text default null,
  p_date_from date default null,
  p_date_to date default null
)
returns jsonb
language plpgsql
security definer
volatile
as $$
declare
  actor_user public.app_users;
  logs_json jsonb;
begin
  actor_user := public.require_ti_user(p_access_token);

  select coalesce(jsonb_agg(to_jsonb(l) order by l.occurred_at desc), '[]'::jsonb)
  into logs_json
  from (
    select *
    from public.vps_logs
    where (coalesce(p_source, 'all') = 'all' or source = p_source)
      and (
        coalesce(p_level, 'all') = 'all'
        or (p_level = 'critical' and is_critical = true)
        or (p_level <> 'critical' and log_level = p_level)
      )
      and (
        coalesce(trim(p_search), '') = ''
        or summary ilike '%' || trim(p_search) || '%'
        or message ilike '%' || trim(p_search) || '%'
      )
      and (p_date_from is null or occurred_at >= p_date_from::timestamptz)
      and (p_date_to is null or occurred_at < (p_date_to::timestamptz + interval '1 day'))
    order by occurred_at desc
    limit 200
  ) l;

  insert into public.vps_audit_log (
    actor_user_id,
    actor_name,
    actor_role,
    action,
    details
  )
  values (
    actor_user.id,
    actor_user.full_name,
    actor_user.role,
    'VPS_VIEW_LOGS',
    jsonb_build_object(
      'source', p_source,
      'level', p_level,
      'search', p_search,
      'date_from', p_date_from,
      'date_to', p_date_to
    )
  );

  return logs_json;
end;
$$;

create or replace function public.get_vps_database_table_details(
  p_access_token text,
  p_table_name text
)
returns jsonb
language plpgsql
security definer
volatile
as $$
declare
  actor_user public.app_users;
  columns_json jsonb;
  indexes_json jsonb;
  table_json jsonb;
begin
  actor_user := public.require_ti_user(p_access_token);

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'column_name', cols.column_name,
      'data_type', cols.data_type,
      'is_nullable', cols.is_nullable = 'YES',
      'column_default', cols.column_default,
      'ordinal_position', cols.ordinal_position
    )
    order by cols.ordinal_position
  ), '[]'::jsonb)
  into columns_json
  from information_schema.columns cols
  where cols.table_schema = 'public'
    and cols.table_name = p_table_name;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'index_name', idx.indexname,
      'index_definition', idx.indexdef
    )
    order by idx.indexname
  ), '[]'::jsonb)
  into indexes_json
  from pg_indexes idx
  where idx.schemaname = 'public'
    and idx.tablename = p_table_name;

  select jsonb_build_object(
    'schema_name', 'public',
    'table_name', p_table_name,
    'total_size', pg_size_pretty(pg_total_relation_size(format('%I.%I', 'public', p_table_name)::regclass)),
    'columns', columns_json,
    'indexes', indexes_json
  )
  into table_json;

  insert into public.vps_audit_log (
    actor_user_id,
    actor_name,
    actor_role,
    action,
    target_name,
    details
  )
  values (
    actor_user.id,
    actor_user.full_name,
    actor_user.role,
    'VPS_DATABASE_TABLE_DETAILS',
    p_table_name,
    jsonb_build_object('source', 'rpc')
  );

  return table_json;
end;
$$;

create or replace function public.enqueue_vps_action(
  p_access_token text,
  p_action_type text,
  p_target_type text,
  p_target_name text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  queue_item public.vps_action_queue;
begin
  actor_user := public.require_ti_user(p_access_token);

  if coalesce(trim(p_action_type), '') = ''
     or coalesce(trim(p_target_type), '') = ''
     or coalesce(trim(p_target_name), '') = '' then
    raise exception 'Acao de VPS invalida.';
  end if;

  if p_action_type not in ('start', 'stop', 'restart', 'restart_application', 'generate_backup', 'restore_backup', 'restart_database', 'refresh_snapshot') then
    raise exception 'Acao de VPS invalida.';
  end if;

  insert into public.vps_action_queue (
    action_type,
    target_type,
    target_name,
    payload,
    requested_by_user_id,
    requested_by_name
  )
  values (
    trim(p_action_type),
    trim(p_target_type),
    trim(p_target_name),
    coalesce(p_payload, '{}'::jsonb),
    actor_user.id,
    actor_user.full_name
  )
  returning * into queue_item;

  insert into public.vps_audit_log (
    actor_user_id,
    actor_name,
    actor_role,
    action,
    service_affected,
    target_name,
    details
  )
  values (
    actor_user.id,
    actor_user.full_name,
    actor_user.role,
    'VPS_' || upper(trim(p_action_type)),
    trim(p_target_type),
    trim(p_target_name),
    coalesce(p_payload, '{}'::jsonb)
  );

  return to_jsonb(queue_item);
end;
$$;

create or replace function public.delete_permission_role(
  p_access_token text,
  p_role_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  role_in_use boolean;
begin
  actor_user := public.require_permissions_admin(p_access_token);

  perform 1
  from public.permission_roles
  where id = p_role_id;

  if not found then
    raise exception 'Papel nao encontrado';
  end if;

  select exists(select 1 from public.app_users where permission_role_id = p_role_id) into role_in_use;
  if role_in_use then
    raise exception 'Nao e possivel excluir um papel vinculado a funcionarios.';
  end if;

  delete from public.permission_roles where id = p_role_id;
end;
$$;

create or replace function public.create_staff_user(
  p_access_token text,
  p_login_code text,
  p_full_name text,
  p_email text,
  p_password text,
  p_department text,
  p_role text,
  p_permission_role_id uuid,
  p_is_active boolean
)
returns uuid
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  normalized_role text;
  created_user_id uuid;
begin
  actor_user := public.require_permissions_admin(p_access_token);
  normalized_role := public.normalize_staff_role(p_role);

  if p_login_code !~ '^[0-9]{3}$' then
    raise exception 'Codigo de acesso deve conter exatamente 3 numeros';
  end if;

  if normalized_role not in ('TI', 'ADMINISTRADOR', 'USINAGEM', 'MONTAGEM', 'FABRICACAO', 'VENDEDOR', 'COMPRAS', 'FINANCEIRO') then
    raise exception 'Tipo de usuario invalido';
  end if;

  if coalesce(trim(p_full_name), '') = '' then
    raise exception 'Nome completo e obrigatorio';
  end if;

  if coalesce(length(p_password), 0) < 6 then
    raise exception 'Senha deve conter ao menos 6 caracteres';
  end if;

  if not public.is_permissions_admin_role(normalized_role)
     and public.permission_role_grants_permissions_module(p_permission_role_id) then
    raise exception 'Apenas funcionarios TI ou ADMINISTRADOR podem receber acesso ao modulo Permissoes.' using errcode = '42501';
  end if;

  if not public.is_ti_role(normalized_role)
     and public.permission_role_grants_vps_module(p_permission_role_id) then
    raise exception 'Somente funcionarios TI podem receber acesso ao modulo Controle da VPS.' using errcode = '42501';
  end if;

  insert into public.app_users (
    login_code,
    full_name,
    phone,
    email,
    password_hash,
    department,
    role,
    permission_role_id,
    is_active
  )
  values (
    p_login_code,
    trim(p_full_name),
    coalesce(nullif(trim(coalesce(p_email, '')), ''), '-'),
    nullif(trim(coalesce(p_email, '')), ''),
    crypt(p_password, gen_salt('bf')),
    normalized_role,
    normalized_role,
    p_permission_role_id,
    coalesce(p_is_active, true)
  )
  returning id into created_user_id;

  return created_user_id;
end;
$$;

create or replace function public.update_staff_user(
  p_access_token text,
  p_user_id uuid,
  p_login_code text,
  p_full_name text,
  p_email text,
  p_password text,
  p_department text,
  p_role text,
  p_permission_role_id uuid,
  p_is_active boolean
)
returns void
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  target_user public.app_users;
  normalized_role text;
  next_password_hash text;
  password_changed boolean := false;
begin
  actor_user := public.require_permissions_admin(p_access_token);
  normalized_role := public.normalize_staff_role(p_role);

  select * into target_user
  from public.app_users
  where id = p_user_id;

  if not found then
    raise exception 'Funcionario nao encontrado';
  end if;

  if actor_user.id = target_user.id
     and (
       normalized_role <> target_user.role
       or coalesce(p_permission_role_id, target_user.permission_role_id) <> target_user.permission_role_id
       or coalesce(p_is_active, target_user.is_active) <> target_user.is_active
     ) then
    raise exception 'Nao e permitido alterar o proprio nivel de acesso por este modulo.' using errcode = '42501';
  end if;

  if normalized_role not in ('TI', 'ADMINISTRADOR', 'USINAGEM', 'MONTAGEM', 'FABRICACAO', 'VENDEDOR', 'COMPRAS', 'FINANCEIRO') then
    raise exception 'Tipo de usuario invalido';
  end if;

  if not public.is_permissions_admin_role(normalized_role)
     and public.permission_role_grants_permissions_module(p_permission_role_id) then
    raise exception 'Apenas funcionarios TI ou ADMINISTRADOR podem receber acesso ao modulo Permissoes.' using errcode = '42501';
  end if;

  if not public.is_ti_role(normalized_role)
     and public.permission_role_grants_vps_module(p_permission_role_id) then
    raise exception 'Somente funcionarios TI podem receber acesso ao modulo Controle da VPS.' using errcode = '42501';
  end if;

  if coalesce(trim(coalesce(p_password, '')), '') = '' then
    next_password_hash := target_user.password_hash;
  else
    if length(p_password) < 6 then
      raise exception 'Senha deve conter ao menos 6 caracteres';
    end if;
    next_password_hash := crypt(p_password, gen_salt('bf'));
    password_changed := true;
  end if;

  update public.app_users
  set
    login_code = p_login_code,
    full_name = trim(p_full_name),
    phone = coalesce(nullif(trim(coalesce(p_email, '')), ''), '-'),
    email = nullif(trim(coalesce(p_email, '')), ''),
    department = normalized_role,
    role = normalized_role,
    permission_role_id = p_permission_role_id,
    is_active = coalesce(p_is_active, true),
    password_hash = next_password_hash,
    failed_login_attempts = case when password_changed then 0 else failed_login_attempts end,
    locked_until = case when password_changed then null else locked_until end,
    last_failed_login_at = case when password_changed then null else last_failed_login_at end,
    session_nonce = case when password_changed then gen_random_uuid() else session_nonce end
  where id = p_user_id;
end;
$$;

create or replace function public.reset_staff_user_password(
  p_access_token text,
  p_user_id uuid,
  p_password text
)
returns void
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  target_user public.app_users;
begin
  actor_user := public.require_ti_user(p_access_token);

  select *
  into target_user
  from public.app_users
  where id = p_user_id;

  if not found then
    raise exception 'Funcionario nao encontrado';
  end if;

  if coalesce(trim(coalesce(p_password, '')), '') = '' then
    raise exception 'Senha e obrigatoria';
  end if;

  if length(p_password) < 6 then
    raise exception 'Senha deve conter ao menos 6 caracteres';
  end if;

  update public.app_users
  set
    password_hash = crypt(p_password, gen_salt('bf')),
    failed_login_attempts = 0,
    locked_until = null,
    last_failed_login_at = null,
    session_nonce = gen_random_uuid()
  where id = p_user_id;
end;
$$;

create or replace function public.deactivate_staff_user(
  p_access_token text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
begin
  actor_user := public.require_permissions_admin(p_access_token);

  if actor_user.id = p_user_id then
    raise exception 'Nao e permitido desativar o proprio usuario.';
  end if;

  update public.app_users
  set is_active = false
  where id = p_user_id;
end;
$$;

create or replace function public.delete_inactive_staff_user(
  p_access_token text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  actor_user public.app_users;
  target_user public.app_users;
begin
  actor_user := public.require_permissions_admin(p_access_token);

  select * into target_user
  from public.app_users
  where id = p_user_id;

  if not found then
    raise exception 'Funcionario nao encontrado';
  end if;

  if actor_user.id = p_user_id then
    raise exception 'Nao e permitido excluir o proprio usuario.';
  end if;

  if target_user.is_active then
    raise exception 'Somente funcionarios inativos podem ser excluidos.';
  end if;

  delete from public.app_users
  where id = p_user_id;
end;
$$;

alter table public.permission_roles enable row level security;
alter table public.permission_role_permissions enable row level security;
alter table public.app_private_settings enable row level security;
alter table public.vps_snapshots enable row level security;
alter table public.vps_service_status enable row level security;
alter table public.vps_logs enable row level security;
alter table public.vps_hosted_applications enable row level security;
alter table public.vps_security_snapshots enable row level security;
alter table public.vps_backups enable row level security;
alter table public.vps_database_status enable row level security;
alter table public.vps_domain_status enable row level security;
alter table public.vps_action_queue enable row level security;
alter table public.vps_audit_log enable row level security;

drop policy if exists "Allow app read users" on public.app_users;
drop policy if exists "Allow app update users" on public.app_users;
drop policy if exists "Allow app read permissions" on public.module_permissions;
drop policy if exists "Allow app write permissions" on public.module_permissions;
drop policy if exists "Deny direct users access" on public.app_users;
drop policy if exists "Deny direct permissions access" on public.module_permissions;
drop policy if exists "Deny direct permission roles access" on public.permission_roles;
drop policy if exists "Deny direct permission role permissions access" on public.permission_role_permissions;
drop policy if exists "Deny direct app private settings access" on public.app_private_settings;
drop policy if exists "Deny direct vps snapshots access" on public.vps_snapshots;
drop policy if exists "Deny direct vps services access" on public.vps_service_status;
drop policy if exists "Deny direct vps logs access" on public.vps_logs;
drop policy if exists "Deny direct vps applications access" on public.vps_hosted_applications;
drop policy if exists "Deny direct vps security access" on public.vps_security_snapshots;
drop policy if exists "Deny direct vps backups access" on public.vps_backups;
drop policy if exists "Deny direct vps database access" on public.vps_database_status;
drop policy if exists "Deny direct vps domain access" on public.vps_domain_status;
drop policy if exists "Deny direct vps action queue access" on public.vps_action_queue;
drop policy if exists "Deny direct vps audit access" on public.vps_audit_log;

create policy "Deny direct users access" on public.app_users
for all using (false) with check (false);

create policy "Deny direct permissions access" on public.module_permissions
for all using (false) with check (false);

create policy "Deny direct permission roles access" on public.permission_roles
for all using (false) with check (false);

create policy "Deny direct permission role permissions access" on public.permission_role_permissions
for all using (false) with check (false);

create policy "Deny direct app private settings access" on public.app_private_settings
for all using (false) with check (false);

create policy "Deny direct vps snapshots access" on public.vps_snapshots
for all using (false) with check (false);

create policy "Deny direct vps services access" on public.vps_service_status
for all using (false) with check (false);

create policy "Deny direct vps logs access" on public.vps_logs
for all using (false) with check (false);

create policy "Deny direct vps applications access" on public.vps_hosted_applications
for all using (false) with check (false);

create policy "Deny direct vps security access" on public.vps_security_snapshots
for all using (false) with check (false);

create policy "Deny direct vps backups access" on public.vps_backups
for all using (false) with check (false);

create policy "Deny direct vps database access" on public.vps_database_status
for all using (false) with check (false);

create policy "Deny direct vps domain access" on public.vps_domain_status
for all using (false) with check (false);

create policy "Deny direct vps action queue access" on public.vps_action_queue
for all using (false) with check (false);

create policy "Deny direct vps audit access" on public.vps_audit_log
for all using (false) with check (false);
