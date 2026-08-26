import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Building2, HeartHandshake, MapPin, Radio, Siren } from "lucide-react";

import { Header } from "@/components/Header";
import { SosButton } from "@/components/SosButton";
import "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nirvaan — Disaster help finds you" },
      {
        name: "description",
        content:
          "Nirvaan connects people in need during floods and disasters with nearby volunteers, rescue teams and relief organizations in real time.",
      },
      { property: "og:title", content: "Nirvaan — Disaster help finds you" },
      {
        property: "og:description",
        content:
          "Report an emergency in seconds. AI triages it and nearby volunteers, teams and NGOs respond live on the map.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useTranslation();

  const steps = [
    { icon: MapPin, title: t("landing.step1Title"), body: t("landing.step1Body") },
    { icon: Radio, title: t("landing.step2Title"), body: t("landing.step2Body") },
    { icon: HeartHandshake, title: t("landing.step3Title"), body: t("landing.step3Body") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header variant="public" />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-primary text-primary-foreground">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, var(--accent) 0, transparent 45%), radial-gradient(circle at 80% 0%, white 0, transparent 40%)",
            }}
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
              <Siren className="size-3.5" aria-hidden="true" />
              {t("landing.badge")}
            </span>
            <h1 className="mt-6 max-w-3xl text-5xl font-extrabold leading-[0.95] sm:text-7xl">
              {t("appName")}
            </h1>
            <p className="mt-3 font-display text-2xl font-semibold text-accent sm:text-3xl">
              {t("tagline")}
            </p>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              {t("landing.intro")}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/request"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-4 font-display text-lg font-bold text-accent-foreground shadow-lg transition-transform hover:-translate-y-0.5"
              >
                <Siren className="size-5" aria-hidden="true" />
                {t("nav.requestHelp")}
              </Link>
              <Link
                to="/auth/volunteer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 px-6 py-4 font-medium transition-colors hover:bg-primary-foreground/10"
              >
                <HeartHandshake className="size-5" aria-hidden="true" />
                {t("nav.volunteer")}
              </Link>
              <Link
                to="/auth/ngo"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/40 px-6 py-4 font-medium transition-colors hover:bg-primary-foreground/10"
              >
                <Building2 className="size-5" aria-hidden="true" />
                {t("nav.ngo")}
              </Link>
            </div>

            <p className="mt-8 text-sm text-primary-foreground/70">
              {t("landing.emergencyNote")}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="font-display text-3xl font-bold">{t("landing.howTitle")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm"
              >
                <span className="grid size-10 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <step.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold">
                  {index + 1}. {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </article>
            ))}
          </div>

          <Link
            to="/dashboard"
            className="mt-10 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            {t("nav.dashboard")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </main>
      <SosButton />
    </div>
  );
}
