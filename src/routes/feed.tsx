import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Header } from "@/components/Header";
import { useLiveData } from "@/hooks/useLiveData";
import { URGENCY_COLOR, URGENCY_ORDER, timeAgo } from "@/lib/nirvaan";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Request feed — Nirvaan" },
      {
        name: "description",
        content:
          "Filterable list of every open and resolved help request, sorted by urgency, category and status.",
      },
      { property: "og:title", content: "Request feed — Nirvaan" },
      {
        property: "og:description",
        content: "Filterable list of every help request, sorted by urgency.",
      },
    ],
  }),
  component: Feed,
});

const CATEGORIES = ["medical", "food", "shelter", "rescue", "general"] as const;
const STATUSES = ["pending", "assigned", "en_route", "resolved"] as const;
const URGENCIES = ["critical", "high", "medium", "low"] as const;

function Feed() {
  const { t } = useTranslation();
  const { requests } = useLiveData();
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [urgency, setUrgency] = useState("all");

  const rows = useMemo(
    () =>
      requests
        .filter((request) => category === "all" || request.category === category)
        .filter((request) => status === "all" || request.status === status)
        .filter((request) => urgency === "all" || request.urgency === urgency)
        .sort(
          (a, b) =>
            (URGENCY_ORDER[a.urgency] ?? 9) - (URGENCY_ORDER[b.urgency] ?? 9) ||
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
    [requests, category, status, urgency],
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">{t("feed.title")}</h1>

        <div className="mt-5 flex flex-wrap gap-3">
          <Select
            label={t("feed.filterUrgency")}
            value={urgency}
            onChange={setUrgency}
            options={[
              { value: "all", label: t("feed.all") },
              ...URGENCIES.map((value) => ({ value, label: t(`urgency.${value}`) })),
            ]}
          />
          <Select
            label={t("feed.filterCategory")}
            value={category}
            onChange={setCategory}
            options={[
              { value: "all", label: t("feed.all") },
              ...CATEGORIES.map((value) => ({ value, label: t(`category.${value}`) })),
            ]}
          />
          <Select
            label={t("feed.filterStatus")}
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: t("feed.all") },
              ...STATUSES.map((value) => ({ value, label: t(`status.${value}`) })),
            ]}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{t("confirm.urgency")}</th>
                <th className="px-4 py-3">{t("confirm.category")}</th>
                <th className="px-4 py-3">{t("form.description")}</th>
                <th className="px-4 py-3">{t("feed.filterStatus")}</th>
                <th className="px-4 py-3">{t("feed.when")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    {t("feed.empty")}
                  </td>
                </tr>
              ) : null}
              {rows.map((request) => (
                <tr key={request.id} className="border-t border-border align-top">
                  <td className="px-4 py-3">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
                      style={{ background: URGENCY_COLOR[request.urgency] }}
                    >
                      {t(`urgency.${request.urgency}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{t(`category.${request.category}`)}</td>
                  <td className="max-w-md px-4 py-3">
                    <p className="line-clamp-2">{request.description}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {request.landmark ?? "—"} · {request.reporter_name}
                    </p>
                  </td>
                  <td className="px-4 py-3">{t(`status.${request.status}`)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {timeAgo(request.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Link to="/dashboard" className="mt-6 inline-block font-semibold text-primary hover:underline">
          {t("nav.dashboard")} →
        </Link>
      </main>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-semibold">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="nirvaan-input min-w-40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
