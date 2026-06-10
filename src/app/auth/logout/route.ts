import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/auth/server";

export async function POST() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
