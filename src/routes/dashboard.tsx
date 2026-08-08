import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Phone, X } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { MapView } from "@/components/map/MapView";
import type { MapLine, MapPin } from "@/components/map/LeafletMap";
import { useAuth } from "@/hooks/useAuth";
import { useLiveData } from "@/hooks/useLiveData";
import { supabase } from "@/integrations/supabase/client";
import {
  URGENCY_COLOR,
  URGENCY_ORDER,
  VADODARA,
  distanceKm,
  formatDistance,
  timeAgo,
  type HelpRequest,
} from "@/lib/nirvaan";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Live response map — Nirvaan" },
      {
        name: "description",
        content:
          "Real-time map of open help requests, available volunteers, rescue teams and approved relief organizations.",
      },
      { property: "og:title", content: "Live response map — Nirvaan" },
      {
        property: "og:description",
        content: "Real-time map of open help requests and available responders.",
      },
    ],
  }),
  component: Dashboard,
});

type Responder = {
  id: string;
  name: string;
  type: "volunteer" | "group" | "ngo";
  phone: string;
  lat: number;
  lng: number;
  detail: string;
  distance: number;
};

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { requests, volunteers, organizations, loading } = useLiveData();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected = requests.find((request) => request.id === selectedId) ?? null;

  const pins = useMemo<MapPin[]>(() => {
    const requestPins: MapPin[] = requests
      .filter((request) => request.status !== "resolved")
      .map((request) => ({
        id: `r-${request.id}`,
        lat: request.location_lat,
        lng: request.location_lng,
        kind: "request",
        color: URGENCY_COLOR[request.urgency] ?? "var(--medium)",
        title: request.description.slice(0, 80),
        pulsing: request.urgency === "critical",
        onClick: () => setSelectedId(request.id),
      }));

    const volunteerPins: MapPin[] = volunteers.map((volunteer) => ({
      id: `v-${volunteer.id}`,
      lat: volunteer.location_lat,
      lng: volunteer.location_lng,
      kind: volunteer.signup_type === "group" ? "group" : "volunteer",
      color: volunteer.status === "available" ? "var(--primary)" : "var(--muted-foreground)",
      badge: volunteer.member_count ? String(volunteer.member_count) : undefined,
      title: `${volunteer.name}${volunteer.member_count ? ` (${volunteer.member_count} ${t("map.members")})` : ""}`,
    }));

    const orgPins: MapPin[] = organizations.map((org) => ({
      id: `o-${org.id}`,
      lat: org.location_lat,
      lng: org.location_lng,
      kind: "ngo",
      color: "oklch(0.45 0.13 300)",
      title: `${org.org_name} — ${org.resources_available ?? ""}`,
    }));

    return [...orgPins, ...volunteerPins, ...requestPins];
  }, [requests, volunteers, organizations, t]);

  const lines = useMemo<MapLine[]>(() => {
    const out: MapLine[] = [];
    for (const request of requests) {
      if (!request.assigned_responder_id || request.status === "resolved") continue;
      const responder =
        volunteers.find((v) => v.id === request.assigned_responder_id) ??
        organizations.find((o) => o.id === request.assigned_responder_id);
      if (!responder) continue;
      out.push({
        id: `line-${request.id}`,
        from: [request.location_lat, request.location_lng],
        to: [responder.location_lat, responder.location_lng],
      });
    }
    return out;
  }, [requests, volunteers, organizations]);

  const nearby = useMemo<Responder[]>(() => {
    if (!selected) return [];
    const origin = { lat: selected.location_lat, lng: selected.location_lng };
    const fromVolunteers: Responder[] = volunteers
      .filter((volunteer) => volunteer.status === "available")
      .map((volunteer) => ({
        id: volunteer.id,
        name: volunteer.name,
        type: volunteer.signup_type === "group" ? "group" : "volunteer",
        phone: volunteer.contact_phone,
        lat: volunteer.location_lat,
        lng: volunteer.location_lng,
        detail: [
          volunteer.skills.join(", "),
          volunteer.member_count ? `${volunteer.member_count} ${t("map.members")}` : "",
        ]
          .filter(Boolean)
          .join(" · "),
        distance: distanceKm(origin, {
          lat: volunteer.location_lat,
          lng: volunteer.location_lng,
        }),
      }));

    const fromOrgs: Responder[] = organizations.map((org) => ({
      id: org.id,
      name: org.org_name,
      type: "ngo",
      phone: org.contact_phone,
      lat: org.location_lat,
      lng: org.location_lng,
      detail: org.resources_available ?? org.area_of_operation ?? "",
      distance: distanceKm(origin, { lat: org.location_lat, lng: org.location_lng }),
    }));

    return [...fromVolunteers, ...fromOrgs].sort((a, b) => a.distance - b.distance).slice(0, 12);
  }, [selected, volunteers, organizations, t]);

  const assign = async (responder: Responder) => {
    if (!selected) return;
    if (!user) {
      toast.error("Log in as a volunteer or organization to assign responders.");
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("requests")
      .update({
        status: "assigned",
        assigned_responder_id: responder.id,
        assigned_responder_type: responder.type === "ngo" ? "ngo" : responder.type,
      })
      .eq("id", selected.id);
    if (error) toast.error(error.message);
    else {
      await supabase.from("assignments").insert({
        request_id: selected.id,
        responder_id: responder.id,
        responder_type: responder.type === "ngo" ? "ngo" : responder.type,
      });
      toast.success(t("map.assigned"));
    }
    setBusy(false);
  };

  const setStatus = async (request: HelpRequest, status: "en_route" | "resolved") => {
    if (!user) {
      toast.error("Log in to update the status of a request.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("requests").update({ status }).eq("id", request.id);
    if (error) toast.error(error.message);
    if (status === "resolved" && !error) {
      await supabase
        .from("assignments")
        .update({ resolved_at: new Date().toISOString() })
        .eq("request_id", request.id);
    }
    setBusy(false);
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header />
      <div className="relative flex-1">
        <MapView center={VADODARA} zoom={12} pins={pins} lines={lines} />

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
          <div className="pointer-events-auto rounded-lg border border-border bg-card/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <p className="mb-1.5 flex items-center gap-1.5 font-semibold">
              <span className="size-2 animate-pulse rounded-full bg-low" />
              {t("map.live")} · {requests.length} {t("map.requests")}
            </p>
            <ul className="space-y-1">
              {(["critical", "high", "medium", "low"] as const).map((level) => (
                <li key={level} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: URGENCY_COLOR[level] }}
                  />
                  {t(`urgency.${level}`)}
                </li>
              ))}
              <li className="flex items-center gap-2 pt-1">
                <span className="size-2.5 rounded-full bg-primary" />
                {t("map.volunteers")}
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-sm"
                  style={{ background: "oklch(0.45 0.13 300)" }}
                />
                {t("map.organizations")}
              </li>
            </ul>
          </div>
          {loading ? (
            <div className="pointer-events-auto rounded-lg bg-card px-3 py-2 text-xs shadow">
              Loading…
            </div>
          ) : null}
        </div>

        {selected ? (
          <aside className="absolute right-0 top-0 z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-card shadow-2xl sm:w-[26rem]">
            <div className="flex items-start justify-between gap-2 border-b border-border p-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
                    style={{ background: URGENCY_COLOR[selected.urgency] }}
                  >
                    {t(`urgency.${selected.urgency}`)}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold">
                    {t(`category.${selected.category}`)}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-0.5 text-xs font-semibold">
                    {t(`status.${selected.status}`)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {timeAgo(selected.created_at)} · #{selected.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                aria-label={t("map.close")}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-4">
              <p className="text-sm leading-relaxed">{selected.description}</p>

              <dl className="space-y-2 rounded-lg bg-secondary p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">{t("map.reportedBy")}</dt>
                  <dd className="text-right font-medium">
                    {selected.reporter_name} ({selected.relationship})
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>
                    <a
                      href={`tel:${selected.reporter_phone}`}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      {selected.reporter_phone}
                    </a>
                  </dd>
                </div>
                {selected.landmark ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">{t("map.landmark")}</dt>
                    <dd className="text-right font-medium">{selected.landmark}</dd>
                  </div>
                ) : null}
              </dl>

              {selected.status !== "pending" ? (
                <div className="flex gap-2">
                  <button
                    disabled={busy || selected.status !== "assigned"}
                    onClick={() => void setStatus(selected, "en_route")}
                    className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold disabled:opacity-50"
                  >
                    {t("map.markEnRoute")}
                  </button>
                  <button
                    disabled={busy || selected.status === "resolved"}
                    onClick={() => void setStatus(selected, "resolved")}
                    className="flex-1 rounded-lg bg-low px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {t("map.markResolved")}
                  </button>
                </div>
              ) : null}

              <div>
                <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {t("map.nearby")}
                </h2>
                <ul className="mt-2 space-y-2">
                  {nearby.length === 0 ? (
                    <li className="text-sm text-muted-foreground">{t("map.noResponders")}</li>
                  ) : null}
                  {nearby.map((responder) => (
                    <li
                      key={`${responder.type}-${responder.id}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{
                          background:
                            responder.type === "ngo" ? "oklch(0.45 0.13 300)" : "var(--primary)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{responder.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatDistance(responder.distance)} {t("map.away")}
                          {responder.detail ? ` · ${responder.detail}` : ""}
                        </p>
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => void assign(responder)}
                        className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
                      >
                        {selected.assigned_responder_id === responder.id
                          ? t("map.assigned")
                          : t("map.assign")}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
