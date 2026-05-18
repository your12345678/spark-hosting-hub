import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ensureAdminUser, isUserAdmin, revokeAdmin } from "./admin.server";

export const bootstrapDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    const user = await ensureAdminUser("lovable@admin.com", "LovableAdmin#2026");
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
    if (!(await isUserAdmin(userId))) throw new Error("Not authorized");

    const newUser = await ensureAdminUser(data.email, data.password);

    if (data.revokeCaller && newUser.id !== userId) {
      await revokeAdmin(userId);
    }

    return { ok: true, email: newUser.email };
  });
