import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { MotionConfig } from "motion/react";
import { Boot } from "@/components/Boot";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const figtree = Figtree({ subsets: ["latin"], variable: "--font-figtree", display: "swap" });

export const metadata: Metadata = {
  title: "MealPrep", description: "A tua semana de refeições, dentro do orçamento, com as contas à vista.",
  appleWebApp: { capable: true, title: "MealPrep", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width", initialScale: 1, viewportFit: "cover",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#faf6ee" }, { media: "(prefers-color-scheme: dark)", color: "#121714" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${fraunces.variable} ${figtree.variable}`}>
      <body>
        <MotionConfig reducedMotion="user"><Boot />
        <div className="md:pl-56">
          <main className="mx-auto w-full max-w-xl px-5 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+96px)] md:max-w-5xl md:pb-12">{children}</main>
        </div>
        <Nav /></MotionConfig>
      </body>
    </html>
  );
}
