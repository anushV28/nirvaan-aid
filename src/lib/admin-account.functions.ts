import { createServerFn } from "@tanstack/react-start";

export const ensureAdminAccount = createServerFn({ method: "POST" }).handler(async () => {
  const { ensureAdminAccountExists } = await import("./admin-account.server");
  return await ensureAdminAccountExists();
});
