"use client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ensureSession, supabase } from "@/lib/supabase/client";

export function useSession() {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false);
  useEffect(() => {
    ensureSession().then((u) => setUser(u)).catch(() => {}).finally(() => setReady(true));
    const { data } = supabase().auth.onAuthStateChange((_e: string, s: { user?: User | null } | null) => setUser(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user, ready, anonymous: !!user?.is_anonymous };
}
export async function api<T = unknown>(url: string, body?: unknown, method = "POST"): Promise<{ ok: boolean; status: number; data: T & { erro?: string } }> {
  try {
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => ({})) };
  } catch { return { ok: false, status: 0, data: { erro: "Sem ligação à internet." } as T & { erro?: string } }; }
}
