"use client";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
export function Sub({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl">
      <Link href="/tu" className="btn btn-ghost mb-4 !min-h-11 w-fit gap-2 text-sm"><ArrowLeft size={16} />Tu</Link>
      <h1 className="text-[32px] leading-tight">{title}</h1>
      {hint && <p className="mt-1 text-ink2">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}
export const Msg = ({ text, ok }: { text: string; ok?: boolean }) => (text ? <p role={ok ? "status" : "alert"} className={`text-sm ${ok ? "text-ok" : "text-err"}`}>{text}</p> : null);
