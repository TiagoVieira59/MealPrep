"use client";
import { useCallback, useEffect, useMemo } from "react";
import type { Plan } from "@/lib/engine";
import { K, useLocal } from "@/lib/store";
import { ensureSession, supabase } from "@/lib/supabase/client";
import type { HouseholdLocal } from "@/lib/sync";

/** Itens marcados: no dispositivo; no agregado sincronizam no Supabase (leitura periódica + escrita imediata). */
export function useTicks(plan: Plan | null) {
  const [all, setAll] = useLocal<Record<string, string[]>>(K.ticks, {});
  const [hh] = useLocal<HouseholdLocal | null>(K.household, null);
  const wk = plan?.weekStart ?? "", hid = hh?.id;
  useEffect(() => {
    if (!hid || !wk) return;
    const pull = async () => {
      try { const { data } = await supabase().from("household_ticks").select("item_key,checked").eq("household_id", hid).eq("week_start", wk);
        if (data) setAll((a) => ({ ...a, [wk]: data.filter((r: { checked: boolean }) => r.checked).map((r: { item_key: string }) => r.item_key) })); } catch { /* offline */ }
    };
    const t0 = setTimeout(pull, 0), t = setInterval(pull, 8000);
    return () => { clearTimeout(t0); clearInterval(t); };
  }, [hid, wk, setAll]);
  const ticked = useMemo(() => new Set(all[wk] ?? []), [all, wk]);
  const toggle = useCallback((food: string) => {
    const on = !(all[wk] ?? []).includes(food);
    setAll((a) => { const cur = new Set(a[wk] ?? []); if (on) cur.add(food); else cur.delete(food); return { ...a, [wk]: [...cur] }; });
    if (hid) ensureSession().then((u) => supabase().from("household_ticks").upsert({ household_id: hid, week_start: wk, item_key: food, checked: on, by_user: u.id })).catch(() => {});
  }, [all, wk, hid, setAll]);
  return { ticked, toggle };
}
