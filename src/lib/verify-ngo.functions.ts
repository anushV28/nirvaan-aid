import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InputSchema = z.object({ orgId: z.string().uuid() });

export const verifyNgo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin } = await context.supabase
      .from("admins")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!admin) throw new Error("Only admins can run authenticity checks.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: org, error } = await supabaseAdmin
      .from("organizations")
      .select(
        "org_name, registration_number, contact_person, contact_phone, email, website, area_of_operation, resources_available",
      )
      .eq("id", data.orgId)
      .maybeSingle();
    if (error || !org) throw new Error("Organization not found.");

    const { verifyOrganization } = await import("./verify-ngo.server");
    const result = await verifyOrganization(org);

    const { error: updateError } = await supabaseAdmin
      .from("organizations")
      .update({
        verification_status: result.status,
        verification_score: result.score,
        verification_notes: result.notes,
        verified_at: new Date().toISOString(),
      })
      .eq("id", data.orgId);
    if (updateError) throw new Error(updateError.message);

    return result;
  });
