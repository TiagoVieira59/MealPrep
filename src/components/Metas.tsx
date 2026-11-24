"use client";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Answers } from "@/lib/answers";
import { band, computeTargets, OBJ_ADJUST } from "@/lib/engine";
import { Disclaimer } from "@/components/ui";

export function targetsOf(a: Answers) {
  if (!a.sex || !a.age || !a.heightCm || !a.weightKg || !a.activity || !a.objective) return null;
  return computeTargets({ sex: a.sex, age: a.age, heightCm: a.heightCm, weightKg: a.weightKg, activity: a.activity, objective: a.objective });
}
const f1 = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");
const pctTxt = (x: number) => (x === 0 ? "0 %" : `${x > 0 ? "+" : "−"}${Math.abs(Math.round(x * 100))} %`);

/** Ecrã de metas com a conta linha a linha. `compact` = usado em Tu (sem botão de gerar). */
export function Metas({ a, set, onBack, compact }: { a: Answers; set: (p: Partial<Answers>) => void; onBack?: () => void; compact?: boolean }) {
  const router = useRouter(), t = targetsOf(a);
  if (!t) return <p>Faltam respostas para calcular as metas. <button className="underline" onClick={onBack}>Voltar</button></p>;
  const kcal = a.kcal ?? t.kcal, protein = a.protein ?? t.protein, b = band(kcal);
  const edited = a.kcal != null && a.kcal !== t.kcal || a.protein != null && a.protein !== t.protein;
  const row = (n: number, title: string, calc: string, res: string) => (
    <li className="flex gap-3 py-3"><span className="num grid h-7 w-7 shrink-0 place-items-center rounded-full bg-tint text-sm font-semibold">{n}</span>
      <div className="min-w-0 flex-1"><p className="font-medium">{title}</p><p className="num text-sm text-ink2 break-words">{calc}</p></div><p className="num whitespace-nowrap font-semibold">{res}</p></li>
  );
  return (
    <div className="flex flex-1 flex-col">
      {!compact && <button className="btn btn-ghost mb-4 w-fit !min-h-11 gap-2 text-sm" onClick={onBack}><ArrowLeft size={16} />Alterar respostas</button>}
      <h1 className="text-[28px] leading-tight">As tuas metas diárias</h1>
      <p className="mt-2 text-ink2">Todas as contas à vista. Podes editar os valores à mão.</p>
      <ol className="card mt-5 divide-y divide-line px-4">
        {row(1, "Metabolismo basal (Mifflin–St Jeor)", `10 × ${f1(a.weightKg!)} kg + 6,25 × ${a.heightCm} cm − 5 × ${a.age} anos ${a.sex === "m" ? "+ 5" : "− 161"}`, `${t.tmb} kcal`)}
        {row(2, "Gasto energético total", `${t.tmb} × ${String(a.activity).replace(".", ",")} (atividade)`, `${t.get} kcal`)}
        {row(3, `Ajuste do objetivo (${pctTxt(OBJ_ADJUST[a.objective!])})`, `${t.get} × ${f1(1 + OBJ_ADJUST[a.objective!])}`, `${t.kcal} kcal`)}
        {row(4, "Proteína", `2,2 g × ${f1(t.refWeight)} kg (peso com IMC 25 para ${a.heightCm} cm) = ${t.proteinRaw} g${t.proteinCapped ? `; máximo de 35 % das kcal = ${t.proteinCap} g` : ""}`, `${t.protein} g`)}
      </ol>
      <div className="card mt-4 space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">Calorias (kcal)<input className="field num mt-1 text-lg" inputMode="numeric" value={kcal} onChange={(e) => set({ kcal: Math.max(0, Math.round(+e.target.value.replace(/\D/g, "")) || 0) })} /></label>
          <label className="block text-sm font-medium">Proteína mínima (g)<input className="field num mt-1 text-lg" inputMode="numeric" value={protein} onChange={(e) => set({ protein: Math.max(0, Math.round(+e.target.value.replace(/\D/g, "")) || 0) })} /></label>
        </div>
        <p className="num text-sm text-ink2">Banda de calorias (meta ± 5 %): <b className="text-ink">{b.low}–{b.high} kcal</b>. Cada dia tem de ter pelo menos {protein} g de proteína.</p>
        {(kcal < 1200 || protein < 40) && <p className="text-sm text-warn" role="alert">Valores muito baixos: fala com um profissional de saúde antes de seguir um plano assim.</p>}
        {edited && <button className="text-sm underline" onClick={() => set({ kcal: undefined, protein: undefined })}>Repor o cálculo</button>}
      </div>
      <div className="mt-5"><Disclaimer /></div>
      {!compact && <div className="sticky bottom-0 mt-6 bg-bg/90 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] backdrop-blur">
        <button className="btn btn-primary w-full" disabled={kcal < 800 || protein < 20} onClick={() => { set({ kcal, protein, done: false }); router.push("/gerar"); }}>Gerar a minha semana</button></div>}
    </div>
  );
}
