"use client";
import { CalendarDays, Soup } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { band, dayTotal, mealTotal, SLOTS } from "@/lib/engine";
import { usePlan } from "@/lib/usePlan";
import { dateOf, fmtDay, logKey, todayIndex } from "@/lib/week";
import { DayStatus, MealCard, MealSheets, type Ctx, type SheetState } from "@/components/MealParts";
import { Bar, Footer } from "@/components/ui";

export function Skeleton() { return <div className="space-y-4" aria-busy="true"><div className="h-9 w-40 rounded-xl bg-tint" /><div className="h-28 rounded-3xl bg-tint" /><div className="h-28 rounded-3xl bg-tint" /></div>; }

export function DayView({ index }: { index?: number }) {
  const p = usePlan(), [sheet, setSheet] = useState<SheetState>(null);
  if (!p.ready) return <Skeleton />;
  const ctx = p as unknown as Ctx, { plan, me, log } = ctx;
  const ti = todayIndex(plan), idx = index ?? (ti === -1 ? 0 : ti), day = plan.days[idx], person = plan.people.find((x) => x.id === me)!;
  if (index == null && ti === -1) return (
    <div><h1 className="text-3xl">Semana terminada</h1><p className="mt-2 text-ink2">A semana de {fmtDay(dateOf(plan.weekStart, 0), { day: "numeric", month: "long" })} já passou.</p>
      <Link href="/semana" className="btn btn-primary mt-5">Gerar a próxima semana</Link></div>);
  const t = dayTotal(day, me), check = day.checks[me], b = band(person.kcal);
  const eaten = day.meals.reduce((a, m) => (log[logKey(plan.weekStart, idx, m.slot)] === "comida" ? { k: a.k + mealTotal(m, me).kcal, p: a.p + mealTotal(m, me).protein } : a), { k: 0, p: 0 });
  const notStarted = index == null && new Date() < dateOf(plan.weekStart, 0);
  return (
    <div className="md:grid md:grid-cols-[1fr_340px] md:gap-8">
      <div>
        <p className="text-sm font-medium text-ink2">{fmtDay(dateOf(plan.weekStart, idx))}</p>
        <h1 className="mt-0.5 text-[34px] leading-none">{index == null ? "Hoje" : fmtDay(dateOf(plan.weekStart, idx), { weekday: "long" })}</h1>
        {notStarted && <p className="mt-2 rounded-xl bg-tint p-3 text-sm">A tua semana começa em {fmtDay(dateOf(plan.weekStart, 0))}. Estas são as refeições do primeiro dia.</p>}
        <div className="mt-3"><DayStatus check={check} big /></div>
        <ul className="mt-5 space-y-3">{SLOTS.map((s) => day.meals.find((m) => m.slot === s)).filter(Boolean).map((m) => <MealCard key={m!.slot} ctx={ctx} day={idx} meal={m!} onSheet={setSheet} />)}
          {!day.meals.length && <li className="card flex items-center gap-3 p-4 text-ink2"><Soup />Sem refeições compatíveis com as tuas regras neste dia.</li>}</ul>
      </div>
      <aside className="mt-6 space-y-5 md:mt-0">
        <section className="card space-y-4 p-4" aria-label="Metas do dia">
          <Bar label="Calorias" unit="kcal" color="var(--kcal)" value={eaten.k} planned={t.kcal} target={person.kcal} lo={b.low} hi={b.high} />
          <Bar label="Proteína" unit="g" color="var(--protein)" value={eaten.p} planned={t.protein} target={person.protein} />
          <p className="num text-xs text-ink2">Barra cheia = o que já comeste. Barra clara = o planeado ({check.kcal} kcal, {String(check.protein).replace(".", ",")} g). Faixa = banda {b.low}–{b.high} kcal.</p>
        </section>
        <Link href="/semana" className="btn btn-ghost w-full gap-2"><CalendarDays size={18} />Ver a semana</Link>
      </aside>
      <MealSheets ctx={ctx} sheet={sheet} onClose={() => setSheet(null)} />
      <div className="md:col-span-2"><Footer /></div>
    </div>
  );
}
