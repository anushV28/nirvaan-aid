import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Loader2, Lock } from "lucide-react";

import { Header } from "./Header";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({
  children,
  admin = false,
}: {
  children: ReactNode;
  admin?: boolean;
}) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!user || (admin && !isAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-lg px-4 py-20 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
            <Lock className="size-6" aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">
            {admin && user ? "Admins only" : "Sign in to continue"}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {admin && user
              ? "This area is limited to Nirvaan administrators."
              : "This view is available to volunteers, organizations and admins. The live map stays open to everyone."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/auth/volunteer"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Volunteer login
            </Link>
            <Link
              to="/auth/ngo"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            >
              NGO login
            </Link>
            <Link
              to="/auth/admin"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            >
              Admin login
            </Link>
            <Link
              to="/dashboard"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold"
            >
              Live map
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
