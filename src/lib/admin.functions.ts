import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_EMAIL = "admin@gmail.com";
const DEFAULT_PASSWORD = "admin123";

async function ensureAdminUser(email: string, password: string) {
  // Find existing user
  const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (list.error) throw new Error(list.error.message);
  let user = list.data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (!user) {
    const created = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) throw new Error(created.error.message);
    user = created.data.user!;
  } else {
    // Update password to requested one
    const upd = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    });
    if (upd.error) throw new Error(upd.error.message);
  }

  // Grant admin role (idempotent)
  const { error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .upsert({ user_id: user.id, role: "admin" }, { onConflict: "user_id,role" });
  if (roleErr) throw new Error(roleErr.message);

  return user;
}

export const bootstrapDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const user = await ensureAdminUser(DEFAULT_EMAIL, DEFAULT_PASSWORD);
  return { ok: true, email: user.email };
});

export const changeMainAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(6).max(100),
        revokeCaller: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Verify caller is admin
    const { data: roleRow, error: roleCheckErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleCheckErr) throw new Error(roleCheckErr.message);
    if (!roleRow) throw new Error("Not authorized");

    const newUser = await ensureAdminUser(data.email, data.password);

    if (data.revokeCaller && newUser.id !== userId) {
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
    }

    return { ok: true, email: newUser.email };
  });
