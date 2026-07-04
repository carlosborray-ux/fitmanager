-- =============================================================
-- Esquema para la app de gestion de entrenador personal
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- Planes/membresias que ofrece el entrenador
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  name text not null,
  price numeric(10,2) not null default 0,
  duration_days integer not null default 30,
  sessions_per_period integer not null default 12,
  description text,
  created_at timestamptz not null default now()
);

-- Clientes del entrenador
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  start_date date not null default current_date,
  plan_id uuid references plans(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','inactive')),
  notes text,
  created_at timestamptz not null default now()
);

-- Pagos registrados
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null references clients(id) on delete cascade,
  plan_id uuid references plans(id) on delete set null,
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  period_start date not null,
  period_end date not null,
  method text not null default 'cash' check (method in ('cash','transfer','card','other')),
  notes text,
  created_at timestamptz not null default now()
);

-- Asistencias / check-ins
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null references clients(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_clients_trainer on clients(trainer_id);
create index if not exists idx_payments_trainer on payments(trainer_id);
create index if not exists idx_payments_client on payments(client_id);
create index if not exists idx_attendance_trainer on attendance(trainer_id);
create index if not exists idx_attendance_client on attendance(client_id);
create index if not exists idx_plans_trainer on plans(trainer_id);

-- =============================================================
-- Row Level Security: cada entrenador solo ve sus propios datos
-- =============================================================
alter table plans enable row level security;
alter table clients enable row level security;
alter table payments enable row level security;
alter table attendance enable row level security;

create policy "plans_owner_all" on plans
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "clients_owner_all" on clients
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "payments_owner_all" on payments
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "attendance_owner_all" on attendance
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
