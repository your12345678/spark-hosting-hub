import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function findUserByEmail(email: string) {
  const target = email.toLowerCase();
  for (let page = 1; page <= 20; page++) {
    const list = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (list.error) throw new Error(list.error.message);
    const user = list.data.users.find((u) => u.email?.toLowerCase() === target);
    if (user) return user;
    if (list.data.users.length < 1000) break;
  }
  return null;
}

export async function ensureAdminUser(
  email: string,
  password: string,
  isMain = false,
  isOwner = false,
) {
  let user = await findUserByEmail(email);

  if (!user) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw new Error(created.error.message);
    user = created.data.user!;
  } else {
    const updated = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (updated.error) throw new Error(updated.error.message);
    user = updated.data.user ?? user;
  }

  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert(
      { user_id: user.id, role: "admin", is_main: isMain, is_owner: isOwner },
      { onConflict: "user_id,role" },
    );
  if (roleErr) throw new Error(roleErr.message);

  if (isMain || isOwner) {
    await supabaseAdmin
      .from("user_roles")
      .update({ is_main: isMain || isOwner, is_owner: isOwner })
      .eq("user_id", user.id)
      .eq("role", "admin");
  }

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

export async function isUserMainAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("is_main", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export async function isUserOwner(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .eq("is_owner", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

async function isTargetOwner(userId: string) {
  return isUserOwner(userId);
}

export async function revokeAdmin(userId: string) {
  if (await isTargetOwner(userId)) throw new Error("The owner cannot be removed");
  await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", "admin");
}

export async function listAdminUsers() {
  const { data: roles, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role, is_main, is_owner, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const result: {
    user_id: string;
    email: string | null;
    is_main: boolean;
    is_owner: boolean;
    created_at: string;
  }[] = [];
  for (const r of roles ?? []) {
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(r.user_id);
    result.push({
      user_id: r.user_id,
      email: u?.user?.email ?? null,
      is_main: !!r.is_main,
      is_owner: !!(r as any).is_owner,
      created_at: r.created_at,
    });
  }
  return result;
}

export async function grantAdminByEmail(email: string, isMain = false) {
  const user = await findUserByEmail(email);
  if (!user) throw new Error(`No account found for ${email}. Ask them to sign up first.`);
  const { error } = await supabaseAdmin
    .from("user_roles")
    .upsert(
      { user_id: user.id, role: "admin", is_main: isMain, is_owner: false },
      { onConflict: "user_id,role" },
    );
  if (error) throw new Error(error.message);
  if (isMain) {
    await supabaseAdmin
      .from("user_roles")
      .update({ is_main: true })
      .eq("user_id", user.id)
      .eq("role", "admin");
  }
  return { user_id: user.id, email: user.email };
}

export async function setMainAdminFlag(userId: string, isMain: boolean) {
  if (await isTargetOwner(userId)) throw new Error("The owner's role cannot be changed");
  const { error } = await supabaseAdmin
    .from("user_roles")
    .update({ is_main: isMain })
    .eq("user_id", userId)
    .eq("role", "admin");
  if (error) throw new Error(error.message);
}
