import { AttendanceRecord, Client, Payment, Plan } from "./types";
import { addDaysISO, todayISO } from "./format";

const STORAGE_KEY = "gym-trainer-demo-db";

interface DemoDb {
  plans: Plan[];
  clients: Client[];
  payments: Payment[];
  attendance: AttendanceRecord[];
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

  return { plans: [planBasico, planPremium], clients, payments, attendance };
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
    return JSON.parse(raw) as DemoDb;
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
