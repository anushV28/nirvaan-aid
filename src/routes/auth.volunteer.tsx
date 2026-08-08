import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Crosshair, HeartHandshake, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { VADODARA } from "@/lib/nirvaan";

export const Route = createFileRoute("/auth/volunteer")({
  head: () => ({
    meta: [
      { title: "Volunteer sign up — Nirvaan" },
      {
        name: "description",
        content:
          "Join Nirvaan as an individual volunteer or a rescue team and get matched to nearby emergency requests.",
      },
      { property: "og:title", content: "Volunteer sign up — Nirvaan" },
      {
        property: "og:description",
        content: "Join as an individual volunteer or rescue team and respond to nearby requests.",
      },
    ],
  }),
  component: VolunteerAuth,
});

const SKILLS = ["medical", "general", "boat", "rescue"] as const;

function VolunteerAuth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [signupType, setSignupType] = useState<"individual" | "group">("individual");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [memberCount, setMemberCount] = useState("5");
  const [skills, setSkills] = useState<string[]>(["general"]);
  const [available, setAvailable] = useState(true);
  const [lat, setLat] = useState(VADODARA[0]);
  const [lng, setLng] = useState(VADODARA[1]);
  const [busy, setBusy] = useState(false);

  const detect = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        toast.success("Location updated");
      },
      () => toast.error("Could not detect location"),
    );
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: "/dashboard" });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
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

      const { error: profileError } = await supabase.from("volunteers").insert({
        id: userId,
        signup_type: signupType,
        name: name.trim(),
        contact_phone: phone.trim(),
        member_count: signupType === "group" ? Number(memberCount) || 1 : null,
        skills,
        location_lat: lat,
        location_lng: lng,
        status: available ? "available" : "busy",
      });
      if (profileError) throw profileError;
      await navigate({ to: "/dashboard" });
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header variant="public" />
      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold">
          <HeartHandshake className="size-7 text-primary" aria-hidden="true" />
          {t("auth.volunteerTitle")}
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
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">{t("auth.email")}</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="nirvaan-input"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold">{t("auth.password")}</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="nirvaan-input"
              />
            </label>
          </div>

          {mode === "signup" ? (
            <>
              <div className="inline-flex rounded-lg border border-border bg-card p-1">
                {(["individual", "group"] as const).map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() => setSignupType(value)}
                    className={`rounded-md px-4 py-1.5 text-sm font-semibold ${
                      signupType === value
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {t(`auth.${value}`)}
                  </button>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    {signupType === "group" ? t("auth.groupName") : t("auth.name")}
                  </span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="nirvaan-input"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">{t("auth.phone")}</span>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="nirvaan-input"
                  />
                </label>
              </div>

              {signupType === "group" ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold">
                    {t("auth.memberCount")}
                  </span>
                  <input
                    type="number"
                    min={2}
                    value={memberCount}
                    onChange={(e) => setMemberCount(e.target.value)}
                    className="nirvaan-input"
                  />
                </label>
              ) : null}

              <fieldset>
                <legend className="mb-1.5 text-sm font-semibold">{t("auth.skills")}</legend>
                <div className="flex flex-wrap gap-2">
                  {SKILLS.map((skill) => {
                    const active = skills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() =>
                          setSkills((prev) =>
                            active ? prev.filter((s) => s !== skill) : [...prev, skill],
                          )
                        }
                        className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                      >
                        {t(`auth.skill${skill.charAt(0).toUpperCase()}${skill.slice(1)}`)}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

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
                <label className="ml-auto inline-flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                  />
                  {t("auth.availability")}
                </label>
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
