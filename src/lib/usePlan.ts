"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { DEFAULT_ANSWERS, toPrefs, type Answers } from "@/lib/answers";
import type { Plan, Prefs } from "@/lib/engine";
import { K, useHydrated, useLocal } from "@/lib/store";
import { mondayOf } from "@/lib/week";
import { savePlan } from "@/lib/sync";

export type Log = Record<string, "comida" | "saltada">;
export function usePlan() {
  const hydrated = useHydrated(), router = useRouter();
  const [plan, setPlanLocal] = useLocal<Plan | null>(K.plan, null);
  const setPlan = useCallback((p: Plan | null | ((x: Plan | null) => Plan | null)) => setPlanLocal((x) => { const n = typeof p === "function" ? p(x) : p; if (n) savePlan(n); return n; }), [setPlanLocal]);
  const [next, setNext] = useLocal<Plan | null>(K.next, null);
  const [answers, setAnswers] = useLocal<Answers>(K.answers, DEFAULT_ANSWERS);
  const [log, setLog] = useLocal<Log>(K.log, {});
  const [me] = useLocal<string>(K.me, "me");
  useEffect(() => { if (hydrated && next && next.weekStart <= mondayOf()) { setPlan(next); setNext(null); } }, [hydrated, next, setPlan, setNext]);
  useEffect(() => { if (hydrated && (!plan || !answers.done)) router.replace("/bem-vindo"); }, [hydrated, plan, answers.done, router]);
  const prefs: Prefs | null = useMemo(() => (plan ? { ...toPrefs(answers), people: plan.people, budget: plan.budget, store: plan.store } : null), [answers, plan]);
  const meId = plan?.people.some((p) => p.id === me) ? me : "me";
  return { ready: hydrated && !!plan && !!prefs && answers.done, plan, prefs, setPlan, next, setNext, answers, setAnswers, log, setLog, me: meId };
}
