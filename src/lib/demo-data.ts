import { AttendanceRecord, Client, Payment, Plan, TrainingLog } from "./types";
import { addDaysISO, todayISO } from "./format";

const STORAGE_KEY = "gym-trainer-demo-db";

export interface ClassSessionRaw {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  title: string | null;
  created_at: string;
  client_ids: string[];
  guest_names: string[];
}

interface DemoDb {
  plans: Plan[];
  clients: Client[];
  payments: Payment[];
  attendance: AttendanceRecord[];
  classSessions: ClassSessionRaw[];
  trainingLogs: TrainingLog[];
}

function uid(): string {
  return crypto.randomUUID();
}

function seed(): DemoDb {
  const planBasico: Plan = {
    id: uid(),
    name: "Plan Basico (8 sesiones/mes)",
    price: 180000,
    duration_days: 30,
    sessions_per_period: 8,
    description: "2 sesiones por semana",
    created_at: new Date().toISOString(),
  };
  const planPremium: Plan = {
    id: uid(),
    name: "Plan Premium (12 sesiones/mes)",
    price: 260000,
    duration_days: 30,
    sessions_per_period: 12,
    description: "3 sesiones por semana + seguimiento nutricional",
    created_at: new Date().toISOString(),
  };

  const today = todayISO();

  const clients: Client[] = [
    {
      id: uid(),
      full_name: "Maria Fernanda Gomez",
      phone: "3001234567",
      email: "mafe.gomez@example.com",
      birth_date: "1994-03-12",
      start_date: addDaysISO(today, -70),
      plan_id: planPremium.id,
      status: "active",
      notes: "Objetivo: fuerza",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      full_name: "Carlos Andres Ruiz",
      phone: "3109876543",
      email: "caruiz@example.com",
      birth_date: "1988-07-22",
      start_date: addDaysISO(today, -40),
      plan_id: planBasico.id,
      status: "active",
      notes: "",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      full_name: "Laura Camila Ortiz",
      phone: "3201122334",
      email: "laura.ortiz@example.com",
      birth_date: "1999-11-05",
      start_date: addDaysISO(today, -10),
      plan_id: planBasico.id,
      status: "active",
      notes: "Recien empieza, cuidar rodilla derecha",
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      full_name: "Juan Pablo Sanchez",
      phone: "3157765544",
      email: null,
      birth_date: null,
      start_date: addDaysISO(today, -120),
      plan_id: planPremium.id,
      status: "paused",
      notes: "En pausa por viaje",
      created_at: new Date().toISOString(),
    },
  ];

  const payments: Payment[] = [
    {
      id: uid(),
      client_id: clients[0].id,
      plan_id: planPremium.id,
      amount: planPremium.price,
      payment_date: addDaysISO(today, -5),
      period_start: addDaysISO(today, -5),
      period_end: addDaysISO(today, 25),
      method: "transfer",
      notes: null,
      created_at: new Date().toISOString(),
      group_id: uid(),
      installment_number: 1,
      installment_count: 1,
    },
    {
      id: uid(),
      client_id: clients[1].id,
      plan_id: planBasico.id,
      amount: planBasico.price,
      payment_date: addDaysISO(today, -38),
      period_start: addDaysISO(today, -38),
      period_end: addDaysISO(today, -8),
      method: "cash",
      notes: null,
      created_at: new Date().toISOString(),
      group_id: uid(),
      installment_number: 1,
      installment_count: 1,
    },
    {
      id: uid(),
      client_id: clients[2].id,
      plan_id: planBasico.id,
      amount: planBasico.price,
      payment_date: addDaysISO(today, -10),
      period_start: addDaysISO(today, -10),
      period_end: addDaysISO(today, 20),
      method: "card",
      notes: null,
      created_at: new Date().toISOString(),
      group_id: uid(),
      installment_number: 1,
      installment_count: 1,
    },
  ];

  const attendance: AttendanceRecord[] = [
    {
      id: uid(),
      client_id: clients[0].id,
      checked_in_at: new Date().toISOString(),
      notes: null,
    },
    {
      id: uid(),
      client_id: clients[1].id,
      checked_in_at: addDaysISO(today, 0) + "T09:15:00.000Z",
      notes: null,
    },
    {
      id: uid(),
      client_id: clients[2].id,
      checked_in_at: addDaysISO(today, -1) + "T14:00:00.000Z",
      notes: "Buena sesion de piernas",
    },
  ];

  const classSessions: ClassSessionRaw[] = [
    {
      id: uid(),
      date: addDaysISO(today, 1),
      start_time: "07:00",
      end_time: "08:00",
      title: "Clase grupal de fuerza",
      created_at: new Date().toISOString(),
      client_ids: [clients[0].id, clients[1].id],
      guest_names: [],
    },
    {
      id: uid(),
      date: addDaysISO(today, 2),
      start_time: "18:00",
      end_time: "19:00",
      title: null,
      created_at: new Date().toISOString(),
      client_ids: [clients[2].id],
      guest_names: [],
    },
  ];

  const trainingLogs: TrainingLog[] = [
    {
      id: uid(),
      client_id: clients[0].id,
      date: addDaysISO(today, -7),
      exercise: "Sentadilla",
      detail: "50kg x 8 reps x 3 series",
      notes: null,
      created_at: new Date().toISOString(),
    },
    {
      id: uid(),
      client_id: clients[0].id,
      date: today,
      exercise: "Sentadilla",
      detail: "60kg x 8 reps x 3 series",
      notes: "Buena tecnica, subir progresivamente",
      created_at: new Date().toISOString(),
    },
  ];

  return { plans: [planBasico, planPremium], clients, payments, attendance, classSessions, trainingLogs };
}

function load(): DemoDb {
  if (typeof window === "undefined") {
    return seed();
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const fresh = seed();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    const parsed = JSON.parse(raw) as DemoDb;
    if (!parsed.classSessions) parsed.classSessions = [];
    parsed.classSessions.forEach((s) => {
      if (!s.guest_names) s.guest_names = [];
    });
    if (!parsed.trainingLogs) parsed.trainingLogs = [];
    return parsed;
  } catch {
    const fresh = seed();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }
}

function save(db: DemoDb) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export const demoDb = {
  get: load,
  set: save,
  resetSeed(): DemoDb {
    const fresh = seed();
    save(fresh);
    return fresh;
  },
  newId: uid,
};
