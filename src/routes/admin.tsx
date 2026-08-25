import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { Header } from "@/components/Header";
import { RequireAuth } from "@/components/RequireAuth";
import { MapView } from "@/components/map/MapView";
import type { MapCircle } from "@/components/map/LeafletMap";
import { PIN_COLOR, VADODARA, type Organization } from "@/lib/nirvaan";
import { useLiveData } from "@/hooks/useLiveData";
import { supabase } from "@/integrations/supabase/client";
import { verifyNgo } from "@/lib/verify-ngo.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin approvals — Nirvaan" },
      {
        name: "description",
        content:
          "Verify, approve or reject relief organizations and allocate exclusive response areas on Nirvaan.",
      },
      { property: "og:title", content: "Admin approvals — Nirvaan" },
      {
        property: "og:description",
        content: "Verify organizations and allocate exclusive response areas.",
      },
    ],
  }),
  component: GuardedAdmin,
});

const CATEGORIES = ["any", "medical", "food", "shelter", "rescue", "general"] as const;
const URGENCIES = ["any", "critical", "high", "medium", "low"] as const;

function VerificationBadge({ org }: { org: Organization }) {
  const { t } = useTranslation();
  const tone =
    org.verification_status === "verified"
      ? "bg-low text-foreground"
      : org.verification_status === "suspicious"
        ? "bg-critical text-white"
        : org.verification_status === "review"
          ? "bg-high text-white"
          : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}>
      {t(`verify.${org.verification_status}`)}
      {org.verification_score != null ? ` · ${org.verification_score}/100` : ""}
    </span>
  );
}

function Admin() {
  const { t } = useTranslation();
  const { pendingOrganizations, organizations, zones } = useLiveData({ includePending: true });
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);

  const [orgId, setOrgId] = useState("");
  const [areaName, setAreaName] = useState("");
  const [radius, setRadius] = useState(3);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("any");
  const [urgency, setUrgency] = useState<(typeof URGENCIES)[number]>("any");
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: VADODARA[0],
    lng: VADODARA[1],
  });

  const circles = useMemo<MapCircle[]>(
    () =>
      zones
        .filter((zone) => zone.status === "active")
        .map((zone) => ({
          id: zone.id,
          center: [zone.center_lat, zone.center_lng] as [number, number],
          radiusKm: zone.radius_km,
          color: PIN_COLOR.ngo,
        }))
        .concat([
          {
            id: "draft",
            center: [center.lat, center.lng] as [number, number],
            radiusKm: radius,
            color: PIN_COLOR.group,
          },
        ]),
    [zones, center, radius],
  );

  const decide = async (id: string, status: "approved" | "rejected") => {
    const org = pendingOrganizations.find((item) => item.id === id);
    if (status === "approved" && org && org.verification_status === "unverified") {
      toast.error(t("verify.blockedApproval"));
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("organizations")
      .update({ approval_status: status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(status === "approved" ? t("admin.approve") : t("admin.reject"));
    setBusy(false);
  };

  const runVerification = async (id: string) => {
    setVerifying(id);
    try {
      const result = await verifyNgo({ data: { orgId: id } });
      toast.success(`${t("verify.title")}: ${result.score}/100`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : String(error));
    }
    setVerifying(null);
  };

  const allocate = async () => {
    if (!orgId || !areaName.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("zone_allocations").insert({
      org_id: orgId,
      area_name: areaName.trim(),
      center_lat: center.lat,
      center_lng: center.lng,
      radius_km: radius,
      category,
      urgency,
      status: "active",
    });
    if (error) toast.error(error.message);
    else {
      toast.success(t("zones.created"));
      setAreaName("");
    }
    setBusy(false);
  };

  const release = async (id: string) => {
    setBusy(true);
    const { error } = await supabase.from("zone_allocations").delete().eq("id", id);
    if (error) toast.error(error.message);
    else toast.success(t("zones.removed"));
    setBusy(false);
  };

  const orgName = (id: string) =>
    organizations.find((org) => org.id === id)?.org_name ??
    pendingOrganizations.find((org) => org.id === id)?.org_name ??
    id.slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="font-display text-3xl font-bold">{t("admin.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("admin.subtitle")}</p>

        <ul className="mt-6 space-y-3">
          {pendingOrganizations.length === 0 ? (
            <li className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
              {t("admin.empty")}
            </li>
          ) : null}
          {pendingOrganizations.map((org: Organization) => (
            <li key={org.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-bold">{org.org_name}</p>
                    <VerificationBadge org={org} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {[org.registration_number, org.area_of_operation, org.resources_available]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {org.contact_phone} · {org.email}
                    {org.website ? ` · ${org.website}` : ""}
                  </p>
                  {org.verification_notes ? (
                    <p className="mt-2 whitespace-pre-line rounded-lg bg-secondary p-3 text-sm">
                      {org.verification_notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    disabled={verifying === org.id}
                    onClick={() => void runVerification(org.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-bold disabled:opacity-60"
                  >
                    <ShieldCheck className="size-4" aria-hidden="true" />
                    {verifying === org.id ? t("verify.running") : t("verify.run")}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => void decide(org.id, "approved")}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
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
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">{t("zones.title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("zones.subtitle")}</p>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="h-80 overflow-hidden rounded-xl border border-border">
              <MapView
                center={VADODARA}
                zoom={11}
                circles={circles}
                draggable={{
                  lat: center.lat,
                  lng: center.lng,
                  onChange: (lat, lng) => setCenter({ lat, lng }),
                }}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">{t("zones.pickOnMap")}</p>

              <label className="mt-3 block text-sm font-semibold" htmlFor="zone-org">
                {t("zones.org")}
              </label>
              <select
                id="zone-org"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.org_name}
                  </option>
                ))}
              </select>

              <label className="mt-3 block text-sm font-semibold" htmlFor="zone-area">
                {t("zones.area")}
              </label>
              <input
                id="zone-area"
                value={areaName}
                placeholder={t("zones.areaPlaceholder")}
                onChange={(e) => setAreaName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-sm font-semibold" htmlFor="zone-radius">
                    {t("zones.radius")}
                  </label>
                  <input
                    id="zone-radius"
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value) || 1)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold" htmlFor="zone-category">
                    {t("zones.category")}
                  </label>
                  <select
                    id="zone-category"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as (typeof CATEGORIES)[number])
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {CATEGORIES.map((value) => (
                      <option key={value} value={value}>
                        {value === "any" ? t("zones.any") : t(`category.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold" htmlFor="zone-urgency">
                    {t("zones.urgency")}
                  </label>
                  <select
                    id="zone-urgency"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as (typeof URGENCIES)[number])}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {URGENCIES.map((value) => (
                      <option key={value} value={value}>
                        {value === "any" ? t("zones.any") : t(`urgency.${value}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                disabled={busy || !orgId || !areaName.trim()}
                onClick={() => void allocate()}
                className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {busy ? t("zones.creating") : t("zones.create")}
              </button>
            </div>
          </div>

          <h3 className="mt-8 font-display text-lg font-bold">{t("zones.listTitle")}</h3>
          <ul className="mt-3 space-y-2">
            {zones.length === 0 ? (
              <li className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                {t("zones.empty")}
              </li>
            ) : null}
            {zones.map((zone) => (
              <li
                key={zone.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm"
              >
                <span className="size-2.5 rounded-full" style={{ background: PIN_COLOR.ngo }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {zone.area_name} · {orgName(zone.org_id)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {zone.radius_km} km ·{" "}
                    {zone.category === "any" ? t("zones.any") : t(`category.${zone.category}`)} ·{" "}
                    {zone.urgency === "any" ? t("zones.any") : t(`urgency.${zone.urgency}`)}
                  </p>
                </div>
                <button
                  disabled={busy}
                  onClick={() => void release(zone.id)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                >
                  {t("zones.remove")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function GuardedAdmin() {
  return (
    <RequireAuth admin>
      <Admin />
    </RequireAuth>
  );
}
