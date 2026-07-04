import { isSupabaseConfigured, supabase } from "./supabase/client";
import { demoDb } from "./demo-data";
import type { ClassSessionRaw } from "./demo-data";
import {
  AttendanceRecord,
  Client,
  ClassSession,
  DashboardSummary,
  Payment,
  Plan,
} from "./types";
import { todayISO } from "./format";

export const usingDemoData = !isSupabaseConfigured;
export const MAX_PLANS = 50;

// Tablas prefijadas porque este proyecto de Supabase es compartido con otras apps.
const TABLES = {
  plans: "fitmanager_plans",
  clients: "fitmanager_clients",
  payments: "fitmanager_payments",
  attendance: "fitmanager_attendance",
  classSessions: "fitmanager_class_sessions",
  sessionAttendees: "fitmanager_session_attendees",
} as const;

function sortByCreatedDesc<T extends { created_at: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// ---------- Plans ----------

export async function listPlans(): Promise<Plan[]> {
  if (usingDemoData) {
    return sortByCreatedDesc(demoDb.get().plans);
  }
  const { data, error } = await supabase!
    .from(TABLES.plans)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Plan[];
}

export async function savePlan(plan: Partial<Plan> & { name: string }): Promise<Plan> {
  if (usingDemoData) {
    const db = demoDb.get();
    if (plan.id) {
      db.plans = db.plans.map((p) => (p.id === plan.id ? { ...p, ...plan } as Plan : p));
    } else {
      if (db.plans.length >= MAX_PLANS) {
        throw new Error(`Ya tienes el maximo de ${MAX_PLANS} planes.`);
      }
      const created: Plan = {
        id: demoDb.newId(),
        name: plan.name,
        price: plan.price ?? 0,
        duration_days: plan.duration_days ?? 30,
        sessions_per_period: plan.sessions_per_period ?? 12,
        description: plan.description ?? null,
        created_at: new Date().toISOString(),
      };
      db.plans.push(created);
    }
    demoDb.set(db);
    return db.plans.find((p) => p.name === plan.name)!;
  }
  const { data, error } = await supabase!
    .from(TABLES.plans)
    .upsert(plan)
    .select()
    .single();
  if (error) throw error;
  return data as Plan;
}

export async function deletePlan(id: string): Promise<void> {
  if (usingDemoData) {
    const db = demoDb.get();
    db.plans = db.plans.filter((p) => p.id !== id);
    demoDb.set(db);
    return;
  }
  const { error } = await supabase!.from(TABLES.plans).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Clients ----------

function attachPlan(client: Client, plans: Plan[]): Client {
  return { ...client, plan: plans.find((p) => p.id === client.plan_id) ?? null };
}

export async function listClients(): Promise<Client[]> {
  if (usingDemoData) {
    const db = demoDb.get();
    return sortByCreatedDesc(db.clients).map((c) => attachPlan(c, db.plans));
  }
  const { data, error } = await supabase!
    .from(TABLES.clients)
    .select("*, plan:fitmanager_plans(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data as Client[];
}

export async function saveClient(
  client: Partial<Client> & { full_name: string }
): Promise<Client> {
  if (usingDemoData) {
    const db = demoDb.get();
    if (client.id) {
      db.clients = db.clients.map((c) =>
        c.id === client.id ? ({ ...c, ...client } as Client) : c
      );
    } else {
      const created: Client = {
        id: demoDb.newId(),
        full_name: client.full_name,
        phone: client.phone ?? null,
        email: client.email ?? null,
        birth_date: client.birth_date ?? null,
        start_date: client.start_date ?? todayISO(),
        plan_id: client.plan_id ?? null,
        status: client.status ?? "active",
        notes: client.notes ?? null,
        created_at: new Date().toISOString(),
      };
      db.clients.push(created);
    }
    demoDb.set(db);
    const saved = db.clients.find((c) =>
      client.id ? c.id === client.id : c.full_name === client.full_name
    )!;
    return attachPlan(saved, db.plans);
  }
  const { data, error } = await supabase!
    .from(TABLES.clients)
    .upsert(client)
    .select("*, plan:fitmanager_plans(*)")
    .single();
  if (error) throw error;
  return data as Client;
}

export async function deleteClient(id: string): Promise<void> {
  if (usingDemoData) {
    const db = demoDb.get();
    db.clients = db.clients.filter((c) => c.id !== id);
    db.payments = db.payments.filter((p) => p.client_id !== id);
    db.attendance = db.attendance.filter((a) => a.client_id !== id);
    demoDb.set(db);
    return;
  }
  const { error } = await supabase!.from(TABLES.clients).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Payments ----------

function attachClient<T extends { client_id: string }>(
  row: T,
  clients: Client[],
  plans: Plan[]
): T & { client: Client | null } {
  const client = clients.find((c) => c.id === row.client_id);
  return { ...row, client: client ? attachPlan(client, plans) : null };
}

export async function listPayments(): Promise<Payment[]> {
  if (usingDemoData) {
    const db = demoDb.get();
    return sortByCreatedDesc(db.payments).map((p) =>
      attachClient(p, db.clients, db.plans)
    );
  }
  const { data, error } = await supabase!
    .from(TABLES.payments)
    .select("*, client:fitmanager_clients(*)")
    .order("payment_date", { ascending: false });
  if (error) throw error;
  return data as Payment[];
}

export async function createPayment(
  payment: Omit<Payment, "id" | "created_at" | "client">
): Promise<Payment> {
  if (usingDemoData) {
    const db = demoDb.get();
    const created: Payment = {
      ...payment,
      id: demoDb.newId(),
      created_at: new Date().toISOString(),
    };
    db.payments.push(created);
    demoDb.set(db);
    return attachClient(created, db.clients, db.plans);
  }
  const { data, error } = await supabase!
    .from(TABLES.payments)
    .insert(payment)
    .select("*, client:fitmanager_clients(*)")
    .single();
  if (error) throw error;
  return data as Payment;
}

export async function deletePayment(id: string): Promise<void> {
  if (usingDemoData) {
    const db = demoDb.get();
    db.payments = db.payments.filter((p) => p.id !== id);
    demoDb.set(db);
    return;
  }
  const { error } = await supabase!.from(TABLES.payments).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Attendance ----------

export async function listAttendance(): Promise<AttendanceRecord[]> {
  if (usingDemoData) {
    const db = demoDb.get();
    return [...db.attendance]
      .sort((a, b) => (a.checked_in_at < b.checked_in_at ? 1 : -1))
      .map((a) => attachClient(a, db.clients, db.plans));
  }
  const { data, error } = await supabase!
    .from(TABLES.attendance)
    .select("*, client:fitmanager_clients(*)")
    .order("checked_in_at", { ascending: false });
  if (error) throw error;
  return data as AttendanceRecord[];
}

export async function checkInClient(
  clientId: string,
  dateISO: string,
  notes?: string
): Promise<AttendanceRecord> {
  const checkedInAt = dateISO === todayISO() ? new Date().toISOString() : `${dateISO}T12:00:00.000Z`;
  if (usingDemoData) {
    const db = demoDb.get();
    const created: AttendanceRecord = {
      id: demoDb.newId(),
      client_id: clientId,
      checked_in_at: checkedInAt,
      notes: notes ?? null,
    };
    db.attendance.push(created);
    demoDb.set(db);
    return attachClient(created, db.clients, db.plans);
  }
  const { data, error } = await supabase!
    .from(TABLES.attendance)
    .insert({ client_id: clientId, checked_in_at: checkedInAt, notes: notes ?? null })
    .select("*, client:fitmanager_clients(*)")
    .single();
  if (error) throw error;
  return data as AttendanceRecord;
}

export async function deleteAttendance(id: string): Promise<void> {
  if (usingDemoData) {
    const db = demoDb.get();
    db.attendance = db.attendance.filter((a) => a.id !== id);
    demoDb.set(db);
    return;
  }
  const { error } = await supabase!.from(TABLES.attendance).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Class Sessions (calendario) ----------

function resolveSession(session: ClassSessionRaw, clients: Client[]): ClassSession {
  return {
    id: session.id,
    date: session.date,
    start_time: session.start_time,
    end_time: session.end_time,
    title: session.title,
    created_at: session.created_at,
    clients: session.client_ids
      .map((id) => clients.find((c) => c.id === id))
      .filter((c): c is Client => Boolean(c)),
  };
}

export async function listClassSessions(): Promise<ClassSession[]> {
  if (usingDemoData) {
    const db = demoDb.get();
    return [...db.classSessions]
      .sort((a, b) => (a.date + a.start_time < b.date + b.start_time ? -1 : 1))
      .map((s) => resolveSession(s, db.clients));
  }
  const { data, error } = await supabase!
    .from(TABLES.classSessions)
    .select(`*, attendees:${TABLES.sessionAttendees}(client:${TABLES.clients}(*))`)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data as Array<Record<string, unknown>>).map((row) => ({
    id: row.id as string,
    date: row.date as string,
    start_time: (row.start_time as string).slice(0, 5),
    end_time: (row.end_time as string).slice(0, 5),
    title: row.title as string | null,
    created_at: row.created_at as string,
    clients: (row.attendees as Array<{ client: Client }>).map((a) => a.client),
  }));
}

export async function saveClassSession(session: {
  id?: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  client_ids: string[];
}): Promise<ClassSession> {
  if (usingDemoData) {
    const db = demoDb.get();
    if (session.id) {
      db.classSessions = db.classSessions.map((s) =>
        s.id === session.id
          ? {
              ...s,
              date: session.date,
              start_time: session.start_time,
              end_time: session.end_time,
              title: session.title,
              client_ids: session.client_ids,
            }
          : s
      );
    } else {
      db.classSessions.push({
        id: demoDb.newId(),
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        title: session.title,
        client_ids: session.client_ids,
        created_at: new Date().toISOString(),
      });
    }
    demoDb.set(db);
    const saved = db.classSessions.find((s) =>
      session.id ? s.id === session.id : s.date === session.date && s.start_time === session.start_time
    )!;
    return resolveSession(saved, db.clients);
  }

  let sessionId = session.id;
  if (sessionId) {
    const { error } = await supabase!
      .from(TABLES.classSessions)
      .update({
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        title: session.title,
      })
      .eq("id", sessionId);
    if (error) throw error;
    const { error: deleteError } = await supabase!
      .from(TABLES.sessionAttendees)
      .delete()
      .eq("session_id", sessionId);
    if (deleteError) throw deleteError;
  } else {
    const { data, error } = await supabase!
      .from(TABLES.classSessions)
      .insert({
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        title: session.title,
      })
      .select()
      .single();
    if (error) throw error;
    sessionId = (data as { id: string }).id;
  }

  if (session.client_ids.length > 0) {
    const { error: insertError } = await supabase!
      .from(TABLES.sessionAttendees)
      .insert(session.client_ids.map((clientId) => ({ session_id: sessionId, client_id: clientId })));
    if (insertError) throw insertError;
  }

  const { data, error } = await supabase!
    .from(TABLES.classSessions)
    .select(`*, attendees:${TABLES.sessionAttendees}(client:${TABLES.clients}(*))`)
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    date: row.date as string,
    start_time: (row.start_time as string).slice(0, 5),
    end_time: (row.end_time as string).slice(0, 5),
    title: row.title as string | null,
    created_at: row.created_at as string,
    clients: (row.attendees as Array<{ client: Client }>).map((a) => a.client),
  };
}

export async function deleteClassSession(id: string): Promise<void> {
  if (usingDemoData) {
    const db = demoDb.get();
    db.classSessions = db.classSessions.filter((s) => s.id !== id);
    demoDb.set(db);
    return;
  }
  const { error } = await supabase!.from(TABLES.classSessions).delete().eq("id", id);
  if (error) throw error;
}

// ---------- Shared period/plan helpers ----------

export function findPeriodForDate(
  payments: Payment[],
  clientId: string,
  referenceDate: string
): Payment | null {
  const clientPayments = payments.filter((p) => p.client_id === clientId);
  return (
    clientPayments.find((p) => p.period_start <= referenceDate && referenceDate <= p.period_end) ?? null
  );
}

export function findLatestPeriod(payments: Payment[], clientId: string): Payment | null {
  const clientPayments = payments.filter((p) => p.client_id === clientId);
  if (clientPayments.length === 0) return null;
  return clientPayments.reduce((a, b) => (a.period_end > b.period_end ? a : b));
}

export function sessionsUsedInPeriod(
  attendance: AttendanceRecord[],
  clientId: string,
  period: Payment
): number {
  return attendance.filter(
    (a) =>
      a.client_id === clientId &&
      a.checked_in_at.slice(0, 10) >= period.period_start &&
      a.checked_in_at.slice(0, 10) <= period.period_end
  ).length;
}

export function planForPeriod(
  period: Payment,
  plans: Plan[],
  fallback?: Plan | null
): Plan | null {
  return plans.find((p) => p.id === period.plan_id) ?? fallback ?? null;
}

// ---------- Dashboard ----------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const [clients, payments, attendance, plans] = await Promise.all([
    listClients(),
    listPayments(),
    listAttendance(),
    listPlans(),
  ]);

  const today = todayISO();
  const monthKey = today.slice(0, 7);

  const paymentsThisMonth = payments.filter((p) =>
    p.payment_date.startsWith(monthKey)
  );
  const revenueThisMonth = paymentsThisMonth.reduce((sum, p) => sum + p.amount, 0);

  const attendanceToday = attendance.filter((a) =>
    a.checked_in_at.startsWith(today)
  ).length;

  const activeClients = clients.filter((c) => c.status === "active");

  const overdueClients = activeClients.filter((client) => {
    const latest = findLatestPeriod(payments, client.id);
    if (!latest) return true;
    return latest.period_end < today;
  });

  const clientsWithOneSessionLeft: Client[] = [];
  const clientsWithTwoSessionsLeft: Client[] = [];

  for (const client of activeClients) {
    const period = findPeriodForDate(payments, client.id, today);
    if (!period) continue;
    const plan = planForPeriod(period, plans, client.plan);
    if (!plan) continue;
    const used = sessionsUsedInPeriod(attendance, client.id, period);
    const remaining = plan.sessions_per_period - used;
    if (remaining === 1) clientsWithOneSessionLeft.push(client);
    else if (remaining === 2) clientsWithTwoSessionsLeft.push(client);
  }

  return {
    totalClients: clients.length,
    activeClients: activeClients.length,
    attendanceToday,
    paymentsThisMonth: paymentsThisMonth.length,
    revenueThisMonth,
    overdueClients,
    clientsWithOneSessionLeft,
    clientsWithTwoSessionsLeft,
  };
}
