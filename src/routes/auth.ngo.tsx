import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Crosshair, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { VADODARA } from "@/lib/nirvaan";

export const Route = createFileRoute("/auth/ngo")({
  head: () => ({
    meta: [
      { title: "Organization sign up — Nirvaan" },
      {
        name: "description",
        content:
          "Register your relief organization on Nirvaan, list your resources and coordinate flood response after admin approval.",
      },
      { property: "og:title", content: "Organization sign up — Nirvaan" },
      {
        property: "og:description",
        content: "Register your relief organization and coordinate flood response.",
      },
    ],
  }),
  component: NgoAuth,
});

function NgoAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [form, setForm] = useState({
    email: "",
    password: "",
    orgName: "",
    regNumber: "",
    area: "",
    resources: "",
    phone: "",
  });
  const [lat, setLat] = useState(VADODARA[0]);
  const [lng, setLng] = useState(VADODARA[1]);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const detect = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => toast.error("Could not detect location"),
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
        await navigate({ to: "/dashboard" });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Sign up failed");
      if (!data.session) {
        toast.success("Check your email to confirm your account, then log in.");
        setMode("login");
        return;
      }

      const { error: profileError } = await supabase.from("organizations").insert({
        id: userId,
        org_name: form.orgName.trim(),
        registration_number: form.regNumber.trim() || null,
        area_of_operation: form.area.trim() || null,
        resources_available: form.resources.trim() || null,
        contact_phone: form.phone.trim(),
        location_lat: lat,
        location_lng: lng,
        status: "pending_approval",
      });
      if (profileError) throw profileError;
      setPending(true);
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  if (pending) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="public" />
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">{t("auth.pendingTitle")}</h1>
          <p className="mt-3 text-muted-foreground">{t("auth.pendingBody")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="public" />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <Building2 className="size-7 text-primary" aria-hidden="true" />
          {t("auth.ngoTitle")}
        </h1>

        <div className="mt-5 inline-flex rounded-lg border border-border bg-card p-1">
          {(["signup", "login"] as const).map((value) => (
            <button
              key={value}
              onClick={() => setMode(value)}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {t(`auth.${value}`)}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("auth.email")}>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                className="nirvaan-input"
              />
            </Field>
            <Field label={t("auth.password")}>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={set("password")}
                className="nirvaan-input"
              />
            </Field>
          </div>

          {mode === "signup" ? (
            <>
              <Field label={t("auth.orgName")}>
                <input
                  required
                  value={form.orgName}
                  onChange={set("orgName")}
                  className="nirvaan-input"
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t("auth.regNumber")}>
                  <input
                    value={form.regNumber}
                    onChange={set("regNumber")}
                    className="nirvaan-input"
                  />
                </Field>
                <Field label={t("auth.phone")}>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={set("phone")}
                    className="nirvaan-input"
                  />
                </Field>
              </div>
              <Field label={t("auth.areaOfOperation")}>
                <input value={form.area} onChange={set("area")} className="nirvaan-input" />
              </Field>
              <Field label={t("auth.resources")}>
                <input
                  value={form.resources}
                  onChange={set("resources")}
                  placeholder="2 boats, 40 food kits, medical team"
                  className="nirvaan-input"
                />
              </Field>
              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-secondary p-3 text-sm">
                <span className="font-mono text-xs">
                  {lat.toFixed(4)}, {lng.toFixed(4)}
                </span>
                <button
                  type="button"
                  onClick={detect}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline"
                >
                  <Crosshair className="size-3.5" aria-hidden="true" />
                  {t("auth.detectLocation")}
                </button>
              </div>
            </>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-display text-base font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
            {mode === "login" ? t("auth.login") : t("auth.signup")}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
