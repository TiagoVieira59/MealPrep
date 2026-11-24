"use client";
import { useEffect } from "react";
import { ensureSession } from "@/lib/supabase/client";

/** Conta anónima automática + registo do service worker. */
export function Boot() {
  useEffect(() => {
    ensureSession().catch(() => {}); // offline: segue sem sessão
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
