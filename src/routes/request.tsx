import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle2, Crosshair, Loader2, Siren } from "lucide-react";

import { Header } from "@/components/Header";
import { MapView } from "@/components/map/MapView";
import { supabase } from "@/integrations/supabase/client";
import { classifyRequest } from "@/lib/classify.functions";
import { VADODARA } from "@/lib/nirvaan";

export const Route = createFileRoute("/request")({
  head: () => ({
    meta: [
      { title: "Request emergency help — Nirvaan" },
      {
        name: "description",
        content:
          "Drop a pin, describe the situation, and nearby volunteers, rescue teams and NGOs are alerted instantly. No account needed.",
      },
      { property: "og:title", content: "Request emergency help — Nirvaan" },
      {
        property: "og:description",
        content:
          "Drop a pin, describe the situation, and nearby responders are alerted instantly. No account needed.",
      },
    ],
  }),
  component: RequestPage,
});

type Result = { id: string; category: string; urgency: string };

function RequestPage() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("self");
  const [landmark, setLandmark] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState(VADODARA[0]);
  const [lng, setLng] = useState(VADODARA[1]);
  const [recenter, setRecenter] = useState<[number, number] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  const relationships = useMemo(
    () => [
      { value: "self", label: t("form.relationshipSelf") },
      { value: "relative", label: t("form.relationshipRelative") },
      { value: "neighbour", label: t("form.relationshipNeighbour") },
      { value: "other", label: t("form.relationshipOther") },
    ],
    [t],
  );

  useEffect(() => {
    document.documentElement.scrollTo({ top: 0 });
  }, [result]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      setRecenter([pos.coords.latitude, pos.coords.longitude]);
    });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim() || !phone.trim() || description.trim().length < 3) {
      setError(t("form.required"));
      return;
    }
    setSubmitting(true);
    try {
      let category = "general";
      let urgency = "medium";
      try {
        const classification = await classifyRequest({
          data: { description: description.trim() },
        });
        category = classification.category;
        urgency = classification.urgency;
      } catch (classifyError) {
        console.error("classification failed", classifyError);
      }

      const { data, error: insertError } = await supabase
        .from("requests")
        .insert({
          reporter_name: name.trim().slice(0, 100),
          reporter_phone: phone.trim().slice(0, 30),
          relationship,
          location_lat: lat,
          location_lng: lng,
          landmark: landmark.trim().slice(0, 300) || null,
          description: description.trim().slice(0, 2000),
          category,
          urgency,
          status: "pending",
        })
        .select("id, category, urgency")
        .single();

      if (insertError) throw insertError;
      setResult(data as Result);
    } catch (submitError) {
      console.error(submitError);
      setError(
        submitError instanceof Error ? submitError.message : t("form.errorTitle"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="public" />
        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto size-12 text-low" aria-hidden="true" />
            <h1 className="mt-4 font-display text-3xl font-bold">{t("confirm.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("confirm.body")}</p>

            <div className="mt-8 rounded-xl bg-secondary p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t("confirm.trackingId")}
              </p>
              <p className="mt-1 break-all font-mono text-lg font-bold">
                {result.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                {result.id}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("confirm.category")}
                </p>
                <p className="font-semibold">{t(`category.${result.category}`)}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("confirm.urgency")}
                </p>
                <p className="font-semibold">{t(`urgency.${result.urgency}`)}</p>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">{t("confirm.keepId")}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  setDescription("");
                  setLandmark("");
                }}
                className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground"
              >
                {t("confirm.another")}
              </button>
              <Link
                to="/"
                className="rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-muted"
              >
                {t("confirm.home")}
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="public" />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t("confirm.home")}
        </Link>

        <h1 className="mt-4 flex items-center gap-2 font-display text-3xl font-bold">
          <Siren className="size-7 text-accent" aria-hidden="true" />
          {t("form.title")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("form.subtitle")}</p>

        {/* EMERGENCY CALL BUTTON */}
<div className="mt-5 flex justify-center">
  <a
    href="tel:112"
    aria-label="Call emergency services at 112"
    className="flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-2xl font-extrabold text-white shadow-lg transition-all hover:scale-105 hover:bg-red-700 active:scale-95"
  >
    SOS
  </a>
</div>

<p className="mt-2 text-center text-sm text-muted-foreground">
  Tap SOS to call 112
</p>

        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("form.reporterName")}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="nirvaan-input"
              />
            </Field>
            <Field label={t("form.reporterPhone")}>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                type="tel"
                maxLength={30}
                required
                className="nirvaan-input"
              />
            </Field>
          </div>

          <Field label={t("form.relationship")}>
            <div className="flex flex-wrap gap-2">
              {relationships.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setRelationship(option.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    relationship === option.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={t("form.location")} hint={t("form.locationHelp")}>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="h-72">
                <MapView
                  center={VADODARA}
                  zoom={13}
                  recenterTo={recenter}
                  draggable={{
                    lat,
                    lng,
                    onChange: (nextLat, nextLng) => {
                      setLat(nextLat);
                      setLng(nextLng);
                    },
                  }}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 bg-secondary px-3 py-2 text-xs">
                <span className="font-mono">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <Crosshair className="size-3.5" aria-hidden="true" />
                  {t("form.useMyLocation")}
                </button>
              </div>
            </div>
          </Field>

          <Field label={t("form.landmark")}>
            <input
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder={t("form.landmarkPlaceholder")}
              maxLength={300}
              className="nirvaan-input"
            />
          </Field>

          <Field label={t("form.description")}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.descriptionPlaceholder")}
              rows={5}
              maxLength={2000}
              required
              className="nirvaan-input resize-y"
            />
          </Field>

          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-4 font-display text-lg font-bold text-accent-foreground disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                {t("form.submitting")}
              </>
            ) : (
              t("form.submit")
            )}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {hint ? <span className="mb-2 block text-xs text-muted-foreground">{hint}</span> : null}
      {children}
    </label>
  );
}
