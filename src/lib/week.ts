import type { Plan } from "@/lib/engine";

export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function mondayOf(d = new Date()) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return iso(x); }
export const dateOf = (weekStart: string, i: number) => { const [y, m, d] = weekStart.split("-").map(Number); return new Date(y, m - 1, d + i); };
export const fmtDay = (dt: Date, o: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) => dt.toLocaleDateString("pt-PT", o);
/** Índice do dia de hoje no plano; -1 se a semana já passou, 0 se ainda não começou. */
export function todayIndex(plan: Plan): number {
  const [y, m, d] = plan.weekStart.split("-").map(Number);
  const diff = Math.round((new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() - new Date(y, m - 1, d).getTime()) / 86400000);
  return diff < 0 ? 0 : diff > 6 ? -1 : diff;
}
export const logKey = (weekStart: string, day: number, slot: string) => `${weekStart}|${day}|${slot}`;
