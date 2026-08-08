import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LifeBuoy } from "lucide-react";

import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export function Header({ variant = "app" }: { variant?: "app" | "public" }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <LifeBuoy className="size-5" aria-hidden="true" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">{t("appName")}</span>
        </Link>

        {variant === "app" ? (
          <nav className="ml-4 hidden items-center gap-1 text-sm font-medium sm:flex">
            <Link
              to="/dashboard"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
            >
              {t("nav.dashboard")}
            </Link>
            <Link
              to="/feed"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
            >
              {t("nav.feed")}
            </Link>
            <Link
              to="/admin"
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground"
            >
              {t("nav.admin")}
            </Link>
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <LanguageSelector />
          <Link
            to="/request"
            className="hidden rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 sm:inline-flex"
          >
            {t("nav.requestHelp")}
          </Link>
          {user ? (
            <button
              onClick={() => void supabase.auth.signOut()}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
            >
              {t("nav.signOut")}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
