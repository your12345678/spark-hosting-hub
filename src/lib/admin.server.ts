import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function ensureAdminUser(email: string, password: string) {
  const target = email.toLowerCase();
  let user: any = null;
  for (let page = 1; page <= 20; page++) {
    const list = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (list.error) throw new Error(list.error.message);
    user = list.data.users.find((u) => u.email?.toLowerCase() === target);
    if (user) break;
    if (list.data.users.length < 1000) break;
  }

  if (!user) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw new Error(created.error.message);
    user = created.data.user!;
  } else {
    const upd = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (upd.error && !/weak|pwned|known/i.test(upd.error.message)) {
      throw new Error(upd.error.message);
    }
  }

  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return user;
}

export async function isUserAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export async function revokeAdmin(userId: string) {
  await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", "admin");
}
