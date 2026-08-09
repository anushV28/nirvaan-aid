import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount } from "@/lib/admin-account.functions";

export const Route = createFileRoute("/auth/admin")({
  head: () => ({
    meta: [
      { title: "Admin sign in — Nirvaan" },
      {
        name: "description",
        content:
          "Administrator sign in for Nirvaan: approve relief organizations and oversee live disaster response.",
      },
      { property: "og:title", content: "Admin sign in — Nirvaan" },
      {
        property: "og:description",
        content: "Administrator sign in for the Nirvaan disaster coordination platform.",
      },
    ],
  }),
  component: AdminAuth,
});

function AdminAuth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("ajinkya.pandit07@gmail.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      try {
        await ensureAdminAccount();
      } catch {
        // Offline or already provisioned — sign in with whatever exists.
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await navigate({ to: "/admin" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header variant="public" />
      <main className="mx-auto max-w-md px-4 py-14">
        <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-muted-foreground">
          Approve or reject relief organizations and monitor every live request.
        </p>

        <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-4">
          <div>
            <label htmlFor="admin-email" className="text-sm font-semibold">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="nirvaan-input mt-1"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="text-sm font-semibold">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="nirvaan-input mt-1"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-display font-bold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
            Sign in
          </button>
        </form>
      </main>
    </div>
  );
}
