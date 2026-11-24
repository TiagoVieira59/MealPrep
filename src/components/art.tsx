// Ilustrações próprias em SVG (sem imagens externas, sem custo, funcionam offline).
import type { Equipment, StoreId } from "@/lib/engine";

const S = { fill: "none", stroke: "#3a2f28", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const Box = ({ children, size, vb = 64 }: { children: React.ReactNode; size: number; vb?: number }) => (
  <svg aria-hidden width={size} height={size} viewBox={`0 0 ${vb} ${vb}`} className="shrink-0">{children}</svg>
);

/* ---------- equipamento ---------- */
const EQ: Record<Equipment, React.ReactNode> = {
  fogao: <><rect {...S} x="8" y="24" width="48" height="32" rx="5" fill="#e9e4de" /><rect {...S} x="14" y="32" width="36" height="18" rx="3" fill="#cfc7bf" />
    <path {...S} d="M18 8h28l-2 12H20z" fill="#d9644a" /><path {...S} d="M12 12h6M46 12h6" />
    {[17, 27, 37, 47].map((x) => <circle key={x} cx={x} cy="28" r="2" fill="#3a2f28" />)}</>,
  forno: <><rect {...S} x="8" y="10" width="48" height="46" rx="6" fill="#e9e4de" /><path {...S} d="M8 22h48" />
    {[16, 26, 36].map((x) => <circle key={x} cx={x} cy="16" r="2" fill="#3a2f28" />)}<circle cx="48" cy="16" r="2" fill="#e8a33d" stroke="#3a2f28" strokeWidth="1.5" />
    <rect {...S} x="14" y="28" width="36" height="22" rx="3" fill="#6b5b50" /><path d="M18 46c6-8 22-8 28 0" stroke="#f1a54a" strokeWidth="3" fill="none" strokeLinecap="round" /><path {...S} d="M18 24h28" /></>,
  microondas: <><rect {...S} x="6" y="16" width="52" height="32" rx="5" fill="#e9e4de" /><rect {...S} x="11" y="21" width="28" height="22" rx="3" fill="#7ea6b4" />
    <path d="M16 38c4-6 8 2 12-4s6 2 8-2" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" /><path {...S} d="M44 22v20" />
    {[26, 33, 40].map((y) => <circle key={y} cx="50" cy={y - 2} r="2" fill="#3a2f28" />)}<path {...S} d="M12 48v4M52 48v4" /></>,
  airfryer: <><path {...S} d="M14 14c0-4 4-7 18-7s18 3 18 7v30c0 6-5 12-18 12S14 50 14 44z" fill="#4c4743" /><path {...S} d="M14 22c4 3 32 3 36 0" />
    <circle cx="32" cy="14" r="3.5" fill="#e8a33d" stroke="#3a2f28" strokeWidth="1.5" /><rect {...S} x="22" y="30" width="20" height="9" rx="4.5" fill="#cfc7bf" /><path {...S} d="M50 32h6" /></>,
  robo: <><path {...S} d="M16 56h32l2-12H14z" fill="#d9644a" /><path d="M18 44l-3-26h34l-3 26z" fill="#dff0f4" stroke="#3a2f28" strokeWidth="2" strokeLinejoin="round" /><rect {...S} x="12" y="10" width="40" height="8" rx="4" fill="#cfc7bf" />
    <path d="M24 34h16M32 28v12M26 38l12-8" stroke="#8a8078" strokeWidth="2" strokeLinecap="round" /><circle cx="32" cy="50" r="2.5" fill="#fff" stroke="#3a2f28" strokeWidth="1.5" /></>,
  liquidificadora: <><path {...S} d="M20 8h24l-3 36H23z" fill="#cfeaf0" /><path d="M21.5 26l1.5 18h18l1.5-18c-6 3-15 3-21 0z" fill="#e0516a" opacity=".85" /><path {...S} d="M16 8h32" /><path {...S} d="M44 14c8 0 8 14 0 14" />
    <path {...S} d="M22 44h20l3 12H19z" fill="#4c4743" /><circle cx="32" cy="50" r="2" fill="#e8a33d" /></>,
};
export const EquipArt = ({ id, size = 64 }: { id: Equipment; size?: number }) => <Box size={size}>{EQ[id]}</Box>;

/* ---------- lojas: fachada genérica, cor do toldo sugere a insígnia (sem logótipos) ---------- */
const STORE_COLOR: Record<StoreId, [string, string]> = {
  continente: ["#d3382f", "#fff"], "pingo-doce": ["#2e9b4f", "#fff"], lidl: ["#1e5bb8", "#f4d03f"],
  mercadona: ["#2f8f46", "#fff"], aldi: ["#2a6fb3", "#f08a24"], intermarche: ["#d8362e", "#f4d03f"],
};
export function StoreArt({ id, size = 64 }: { id: StoreId; size?: number }) {
  const [a, b] = STORE_COLOR[id];
  return (
    <Box size={size}>
      <rect {...S} x="8" y="26" width="48" height="30" rx="2" fill="#f5efe6" />
      <path {...S} d="M6 14h52l4 14H2z" fill={a} />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M${6 + i * 10.4} 14h5.2l-1 14h-6.2z`} fill={i % 2 ? b : a} opacity={i % 2 ? 0.95 : 0} />)}
      <path {...S} d="M6 14h52l4 14H2z" fill="none" /><rect {...S} x="14" y="34" width="16" height="14" rx="2" fill="#bfe0ea" /><rect {...S} x="36" y="34" width="12" height="22" rx="2" fill="#8a6a4f" /><circle cx="44" cy="46" r="1.2" fill="#fff" />
      <path {...S} d="M30 4h4" />
    </Box>
  );
}

/* ---------- pratos por categoria (cobertura de 56 × 56 dentro do disco tingido) ---------- */
const P = { stroke: "#3a2f28", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const plate = <><ellipse {...P} cx="28" cy="31" rx="24" ry="20" fill="#fffaf2" /><ellipse cx="28" cy="31" rx="17" ry="13.5" fill="#f3ebdf" stroke="#d8cdbd" strokeWidth="1" /></>;
const ART: Record<string, React.ReactNode> = {
  ovos: <>{plate}<path {...P} d="M16 29c0-8 10-12 17-8 7 0 9 8 5 12-3 5-12 6-17 3-3-2-5-4-5-7z" fill="#fff" /><circle {...P} cx="28" cy="29" r="6" fill="#f4b73a" /><circle cx="26" cy="27" r="1.6" fill="#fff" opacity=".7" /></>,
  tosta: <>{plate}<path {...P} d="M14 40V25c0-6 5-9 14-9s14 3 14 9v15z" fill="#e0b273" /><path {...P} d="M18 38V27c0-4 4-6 10-6s10 2 10 6v11z" fill="#9cc05a" /><circle {...P} cx="28" cy="31" r="3.5" fill="#d9644a" /></>,
  iogurte: <>{plate}<path {...P} d="M12 28h32c0 10-6 16-16 16S12 38 12 28z" fill="#fff" /><ellipse {...P} cx="28" cy="28" rx="16" ry="4" fill="#f6efe2" />{[[22, 27], [29, 26], [34, 28]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.5" fill="#c43c58" stroke="#3a2f28" strokeWidth="1" />)}<circle cx="27" cy="29.5" r="1.5" fill="#6a4fa0" /></>,
  aveia: <>{plate}<path {...P} d="M12 28h32c0 10-6 16-16 16S12 38 12 28z" fill="#d9a766" /><ellipse {...P} cx="28" cy="28" rx="16" ry="4.5" fill="#efd7a8" />{[21, 28, 35].map((x) => <circle key={x} cx={x} cy="27" r="3" fill="#f7e27a" stroke="#3a2f28" strokeWidth="1" />)}</>,
  batido: <><path {...P} d="M17 12h22l-3 34a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="#fde9ef" /><path d="M18.5 26h19l-1.5 20a3 3 0 0 1-3 3h-10a3 3 0 0 1-3-3z" fill="#ec7a9a" /><path {...P} d="M17 12h22l-3 34a4 4 0 0 1-4 4h-8a4 4 0 0 1-4-4z" fill="none" /><path d="M32 6l-3 16" stroke="#3a2f28" strokeWidth="3" strokeLinecap="round" /><path d="M32 6l-3 16" stroke="#6bb5c4" strokeWidth="1.6" strokeLinecap="round" /></>,
  sopa: <>{plate}<path {...P} d="M10 27h36c0 12-7 18-18 18S10 39 10 27z" fill="#f0f0ea" /><ellipse {...P} cx="28" cy="27" rx="18" ry="5" fill="#e9893b" /><circle cx="22" cy="26" r="1.5" fill="#6aa04a" /><circle cx="32" cy="28" r="1.5" fill="#f4d46a" /><path d="M22 18c-2-3 2-4 0-8M30 18c-2-3 2-4 0-8M38 18c-2-3 2-4 0-8" stroke="#a99d92" strokeWidth="1.6" fill="none" strokeLinecap="round" /></>,
  peixe: <>{plate}<path {...P} d="M10 31c6-9 17-10 25-3l9-5v16l-9-5c-8 7-19 6-25-3z" fill="#8fb4c8" /><path {...P} d="M22 24c3 4 3 10 0 14" fill="none" /><circle cx="17" cy="29" r="1.4" fill="#3a2f28" /><path {...P} d="M38 42l7 4-3-7z" fill="#f2d24a" /></>,
  carne: <>{plate}<path {...P} d="M13 31c0-9 9-13 17-11 8 1 13 8 10 15-3 7-13 8-20 5-4-2-7-5-7-9z" fill="#a8523a" /><path d="M20 26l10 10M26 23l10 10M17 31l7 7" stroke="#5a2a1c" strokeWidth="1.6" strokeLinecap="round" /><circle cx="35" cy="27" r="2.2" fill="#e9eed2" opacity=".6" /></>,
  ave: <>{plate}<path {...P} d="M12 36c-3-9 4-18 15-17 10 1 15 9 11 16-3 5-8 6-12 4l-5 5-3-3 3-3c-4 0-8-1-9-2z" fill="#e0a04a" /><path d="M17 40l-4 4M20 43l-3 4" stroke="#fffaf2" strokeWidth="3.5" strokeLinecap="round" /><path {...P} d="M17 40l-4 4M20 43l-3 4" /><circle cx="26" cy="28" r="1.6" fill="#a76d2a" /><circle cx="33" cy="32" r="1.6" fill="#a76d2a" /></>,
  massa: <>{plate}<path {...P} d="M14 32c0-8 8-12 14-10 7-2 14 3 14 10 0 6-8 10-14 8-6 2-14-2-14-8z" fill="#f2d98a" /><path d="M18 30c5 4 10-3 14 1s6 0 8 1M20 35c5 2 9-2 14 0" stroke="#d6b45c" strokeWidth="1.6" fill="none" strokeLinecap="round" /><ellipse {...P} cx="28" cy="29" rx="7" ry="4.5" fill="#d8503a" /><path d="M26 27l2-3 3 3" stroke="#4a8a3c" strokeWidth="2" fill="none" strokeLinecap="round" /></>,
  arroz: <>{plate}<path {...P} d="M12 36c2-12 8-17 16-17s14 5 16 17c-4 6-28 6-32 0z" fill="#fff" />{[[22, 30], [28, 26], [34, 31], [26, 34], [31, 37], [19, 36]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="2.4" ry="1.2" fill="#efe6d4" transform={`rotate(${i * 40} ${x} ${y})`} />)}<circle cx="28" cy="22" r="2.4" fill="#5aa04a" stroke="#3a2f28" strokeWidth="1" /></>,
  leguminosas: <>{plate}<path {...P} d="M11 28h34c0 11-7 17-17 17S11 39 11 28z" fill="#c98f5a" /><ellipse {...P} cx="28" cy="28" rx="17" ry="5" fill="#8a4a2e" />{[[19, 28], [25, 26], [31, 29], [37, 27], [27, 31]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="3.2" ry="2" fill={i % 2 ? "#b86a3c" : "#e1b15a"} stroke="#3a2f28" strokeWidth="1" />)}</>,
  salada: <>{plate}<path {...P} d="M12 31c0-9 8-12 16-12s16 3 16 12c0 6-8 11-16 11s-16-5-16-11z" fill="#8cc152" /><path d="M18 30c4-7 9-7 12 0M28 24c5-3 10-1 11 6" stroke="#4e8a2e" strokeWidth="1.6" fill="none" strokeLinecap="round" /><circle {...P} cx="24" cy="33" r="4" fill="#e0443a" /><circle {...P} cx="35" cy="31" r="3" fill="#f4c542" /></>,
  marisco: <>{plate}<path {...P} d="M13 34c1-12 14-17 23-11 5 3 6 9 3 12-3-5-9-6-13-3-4 3-9 5-13 2z" fill="#f08a52" /><path d="M20 28c2 3 2 6 0 8M26 25c2 3 3 6 2 9M32 24c2 2 3 4 3 7" stroke="#b9532a" strokeWidth="1.4" fill="none" strokeLinecap="round" /><path {...P} d="M13 34c-3 1-5 4-4 7M36 23l6-4M38 25l5-1" fill="none" /><circle {...P} cx="40" cy="38" r="5" fill="#f5d845" /></>,
  wrap: <>{plate}<path {...P} d="M11 40l22-22 8 8-22 22z" fill="#ecd3a0" /><path d="M14 38l20-20" stroke="#ecd3a0" strokeWidth="1" /><path {...P} d="M33 18c4 0 8 4 8 8" fill="#9cc05a" /><path d="M35 20c3 0 5 2 5 5M31 22l7 7" stroke="#d8503a" strokeWidth="2.4" strokeLinecap="round" fill="none" /><path {...P} d="M18 40l4 4" /></>,
};
const FALLBACK = <>{plate}<path {...P} d="M19 38V20M25 38V20M31 22v16" fill="none" /><path {...P} d="M38 38V20c4 2 6 8 6 12h-6" fill="#d8cdbd" /></>;
export const DishArt = ({ cat, size }: { cat: string; size: number }) => <svg aria-hidden viewBox="0 0 56 56" width={size} height={size} className="relative">{ART[cat] ?? FALLBACK}</svg>;

/* ---------- faixa decorativa: mesa com ingredientes, para cabeçalhos ---------- */
export function Hero({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 320 110" className={`w-full ${className}`} preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="110" fill="var(--hero-bg, #fbe9d3)" />
      <circle cx="280" cy="18" r="46" fill="#f6c36a" opacity=".45" /><circle cx="22" cy="100" r="40" fill="#8cc152" opacity=".25" />
      <rect y="84" width="320" height="26" fill="#d9b58a" opacity=".6" />
      <g transform="translate(24 36) scale(1.05)"><circle cx="30" cy="30" r="28" fill="#fffaf2" stroke="#3a2f28" strokeWidth="1.6" /><circle cx="30" cy="30" r="20" fill="#f3ebdf" /><circle cx="24" cy="28" r="7" fill="#e0443a" stroke="#3a2f28" strokeWidth="1.4" /><path d="M32 22c6-2 12 2 10 8s-8 9-12 6" fill="#8cc152" stroke="#3a2f28" strokeWidth="1.4" /><circle cx="33" cy="36" r="5" fill="#f4c542" stroke="#3a2f28" strokeWidth="1.4" /></g>
      <g transform="translate(108 30)"><ellipse cx="20" cy="46" rx="22" ry="5" fill="#000" opacity=".08" /><path d="M20 6c-4 6-14 9-14 24 0 12 8 18 14 18s14-6 14-18C34 15 24 12 20 6z" fill="#e8873a" stroke="#3a2f28" strokeWidth="1.6" /><path d="M20 6c0-4 3-6 7-5" stroke="#3a2f28" strokeWidth="1.6" fill="none" strokeLinecap="round" /><path d="M20 6c-3-3-8-3-10-1 4 0 8 0 10 1z" fill="#6aa04a" stroke="#3a2f28" strokeWidth="1.4" /></g>
      <g transform="translate(168 40)"><path d="M0 24c0-12 10-22 24-22 4 8 4 20-2 28-8 6-22 4-22-6z" fill="#cfd8a0" stroke="#3a2f28" strokeWidth="1.6" /><path d="M24 2c-6 6-14 14-20 26" stroke="#3a2f28" strokeWidth="1.4" fill="none" /></g>
      <g transform="translate(216 34)"><rect x="4" y="8" width="38" height="46" rx="6" fill="#fff" stroke="#3a2f28" strokeWidth="1.6" /><rect x="4" y="8" width="38" height="12" rx="6" fill="#d9644a" stroke="#3a2f28" strokeWidth="1.6" /><path d="M12 32h22M12 40h14" stroke="#cfc7bf" strokeWidth="2.4" strokeLinecap="round" /></g>
      <g transform="translate(268 48)"><ellipse cx="14" cy="34" rx="16" ry="4" fill="#000" opacity=".08" /><ellipse cx="14" cy="18" rx="12" ry="16" fill="#f4d46a" stroke="#3a2f28" strokeWidth="1.6" /><path d="M8 8c4 6 4 18 0 26" stroke="#c9a33a" strokeWidth="1.4" fill="none" /></g>
    </svg>
  );
}
