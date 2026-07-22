# FitManager — Gestion de entrenador personal

App web (funciona en PC y celular) para que un entrenador personal controle su negocio:

- **Clientes**: datos de contacto, plan asignado, estado (activo/pausado/inactivo), notas rapidas acumulables
- **Planes**: membresias que ofreces (precio, duracion en dias, sesiones incluidas)
- **Pagos**: registro de pagos por cliente, con pago completo o en hasta 3 cuotas, cada cuota con su fecha y estado (pagada/pendiente)
- **Asistencia**: check-in diario con barra de progreso de sesiones del plan, y celebracion (confeti) al marcar
- **Calendario**: vista de mes con puntos indicando dias con clases, y abajo el detalle del dia por horas; permite clases recurrentes (ej. lunes/miercoles/viernes) y cortesias sin necesidad de tener el cliente creado
- **Ingresos**: historial de todos los pagos, navegable mes a mes, con total
- **Notas**: todos los clientes en una lista, con las clases de su plan y un registro de notas rapidas (cada nota queda como una linea con fecha, se van acumulando)
- **Resumen**: dashboard con estadisticas, avisos de pagos vencidos y clientes por renovar

Construida con **Next.js 16 + TypeScript + Tailwind CSS v4**, lista para conectarse a **Supabase** (base de datos + autenticacion) y desplegarse en **Vercel**.

## Estado actual

La app corre en **modo demo** apenas la abras: si no hay credenciales de Supabase configuradas, todos los datos se guardan en el `localStorage` del navegador (solo en ese computador/celular, se pierden si borras datos del navegador). Esto permite probar toda la funcionalidad sin necesidad de una cuenta de Supabase.

En cuanto agregues las credenciales reales (ver pasos abajo), la app usa Supabase automaticamente — **no hay que cambiar nada de codigo**.

## Pasos para poner esto en produccion

### 1. Crear tu propio proyecto en Supabase

Usa **tu propio proyecto de Supabase**, separado del de cualquier otra persona/app — así tus datos (clientes, pagos) quedan completamente aislados.

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta / proyecto nuevo (el plan gratis alcanza de sobra).
2. Ve a **SQL Editor** → **New query**, pega el contenido completo de [`supabase/schema.sql`](supabase/schema.sql) y ejecutalo. Esto crea todas las tablas (planes, clientes, pagos, asistencia, clases, notas de progreso) con seguridad a nivel de fila (RLS) para que solo tu usuario vea tus datos.
3. Ve a **Authentication → Providers** y asegurate que **Email** este habilitado.
4. Ve a **Authentication → Users** y crea tu usuario (email + contraseña) con el que vas a iniciar sesion como entrenador.
5. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public key` (a veces aparece como `publishable key`)

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

Abre [http://localhost:3000](http://localhost:3000) e inicia sesion con el usuario que creaste en el paso 1.4.

### 4. Subir tu codigo a GitHub

1. Crea un repositorio nuevo en tu cuenta de GitHub.
2. Desde la carpeta del proyecto:
   ```bash
   git init
   git add -A
   git commit -m "Primer commit"
   git remote add origin <url-de-tu-repo>
   git push -u origin main
   ```

### 5. Desplegar en Vercel

1. En [vercel.com](https://vercel.com), crea una cuenta e importa tu repositorio de GitHub.
2. En **Environment Variables**, agrega las mismas dos variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
3. Deploy. Vercel te da una URL que funciona en PC y celular, y se actualiza sola cada vez que hagas `git push`.

## Estructura del proyecto

```
src/
  app/
    page.tsx              -> Dashboard / resumen
    clients/               -> Lista de clientes (cuadricula) y perfil individual
    payments/page.tsx      -> Registro de pagos, cuotas, marcar pagada/pendiente
    attendance/page.tsx    -> Check-in y progreso de sesiones
    calendar/page.tsx      -> Mes + agenda por horas, clases recurrentes y cortesias
    reports/page.tsx       -> Historial de ingresos mes a mes
    notes/page.tsx         -> Notas rapidas por cliente
    plans/page.tsx         -> CRUD de planes/membresias
    login/page.tsx         -> Inicio de sesion
  components/              -> Shell (menu), Modal, StatCard, Avatar, StatusBadge, etc.
  lib/
    types.ts               -> Tipos compartidos
    supabase/client.ts     -> Cliente de Supabase (null si no hay credenciales -> modo demo)
    demo-data.ts           -> Datos y almacenamiento de demo (localStorage)
    data-service.ts        -> Capa unica de acceso a datos (demo o Supabase segun configuracion)
    calendar-utils.ts      -> Helpers de fechas/semana/mes
supabase/schema.sql        -> Script SQL para crear todas las tablas en Supabase
```

## Comandos utiles

```bash
npm run dev     # servidor de desarrollo
npm run build   # build de produccion
npm run start   # correr el build de produccion
```
