-- =============================================================
-- Esquema para la app de gestion de entrenador personal (FitManager)
-- Tablas prefijadas con fitmanager_ porque este proyecto de Supabase
-- es compartido con otras apps.
-- Ejecutar completo en: Supabase Dashboard > SQL Editor > New query
-- =============================================================

-- Planes/membresias que ofrece el entrenador
create table if not exists fitmanager_plans (
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
create table if not exists fitmanager_clients (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  full_name text not null,
  phone text,
  email text,
  birth_date date,
  start_date date not null default current_date,
  plan_id uuid references fitmanager_plans(id) on delete set null,
  status text not null default 'active' check (status in ('active','paused','inactive')),
  notes text,
  created_at timestamptz not null default now()
);

-- Pagos registrados
create table if not exists fitmanager_payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null references fitmanager_clients(id) on delete cascade,
  plan_id uuid references fitmanager_plans(id) on delete set null,
  amount numeric(10,2) not null,
  payment_date date not null default current_date,
  period_start date not null,
  period_end date not null,
  method text not null default 'cash' check (method in ('cash','transfer','card','other')),
  notes text,
  created_at timestamptz not null default now()
);

-- Asistencias / check-ins
create table if not exists fitmanager_attendance (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null references fitmanager_clients(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  notes text
);

create index if not exists idx_fitmanager_clients_trainer on fitmanager_clients(trainer_id);
create index if not exists idx_fitmanager_payments_trainer on fitmanager_payments(trainer_id);
create index if not exists idx_fitmanager_payments_client on fitmanager_payments(client_id);
create index if not exists idx_fitmanager_attendance_trainer on fitmanager_attendance(trainer_id);
create index if not exists idx_fitmanager_attendance_client on fitmanager_attendance(client_id);
create index if not exists idx_fitmanager_plans_trainer on fitmanager_plans(trainer_id);

-- =============================================================
-- Row Level Security: cada entrenador solo ve sus propios datos
-- =============================================================
alter table fitmanager_plans enable row level security;
alter table fitmanager_clients enable row level security;
alter table fitmanager_payments enable row level security;
alter table fitmanager_attendance enable row level security;

create policy "fitmanager_plans_owner_all" on fitmanager_plans
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_clients_owner_all" on fitmanager_clients
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_payments_owner_all" on fitmanager_payments
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_attendance_owner_all" on fitmanager_attendance
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
