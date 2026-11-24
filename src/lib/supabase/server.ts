import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Cliente do utilizador autenticado (lê a sessão das cookies). */
export async function serverClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => { try { list.forEach((c) => store.set(c.name, c.value, c.options)); } catch { /* handler só de leitura */ } },
    },
  });
}

/** Service role: só para route handlers, depois de verificar o utilizador. */
export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function currentUser() {
  const { data } = await (await serverClient()).auth.getUser();
  return data.user;
}
