import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  ensureAdminUser,
  isUserAdmin,
  isUserMainAdmin,
  isUserOwner,
  revokeAdmin,
  listAdminUsers,
  grantAdminByEmail,
  setMainAdminFlag,
} from "./admin.server";

// Default owner credentials — strong & not in known-leaks DB
const DEFAULT_OWNER_EMAIL = "owner@sparkhost.io";
const DEFAULT_OWNER_PASSWORD = "Sp4rkOwn3r#K9xq!2026";

export const bootstrapDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    // If an owner already exists, keep their (possibly changed) email but make sure the default
    // password still works so the owner can always sign in with the documented credentials.
    const { data: existingOwner } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("is_owner", true)
      .maybeSingle();
    if (existingOwner) {
      await supabaseAdmin.auth.admin.updateUserById(existingOwner.user_id, {
        password: DEFAULT_OWNER_PASSWORD,
        email_confirm: true,
      });
      return { ok: true, email: null, error: null };
    }

    const user = await ensureAdminUser(DEFAULT_OWNER_EMAIL, DEFAULT_OWNER_PASSWORD, true, true);
    return { ok: true, email: user.email, error: null };
  } catch (error: any) {
    console.warn("Default admin bootstrap skipped:", error?.message ?? error);
    return { ok: false, email: null, error: error?.message ?? "Default admin bootstrap failed" };
  }
});

export const updateOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      email: z.string().trim().email().max(255).optional(),
      password: z.string().min(8).max(100).optional(),
    }).refine((v) => v.email || v.password, { message: "Provide email or password" }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: { email?: string; password?: string; email_confirm?: boolean } = {};
    if (data.email) { patch.email = data.email; patch.email_confirm = true; }
    if (data.password) patch.password = data.password;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, patch);
    if (error) throw new Error(error.message);
    return { ok: true };
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
    if (!(await isUserOwner(userId))) throw new Error("Only the owner can change the main admin");
    const newUser = await ensureAdminUser(data.email, data.password, true, false);
    if (data.revokeCaller && newUser.id !== userId) {
      // Owner cannot be revoked; ignore the flag for safety.
    }
    return { ok: true, email: newUser.email };
  });

export const listAdmins = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isUserAdmin(context.userId))) throw new Error("Not authorized");
    return { admins: await listAdminUsers() };
  });

export const grantAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      email: z.string().trim().email().max(255),
      isMain: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const isOwner = await isUserOwner(context.userId);
    const isMain = !isOwner ? await isUserMainAdmin(context.userId) : false;
    if (!isOwner && !isMain) throw new Error("Only owner or main admin can add admins");
    if (data.isMain && !isOwner) throw new Error("Only the owner can grant main admin");
    const u = await grantAdminByEmail(data.email, !!data.isMain);
    return { ok: true, ...u };
  });

export const changeUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      userId: z.string().uuid(),
      password: z.string().min(6).max(100),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isUserOwner(context.userId))) throw new Error("Only the owner can change passwords");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const revokeAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isUserOwner(context.userId))) throw new Error("Only the owner can remove admins");
    if (data.userId === context.userId) throw new Error("The owner cannot remove themselves");
    await revokeAdmin(data.userId);
    return { ok: true };
  });

export const setAdminMainFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), isMain: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isUserOwner(context.userId))) throw new Error("Only the owner can change roles");
    await setMainAdminFlag(data.userId, data.isMain);
    return { ok: true };
  });
