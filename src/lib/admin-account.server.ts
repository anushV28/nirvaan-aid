const ADMIN_EMAIL = "ajinkya.pandit07@gmail.com";
const ADMIN_PASSWORD = "Ajinkya@2007";
const ADMIN_NAME = "Ajinkya Pandit";

/**
 * Idempotently provisions the single built-in administrator account so the
 * admin approval panel is usable out of the box.
 */
export async function ensureAdminAccountExists() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let userId: string | undefined;

  const created = await supabaseAdmin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { name: ADMIN_NAME },
  });

  if (created.data?.user?.id) {
    userId = created.data.user.id;
  } else {
    // Already registered — look the account up instead.
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list.data?.users.find(
      (user) => user.email?.toLowerCase() === ADMIN_EMAIL,
    )?.id;
    if (userId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    }
  }

  if (!userId) {
    throw new Error("Could not provision the admin account");
  }

  await supabaseAdmin
    .from("admins")
    .upsert({ id: userId, name: ADMIN_NAME }, { onConflict: "id" });

  return { ok: true as const, email: ADMIN_EMAIL };
}
