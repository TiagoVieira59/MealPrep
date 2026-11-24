"use client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Beef, Bean, CookingPot, Drumstick, Egg, Fish, Milk, Salad, Sandwich, Shell, Soup, CupSoda, Wheat, UtensilsCrossed, X, type LucideIcon } from "lucide-react";
import { useEffect } from "react";

export const EASE = [0.22, 1, 0.36, 1] as const;
export const DISCLAIMER = "A MealPrep é uma ferramenta de planeamento, não aconselhamento médico.";
export const Disclaimer = () => <p className="text-sm text-ink2">{DISCLAIMER}</p>;
export const Estimativa = ({ text = "estimativa" }: { text?: string }) => <span className="tag-est">{text}</span>;

const CATS: Record<string, [number, LucideIcon]> = {
  ovos: [42, Egg], tosta: [28, Sandwich], iogurte: [330, Milk], aveia: [38, Wheat], batido: [350, CupSoda], sopa: [20, Soup], peixe: [200, Fish],
  carne: [8, Beef], ave: [34, Drumstick], massa: [15, UtensilsCrossed], arroz: [48, CookingPot], leguminosas: [100, Bean], salada: [140, Salad], marisco: [190, Shell], wrap: [60, Sandwich],
};
/** Ilustração por categoria: disco de cor própria + ícone, sempre no mesmo estilo (sem imagens de IA). */
export function Dish({ cat, size = 56 }: { cat: string; size?: number }) {
  const [h, Icon] = CATS[cat] ?? [120, UtensilsCrossed];
  return (
    <span aria-hidden className="dish relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full" style={{ width: size, height: size, ["--h" as string]: h }}>
      <svg className="absolute inset-0" viewBox="0 0 56 56"><circle cx="46" cy="10" r="10" fill="currentColor" opacity=".10" /><circle cx="8" cy="50" r="12" fill="currentColor" opacity=".08" /></svg>
      <Icon size={size * 0.46} strokeWidth={1.6} className="relative" />
    </span>
  );
}

/** Barra que enche; marca a banda de kcal se lo/hi forem dados. */
export function Bar({ value, target, lo, hi, color, label, unit, planned }: { value: number; target: number; lo?: number; hi?: number; color: string; label: string; unit: string; planned?: number }) {
  const reduce = useReducedMotion();
  const max = Math.max(target * 1.15, value, planned ?? 0, 1);
  const pct = (x: number) => `${Math.min(100, (x / max) * 100)}%`;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm"><span className="font-medium">{label}</span><span className="num text-ink2"><b className="text-ink">{Math.round(value)}</b> / {Math.round(target)} {unit}</span></div>
      <div className="relative h-3 overflow-hidden rounded-full bg-tint" role="progressbar" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={Math.round(target)}>
        {planned != null && <div className="absolute inset-y-0 left-0 rounded-full opacity-45" style={{ width: pct(planned), background: color }} />}
        {lo != null && hi != null && <div className="absolute inset-y-0 border-x-2 border-ink/40 bg-ink/10" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />}
        <motion.div className="absolute inset-y-0 left-0 origin-left rounded-full" style={{ background: color, width: pct(value) }}
          initial={reduce ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease: EASE }} />
      </div>
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
          <motion.div className="absolute inset-0 bg-black/40" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.div role="dialog" aria-modal="true" aria-label={title}
            className="relative z-10 flex max-h-[88dvh] w-full max-w-xl flex-col rounded-t-[28px] bg-surface pb-[env(safe-area-inset-bottom)] md:rounded-[28px]"
            initial={reduce ? { opacity: 0 } : { y: "100%" }} animate={reduce ? { opacity: 1 } : { y: 0 }} exit={reduce ? { opacity: 0 } : { y: "100%" }} transition={{ duration: 0.32, ease: EASE }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-2"><h2 className="text-xl">{title}</h2>
              <button className="btn" aria-label="Fechar" onClick={onClose}><X size={22} /></button></div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export const Footer = () => (
  <footer className="mt-10 space-y-1 text-xs text-ink2">
    <p>Dados nutricionais: USDA FoodData Central (SR Legacy), domínio público (CC0).</p>
    <p>A MealPrep é uma ferramenta de planeamento, não aconselhamento médico.</p>
    <p><a className="inline-block px-2 py-3 underline" href="/privacidade">Privacidade</a><a className="inline-block px-2 py-3 underline" href="/termos">Termos</a></p>
  </footer>
);
