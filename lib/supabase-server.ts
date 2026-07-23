import { createClient } from "@supabase/supabase-js";

function createSupabaseAdmin(url: string, key: string) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

let cachedAdmin: {
  url: string;
  key: string;
  client: ReturnType<typeof createSupabaseAdmin>;
} | null = null;

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  if (cachedAdmin?.url === supabaseUrl && cachedAdmin.key === serviceRoleKey) {
    return cachedAdmin.client;
  }

  const client = createSupabaseAdmin(supabaseUrl, serviceRoleKey);

  cachedAdmin = { url: supabaseUrl, key: serviceRoleKey, client };
  return client;
}
