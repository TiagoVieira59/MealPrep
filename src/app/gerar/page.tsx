"use client";
import { motion, useReducedMotion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_ANSWERS, toPrefs, type Answers } from "@/lib/answers";
import { addDays, generatePlan, type Plan } from "@/lib/engine";
import { K, readLocal, writeLocal } from "@/lib/store";
import { mondayOf, todayIndex } from "@/lib/week";
import { EASE } from "@/components/ui";

const STAGES = ["A filtrar o catálogo pelas tuas regras", "A escolher os pratos da semana", "A ajustar as porções ao teu dia", "A verificar cada dia", "A preparar a lista de compras"];

export default function Gerar() {
  const router = useRouter(), reduce = useReducedMotion();
  const [stage, setStage] = useState(0), [err, setErr] = useState(false), started = useRef(false);
  useEffect(() => {
    if (started.current) return; started.current = true;
    const a = readLocal<Answers>(K.answers, DEFAULT_ANSWERS);
    if (!a.kcal) { router.replace("/bem-vindo"); return; }
    const prev = readLocal<Plan | null>(K.plan, null), hh0 = readLocal<{ id: string } | null>(K.household, null);
    const inForce = !hh0 && !!prev && todayIndex(prev) !== -1; // semana atual ainda em curso: as alterações aplicam-se à seguinte
    const prefs = toPrefs(a), weekStart = inForce ? addDays(prev!.weekStart, 7) : mondayOf(), seed = (prev?.seed ?? Math.floor(Math.random() * 1e6)) + 1;
    const hh = readLocal<{ id: string } | null>(K.household, null);
    let rowId: string | null = null;
    // Em agregado a semana é gerada para todos os membros; guarda-se também o perfil (só metas e preferências).
    const work = (async () => {
      try {
        if (hh) await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prefs, seed, weekStart, objective: a.objective }) }).catch(() => null);
        const r = await fetch(hh ? "/api/household/plan" : "/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(hh ? { seed, weekStart } : { prefs, seed, weekStart, objective: a.objective }) });
        if (!r.ok) throw new Error();
        const j = await r.json(); rowId = j.rowId ?? null; return j.plan as Plan;
      } catch { return generatePlan(prefs, seed, weekStart); } // sem rede: o mesmo motor corre no dispositivo
    })();
    const tick = (i: number) => new Promise<void>((res) => setTimeout(() => { setStage(i); res(); }, reduce ? 150 : 650));
    (async () => {
      try {
        for (let i = 1; i <= STAGES.length; i++) await tick(i);
        const plan = await work;
        writeLocal(inForce ? K.next : K.plan, plan); if (!inForce && rowId) writeLocal(K.planRow, rowId); writeLocal(K.answers, { ...a, done: true });
        setTimeout(() => router.replace(inForce ? "/semana" : "/"), reduce ? 100 : 500);
      } catch { setErr(true); }
    })();
  }, [router, reduce]);
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-md flex-col justify-center">
      <h1 className="text-[28px] leading-tight">A preparar a tua semana</h1>
      <p className="mt-2 text-ink2">Tudo calculado por aritmética sobre dados da USDA.</p>
      <ul className="mt-8 space-y-4" aria-live="polite">
        {STAGES.map((s, i) => {
          const done = stage > i, now = stage === i;
          return (
            <motion.li key={s} className="flex items-center gap-3" initial={{ opacity: 0.35 }} animate={{ opacity: done || now ? 1 : 0.35 }} transition={{ duration: 0.3, ease: EASE }}>
              <span className={`grid h-8 w-8 place-items-center rounded-full ${done ? "bg-primary text-on-primary" : "bg-tint"}`}>
                {done ? <motion.span initial={reduce ? false : { scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}><Check size={18} /></motion.span> : now ? <Loader2 size={18} className="animate-spin" /> : null}
              </span><span className={done ? "text-ink2" : "font-medium"}>{s}</span>
            </motion.li>
          );
        })}
      </ul>
      {err && <p role="alert" className="mt-6 text-err">Não foi possível gerar a semana. <button className="underline" onClick={() => location.reload()}>Tentar de novo</button></p>}
    </div>
  );
}
