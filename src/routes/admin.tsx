import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useState } from "react";

import { Header } from "@/components/Header";
import type { Organization } from "@/lib/nirvaan";
import { useLiveData } from "@/hooks/useLiveData";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin approvals — Nirvaan" },
      {
        name: "description",
        content: "Review, approve or reject relief organizations applying to coordinate on Nirvaan.",
      },
      { property: "og:title", content: "Admin approvals — Nirvaan" },
      {
        property: "og:description",
        content: "Review and approve relief organizations applying to Nirvaan.",
      },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { t } = useTranslation();
  const { pendingOrganizations } = useLiveData({ includePending: true });
  const [busy, setBusy] = useState(false);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusy(true);
    const { error } = await supabase.from("organizations").update({ approval_status: status }).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(status === "approved" ? t("admin.approve") : t("admin.reject"));
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">{t("admin.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("admin.subtitle")}</p>

        <ul className="mt-6 space-y-3">
          {pendingOrganizations.length === 0 ? (
            <li className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
              {t("admin.empty")}
            </li>
          ) : null}
          {pendingOrganizations.map((org: Organization) => (
            <li
              key={org.id}
              className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-bold">{org.org_name}</p>
                <p className="text-sm text-muted-foreground">
                  {[org.registration_number, org.area_of_operation, org.resources_available]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="text-sm text-muted-foreground">{org.contact_phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busy}
                  onClick={() => void decide(org.id, "approved")}
                  className="rounded-lg bg-low px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
                >
                  {t("admin.approve")}
                </button>
                <button
                  disabled={busy}
                  onClick={() => void decide(org.id, "rejected")}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:opacity-60"
                >
                  {t("admin.reject")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
