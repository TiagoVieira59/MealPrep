"use client";
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; val: unknown }>();
const emit = () => listeners.forEach((l) => l());
function read<T>(key: string, def: T): T {
  if (typeof window === "undefined") return def;
  const raw = localStorage.getItem(key), c = cache.get(key);
  if (c && c.raw === raw) return c.val as T;
  let val: unknown = def;
  if (raw != null) { try { val = JSON.parse(raw); } catch { /* valor corrompido: usa o padrão */ } }
  cache.set(key, { raw, val });
  return val as T;
}
export function writeLocal<T>(key: string, v: T) { localStorage.setItem(key, JSON.stringify(v)); emit(); }
export function readLocal<T>(key: string, def: T): T { return read(key, def); }
export function removeLocal(key: string) { localStorage.removeItem(key); emit(); }
if (typeof window !== "undefined") window.addEventListener("storage", emit);

/** Estado em localStorage (as medidas corporais nunca saem do dispositivo). */
export function useLocal<T>(key: string, def: T): [T, (v: T | ((p: T) => T)) => void] {
  const val = useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, () => read(key, def), () => def);
  const set = useCallback((v: T | ((p: T) => T)) => writeLocal(key, typeof v === "function" ? (v as (p: T) => T)(read(key, def)) : v), [key, def]);
  return [val, set];
}
export const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export const K = { answers: "mp.answers", plan: "mp.plan", next: "mp.next", log: "mp.log", ticks: "mp.ticks", household: "mp.household", me: "mp.me", planRow: "mp.planRow" } as const;
