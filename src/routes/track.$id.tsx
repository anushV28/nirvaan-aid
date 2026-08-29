import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Phone } from "lucide-react";

import { Header } from "@/components/Header";
import { SosButton } from "@/components/SosButton";
import { MapView } from "@/components/map/MapView";
import { ALL_FILTERS, MapLegend, toggleFilter, type PinFilter } from "@/components/map/MapLegend";
import type { MapLine, MapPin } from "@/components/map/LeafletMap";
import { useLiveData } from "@/hooks/useLiveData";
import {
  PIN_COLOR,
  URGENCY_COLOR,
  VADODARA,
  distanceKm,
  formatDistance,
  requestPinColor,
  timeAgo,
} from "@/lib/nirvaan";

export const Route = createFileRoute("/track/$id")({
  head: () => ({
    meta: [
      { title: "Live tracking — Nirvaan" },
      {
        name: "description",
        content:
          "Track your Nirvaan help request live: see its status and the responder heading towards you in real time.",
      },
      { property: "og:title", content: "Live tracking — Nirvaan" },
      {
        property: "og:description",
        content: "Follow your help request and the assigned responder in real time.",
      },
    ],
  }),
  component: TrackPage,
});

const STATUS_STEPS = ["pending", "assigned", "en_route", "resolved"] as const;

function TrackPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const { requests, volunteers, organizations, loading } = useLiveData();
  const [filters, setFilters] = useState<PinFilter[]>([...ALL_FILTERS]);

  const request = requests.find((item) => item.id === id) ?? null;

  const responder = useMemo(() => {
    if (!request?.assigned_responder_id) return null;
    const volunteer = volunteers.find((item) => item.id === request.assigned_responder_id);
    if (volunteer) {
      return {
        name: volunteer.name,
        phone: volunteer.contact_phone,
        lat: volunteer.location_lat,
        lng: volunteer.location_lng,
        kind: (volunteer.signup_type === "group" ? "group" : "volunteer") as PinFilter,
        detail: volunteer.skills.join(", "),
      };
    }
    const org = organizations.find((item) => item.id === request.assigned_responder_id);
    if (org) {
      return {
        name: org.org_name,
        phone: org.contact_phone,
        lat: org.location_lat,
        lng: org.location_lng,
        kind: "ngo" as PinFilter,
        detail: org.resources_available ?? org.area_of_operation ?? "",
      };
    }
    return null;
  }, [request, volunteers, organizations]);

  const pins = useMemo<MapPin[]>(() => {
    if (!request) return [];
    const out: MapPin[] = [];
    const requestFilter: PinFilter = request.is_sos
      ? "sos"
      : ((request.urgency as PinFilter) ?? "medium");
    if (filters.includes(requestFilter)) {
      out.push({
        id: `r-${request.id}`,
        lat: request.location_lat,
        lng: request.location_lng,
        kind: "request",
        color: requestPinColor(request),
        title: request.description.slice(0, 80),
        pulsing: true,
      });
    }
    if (responder && filters.includes(responder.kind)) {
      out.push({
        id: "responder",
        lat: responder.lat,
        lng: responder.lng,
        kind: responder.kind === "ngo" ? "ngo" : responder.kind === "group" ? "group" : "volunteer",
        color:
          responder.kind === "ngo"
            ? PIN_COLOR.ngo
            : responder.kind === "group"
              ? PIN_COLOR.group
              : PIN_COLOR.volunteer,
        title: responder.name,
      });
    }
    return out;
  }, [request, responder, filters]);

  const lines = useMemo<MapLine[]>(() => {
    if (!request || !responder) return [];
    return [
      {
        id: "route",
        from: [request.location_lat, request.location_lng],
        to: [responder.lat, responder.lng],
      },
    ];
  }, [request, responder]);

  if (!request) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="public" />
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          {loading ? (
            <p className="inline-flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("track.loading")}
            </p>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">{t("track.notFound")}</h1>
              <Link
                to="/"
                className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
              >
                {t("track.backHome")}
              </Link>
            </>
          )}
        </main>
      </div>
    );
  }

  const center: [number, number] = [
    request.location_lat || VADODARA[0],
    request.location_lng || VADODARA[1],
  ];
  const stepIndex = Math.max(
    0,
    STATUS_STEPS.indexOf(request.status as (typeof STATUS_STEPS)[number]),
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header variant="public" />

      <div className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("track.trackingId")}
            </p>
            <p className="font-mono text-lg font-bold">{request.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {request.is_sos ? (
              <span
                className="rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wide text-white"
                style={{ background: PIN_COLOR.sos }}
              >
                {t("sos.badge")}
              </span>
            ) : null}
            <span
              className="rounded-full px-2.5 py-0.5 font-bold uppercase tracking-wide text-white"
              style={{ background: URGENCY_COLOR[request.urgency] }}
            >
              {t(`urgency.${request.urgency}`)}
            </span>
            <span className="rounded-full bg-secondary px-2.5 py-0.5 font-semibold">
              {t(`category.${request.category}`)}
            </span>
            <span className="rounded-full border border-border px-2.5 py-0.5 font-semibold">
              {t(`status.${request.status}`)}
            </span>
            <span className="text-muted-foreground">{timeAgo(request.created_at)}</span>
          </div>
        </div>

        <ol className="mx-auto mt-3 flex max-w-5xl gap-1">
          {STATUS_STEPS.map((step, index) => (
            <li key={step} className="flex-1">
              <div
                className={`h-1.5 rounded-full ${index <= stepIndex ? "bg-primary" : "bg-muted"}`}
              />
              <p
                className={`mt-1 text-[11px] ${index <= stepIndex ? "font-semibold" : "text-muted-foreground"}`}
              >
                {t(`status.${step}`)}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative flex-1">
        <MapView center={center} zoom={14} pins={pins} lines={lines} recenterTo={center} />
        <SosButton />

        <div className="pointer-events-none absolute left-4 top-4 z-10 flex flex-col gap-2">
          <MapLegend
            active={filters}
            visibleCount={pins.length}
            onToggle={(filter) => setFilters((current) => toggleFilter(current, filter))}
            onReset={() => setFilters([...ALL_FILTERS])}
          />
        </div>

        <aside className="absolute bottom-4 left-1/2 z-10 w-[min(28rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur">
          {responder ? (
            <>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("track.responder")}
              </p>
              <div className="mt-1 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold">{responder.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDistance(
                      distanceKm(
                        { lat: request.location_lat, lng: request.location_lng },
                        { lat: responder.lat, lng: responder.lng },
                      ),
                    )}{" "}
                    {t("map.away")}
                    {responder.detail ? ` · ${responder.detail}` : ""}
                  </p>
                </div>
                <a
                  href={`tel:${responder.phone}`}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
                >
                  <Phone className="size-4" aria-hidden="true" />
                  {t("detail.call")}
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-display text-lg font-bold">
                <span className="size-2.5 animate-pulse rounded-full bg-accent" />
                {t("track.waitingTitle")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("track.waitingBody")}</p>
            </>
          )}
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link
              to="/request"
              className="rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted"
            >
              {t("track.newRequest")}
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-border px-3 py-1.5 font-medium hover:bg-muted"
            >
              {t("track.backHome")}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
