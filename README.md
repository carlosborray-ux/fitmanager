# FitManager — Gestion de entrenador personal

App web (funciona en PC y celular) para que un entrenador personal controle:

- **Clientes**: datos de contacto, plan asignado, estado (activo/pausado/inactivo)
- **Planes**: membresias que ofreces (precio, duracion en dias)
- **Pagos**: registro de pagos por cliente, con periodo que cubren
- **Asistencia**: check-in diario y su historial

Construida con **Next.js 16 + TypeScript + Tailwind CSS**, lista para conectarse a **Supabase** (base de datos + autenticacion) y desplegarse en **Vercel**.

## Estado actual

Hoy la app corre en **modo demo**: si no hay credenciales de Supabase configuradas, todos los datos se guardan en el `localStorage` del navegador (solo en tu computador, se pierden si borras datos del navegador). Esto permite probar toda la funcionalidad sin necesidad de una cuenta de Supabase.

En cuanto agregues las credenciales reales (ver pasos abajo), la app usa Supabase automáticamente — **no hay que cambiar nada de código**.

## Pasos para poner esto en producción (para el entrenador / dueño del proyecto)

### 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta / proyecto nuevo.
2. Ve a **SQL Editor** → **New query**, pega el contenido completo de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto crea las tablas `clients`, `plans`, `payments`, `attendance` con seguridad a nivel de fila (RLS) para que cada usuario autenticado solo vea sus propios datos.
3. Ve a **Authentication → Providers** y asegúrate que **Email** esté habilitado.
4. Ve a **Authentication → Users** y crea tu usuario (email + contraseña) con el que vas a iniciar sesión como entrenador.
5. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key`

### 2. Configurar las variables de entorno

En la carpeta del proyecto, crea un archivo `.env.local` (puedes copiar `.env.example`) con:

```
NEXT_PUBLIC_SUPABASE_URL=tu-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Correr localmente

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 4. Desplegar en Vercel

1. Sube este repositorio a tu cuenta de GitHub (o el proveedor Git que prefieras).
2. En [vercel.com](https://vercel.com), importa el repositorio.
3. En **Environment Variables**, agrega las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. Vercel te da una URL que funciona en PC y celular.

## Nota sobre autenticación

Por ahora la app **no tiene pantalla de login**: apenas conectes Supabase, todas las escrituras a la base de datos requieren que exista una sesión (por RLS), así que necesitarás agregar una pantalla simple de login con `supabase.auth.signInWithPassword`. Es un componente sencillo (~40 líneas) que ya encaja con la estructura de `src/lib/supabase/client.ts` — pide ayuda si quieres agregarlo.

## Estructura del proyecto

```
src/
  app/
    page.tsx            -> Dashboard / resumen
    clients/page.tsx     -> CRUD de clientes
    payments/page.tsx    -> Registro y listado de pagos
    attendance/page.tsx  -> Check-in y historial de asistencia
    plans/page.tsx       -> CRUD de planes/membresias
  components/            -> Shell (navegacion), Modal, StatCard, StatusBadge
  lib/
    types.ts             -> Tipos compartidos
    supabase/client.ts   -> Cliente de Supabase (null si no hay credenciales)
    demo-data.ts         -> Datos y almacenamiento de demo (localStorage)
    data-service.ts      -> Capa unica de acceso a datos (demo o Supabase segun configuracion)
supabase/schema.sql       -> Script SQL para crear las tablas en Supabase
```

## Comandos utiles

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de produccion
npm run start   # correr el build de produccion
```
