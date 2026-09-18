import { AuthError, type SupabaseClient, type UserResponse } from "@supabase/supabase-js";

// Never authorize from session/JWT metadata: suspension is mutable database state.
export async function getActiveUser(supabase: SupabaseClient): Promise<UserResponse> {
  try {
    const result = await supabase.auth.getUser();
    if (result.error) return { data: { user: null }, error: result.error };
    if (!result.data.user) return result;
    const { data: profile, error } = await supabase.from("profiles")
      .select("account_status").eq("id", result.data.user.id).maybeSingle();
    if (error || !profile) return denied("Account access could not be verified.", 503, "account_unavailable");
    if (profile.account_status !== "active") return denied("This account is suspended or inactive.", 403, "account_suspended");
    return result;
  } catch {
    return denied("Account access could not be verified.", 503, "account_unavailable");
  }
}

function denied(message: string, status: number, code: string): UserResponse {
  return { data: { user: null }, error: new AuthError(message, status, code) };
}
