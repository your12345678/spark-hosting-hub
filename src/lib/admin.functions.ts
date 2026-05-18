import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ensureAdminUser,
  isUserAdmin,
  isUserMainAdmin,
  revokeAdmin,
  listAdminUsers,
  grantAdminByEmail,
  setMainAdminFlag,
} from "./admin.server";

export const bootstrapDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const user = await ensureAdminUser("lovable@admin.com", "LovableAdmin#2026", true);
    return { ok: true, email: user.email, error: null };
  } catch (error: any) {
    console.warn("Default admin bootstrap skipped:", error?.message ?? error);
    return { ok: false, email: null, error: error?.message ?? "Default admin bootstrap failed" };
  }
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
    if (!(await isUserMainAdmin(userId))) throw new Error("Only the main admin can change the main admin");
    const newUser = await ensureAdminUser(data.email, data.password, true);
    if (data.revokeCaller && newUser.id !== userId) await revokeAdmin(userId);
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
    if (!(await isUserMainAdmin(context.userId))) throw new Error("Only the main admin can add admins");
    const u = await grantAdminByEmail(data.email, !!data.isMain);
    return { ok: true, ...u };
  });

export const revokeAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isUserMainAdmin(context.userId))) throw new Error("Only the main admin can remove admins");
    if (data.userId === context.userId) throw new Error("Use 'Change main admin' to transfer your own role");
    await revokeAdmin(data.userId);
    return { ok: true };
  });

export const setAdminMainFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ userId: z.string().uuid(), isMain: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!(await isUserMainAdmin(context.userId))) throw new Error("Only the main admin can change roles");
    await setMainAdminFlag(data.userId, data.isMain);
    return { ok: true };
  });
