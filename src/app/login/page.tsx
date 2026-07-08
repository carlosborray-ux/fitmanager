"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, LogIn } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="card w-full max-w-sm rounded-2xl p-6">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-950/50">
            <Dumbbell size={22} strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-lg font-bold text-zinc-50">FitManager</p>
            <p className="text-xs text-zinc-400">By Gabriel</p>
          </div>
        </div>

        {!isSupabaseConfigured ? (
          <p className="rounded-lg bg-amber-500/10 p-3 text-center text-sm text-amber-300">
            Estas en modo demo (sin Supabase conectado), no necesitas iniciar sesion.
            Vuelve al <a href="/" className="font-medium underline">resumen</a>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-300">Correo</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-300">Contraseña</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary mt-2 justify-center">
              <LogIn size={16} /> {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
