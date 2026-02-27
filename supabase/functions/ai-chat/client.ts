import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const createClient = () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceRoleKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_KEY") ?? "";
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey);
};
