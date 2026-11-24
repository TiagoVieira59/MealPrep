"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, ShoppingBasket, UserRound } from "lucide-react";

const items = [
  { href: "/", label: "Hoje", Icon: ClipboardList },
  { href: "/semana", label: "Semana", Icon: CalendarDays },
  { href: "/lista", label: "Lista", Icon: ShoppingBasket },
  { href: "/tu", label: "Tu", Icon: UserRound },
];
const hidden = ["/bem-vindo", "/admin"];

export function Nav() {
  const path = usePathname();
  if (hidden.some((h) => path.startsWith(h))) return null;
  const active = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));
  return (
    <nav aria-label="Principal" className="fixed z-30 bottom-0 inset-x-0 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-auto md:w-56 md:border-t-0 md:border-r md:pb-0 md:pt-8">
      <ul className="mx-auto flex max-w-xl md:max-w-none md:flex-col md:gap-1 md:px-3">
        <li className="hidden md:block px-3 pb-6 font-display text-2xl">MealPrep</li>
        {items.map(({ href, label, Icon }) => (
          <li key={href} className="flex-1">
            <Link href={href} aria-current={active(href) ? "page" : undefined}
              className={`flex h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium md:h-12 md:flex-row md:justify-start md:gap-3 md:rounded-xl md:px-3 md:text-base ${active(href) ? "text-primary md:bg-tint" : "text-ink2"}`}>
              <Icon size={22} strokeWidth={1.75} aria-hidden />{label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
