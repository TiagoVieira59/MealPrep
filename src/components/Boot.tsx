"use client";
import { useEffect } from "react";
import { ensureSession } from "@/lib/supabase/client";
import { pullHouseholdPlan } from "@/lib/sync";

/** Conta anónima automática + registo do service worker. */
export function Boot() {
  useEffect(() => {
    ensureSession().catch(() => {}); // offline: segue sem sessão
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
    const t = setInterval(() => { if (document.visibilityState === "visible") pullHouseholdPlan().catch(() => {}); }, 20000);
    pullHouseholdPlan().catch(() => {});
    return () => clearInterval(t);
  }, []);
  return null;
}
