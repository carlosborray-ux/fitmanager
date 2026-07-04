export type ClientStatus = "active" | "paused" | "inactive";
export type PaymentMethod = "cash" | "transfer" | "card" | "other";

export interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  sessions_per_period: number;
  description: string | null;
  created_at: string;
}

export interface Client {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  birth_date: string | null;
  start_date: string;
  plan_id: string | null;
  status: ClientStatus;
  notes: string | null;
  created_at: string;
  plan?: Plan | null;
}

export interface Payment {
  id: string;
  client_id: string;
  plan_id: string | null;
  amount: number;
  payment_date: string;
  period_start: string;
  period_end: string;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
  client?: Client | null;
}

export interface AttendanceRecord {
  id: string;
  client_id: string;
  checked_in_at: string;
  notes: string | null;
  client?: Client | null;
}

export interface ClassSession {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  created_at: string;
  clients: Client[];
}

export interface DashboardSummary {
  totalClients: number;
  activeClients: number;
  attendanceToday: number;
  paymentsThisMonth: number;
  revenueThisMonth: number;
  overdueClients: Client[];
  clientsWithOneSessionLeft: Client[];
  clientsWithTwoSessionsLeft: Client[];
}
