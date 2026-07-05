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
  created_at timestamptz not null default now(),
  group_id uuid not null default gen_random_uuid(),
  installment_number integer not null default 1,
  installment_count integer not null default 1,
  paid boolean not null default true
);

-- Asistencias / check-ins
create table if not exists fitmanager_attendance (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null references fitmanager_clients(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  notes text
);

-- Clases agendadas en el calendario (una clase puede tener varios clientes, ej. clases grupales)
create table if not exists fitmanager_class_sessions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  date date not null,
  start_time time not null,
  end_time time not null,
  title text,
  created_at timestamptz not null default now(),
  series_id uuid
);

-- Relacion clase <-> asistentes (clientes reales o invitados de cortesia por nombre)
create table if not exists fitmanager_session_attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references fitmanager_class_sessions(id) on delete cascade,
  client_id uuid references fitmanager_clients(id) on delete cascade,
  guest_name text,
  trainer_id uuid not null default auth.uid()
);

-- Registro de progreso de entrenamiento (cargas, repeticiones, avances por cliente)
create table if not exists fitmanager_training_logs (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null default auth.uid(),
  client_id uuid not null references fitmanager_clients(id) on delete cascade,
  date date not null default current_date,
  exercise text not null,
  detail text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_fitmanager_clients_trainer on fitmanager_clients(trainer_id);
create index if not exists idx_fitmanager_payments_trainer on fitmanager_payments(trainer_id);
create index if not exists idx_fitmanager_payments_client on fitmanager_payments(client_id);
create index if not exists idx_fitmanager_attendance_trainer on fitmanager_attendance(trainer_id);
create index if not exists idx_fitmanager_attendance_client on fitmanager_attendance(client_id);
create index if not exists idx_fitmanager_plans_trainer on fitmanager_plans(trainer_id);
create index if not exists idx_fitmanager_class_sessions_trainer on fitmanager_class_sessions(trainer_id);
create index if not exists idx_fitmanager_class_sessions_date on fitmanager_class_sessions(date);
create index if not exists idx_fitmanager_session_attendees_trainer on fitmanager_session_attendees(trainer_id);
create index if not exists idx_fitmanager_session_attendees_session on fitmanager_session_attendees(session_id);
create index if not exists idx_fitmanager_session_attendees_client on fitmanager_session_attendees(client_id);
create index if not exists idx_fitmanager_training_logs_trainer on fitmanager_training_logs(trainer_id);
create index if not exists idx_fitmanager_training_logs_client on fitmanager_training_logs(client_id);

-- =============================================================
-- Row Level Security: cada entrenador solo ve sus propios datos
-- =============================================================
alter table fitmanager_plans enable row level security;
alter table fitmanager_clients enable row level security;
alter table fitmanager_payments enable row level security;
alter table fitmanager_attendance enable row level security;
alter table fitmanager_class_sessions enable row level security;
alter table fitmanager_session_attendees enable row level security;
alter table fitmanager_training_logs enable row level security;

create policy "fitmanager_plans_owner_all" on fitmanager_plans
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_clients_owner_all" on fitmanager_clients
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_payments_owner_all" on fitmanager_payments
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_attendance_owner_all" on fitmanager_attendance
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_class_sessions_owner_all" on fitmanager_class_sessions
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_session_attendees_owner_all" on fitmanager_session_attendees
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());

create policy "fitmanager_training_logs_owner_all" on fitmanager_training_logs
  for all using (trainer_id = auth.uid()) with check (trainer_id = auth.uid());
