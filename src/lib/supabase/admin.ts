import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client "service role" : bypasse la RLS, à n'utiliser que côté serveur
 * (server actions / route handlers) après avoir vérifié que l'appelant
 * est bien administrateur. Ne jamais exposer SUPABASE_SERVICE_ROLE_KEY au client.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
