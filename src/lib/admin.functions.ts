import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const userType = z.enum(["STUDENT", "SERVANT", "MAIN_ADMIN"]);

/** Public: whether the first main admin still needs to be created. */
export const getSetupStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("user_type", "MAIN_ADMIN");
  if (error) return { needsSetup: false };
  return { needsSetup: (count ?? 0) === 0 };
});

/** Creates the first MAIN_ADMIN. Refuses once any admin exists. */
export const createFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("user_type", "MAIN_ADMIN");
    if ((count ?? 0) > 0) return { ok: false, error: "تم إعداد المسؤول الرئيسي بالفعل." };
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) return { ok: false, error: "تعذّر إنشاء الحساب." };
    await supabaseAdmin
      .from("profiles")
      .update({ user_type: "MAIN_ADMIN", full_name: data.full_name })
      .eq("id", created.user.id);
    return { ok: true, error: null };
  });

async function assertMainAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("is_main_admin", { _uid: userId });
  if (!data) throw new Response("Forbidden", { status: 403 });
}

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(100),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().max(30).optional().default(""),
        password: z.string().min(8).max(72),
        user_type: userType,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user)
      return { ok: false, error: error?.message ?? "تعذّر إنشاء المستخدم." };
    await supabaseAdmin
      .from("profiles")
      .update({ user_type: data.user_type, full_name: data.full_name, phone: data.phone || null })
      .eq("id", created.user.id);
    return { ok: true, error: null };
  });

export const adminUpdateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(100),
        phone: z.string().trim().max(30).nullable(),
        user_type: userType,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    if (data.id === context.userId && data.user_type !== "MAIN_ADMIN")
      return { ok: false, error: "لا يمكنك إزالة صلاحية المسؤول عن نفسك." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone, user_type: data.user_type })
      .eq("id", data.id);
    if (error) return { ok: false, error: "تعذّر حفظ التعديلات." };
    if (data.user_type !== "SERVANT")
      await supabaseAdmin.from("user_permissions").delete().eq("user_id", data.id);
    return { ok: true, error: null };
  });

export const adminSetActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    if (data.id === context.userId) return { ok: false, error: "لا يمكنك تعطيل حسابك." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      ban_duration: data.active ? "none" : "876000h",
    });
    if (error) return { ok: false, error: "تعذّر تحديث الحساب." };
    await supabaseAdmin.from("profiles").update({ is_active: data.active }).eq("id", data.id);
    return { ok: true, error: null };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    if (data.id === context.userId) return { ok: false, error: "لا يمكنك حذف حسابك." };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Keep QR sessions (and other students' attendance) by reassigning them to the acting admin.
    await supabaseAdmin
      .from("attendance_sessions")
      .update({ created_by: context.userId })
      .eq("created_by", data.id);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) return { ok: false, error: "تعذّر حذف المستخدم." };
    return { ok: true, error: null };
  });
