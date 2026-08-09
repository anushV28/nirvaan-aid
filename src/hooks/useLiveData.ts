import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { HelpRequest, Organization, Volunteer } from "@/lib/nirvaan";

const CACHE_KEY = "nirvaan.offline.data.v1";

type Cache = {
  requests: HelpRequest[];
  volunteers: Volunteer[];
  organizations: Organization[];
  pendingOrganizations: Organization[];
};

function readCache(): Cache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : null;
  } catch {
    return null;
  }
}

function writeCache(value: Cache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // storage full or unavailable — the offline cache is best effort
  }
}

export function useLiveData(options?: { includePending?: boolean }) {
  const includePending = options?.includePending ?? false;
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let active = true;
    let pendingCache: Organization[] = [];

    // Instant paint from the last known snapshot so the app works with no network.
    const cached = readCache();
    if (cached) {
      setRequests(cached.requests ?? []);
      setVolunteers(cached.volunteers ?? []);
      setOrganizations(cached.organizations ?? []);
      setPendingOrganizations(cached.pendingOrganizations ?? []);
      pendingCache = cached.pendingOrganizations ?? [];
      setLoading(false);
    }

    const load = async () => {
      try {
        const [req, vol, org] = await Promise.all([
          supabase.from("requests").select("*").order("created_at", { ascending: false }),
          supabase.from("volunteers").select("*"),
          supabase.from("organizations").select("*").eq("approval_status", "approved"),
        ]);
        if (!active) return;
        if (req.error || vol.error || org.error) throw req.error ?? vol.error ?? org.error;

        const nextRequests = (req.data ?? []) as HelpRequest[];
        const nextVolunteers = (vol.data ?? []) as Volunteer[];
        const nextOrgs = (org.data ?? []) as Organization[];
        setRequests(nextRequests);
        setVolunteers(nextVolunteers);
        setOrganizations(nextOrgs);

        if (includePending) {
          const pending = await supabase
            .from("organizations")
            .select("*")
            .eq("approval_status", "pending_approval");
          if (!active) return;
          pendingCache = (pending.data ?? []) as Organization[];
          setPendingOrganizations(pendingCache);
        }

        setOffline(false);
        writeCache({
          requests: nextRequests,
          volunteers: nextVolunteers,
          organizations: nextOrgs,
          pendingOrganizations: pendingCache,
        });
      } catch {
        if (active) setOffline(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();

    const channel = supabase
      .channel("nirvaan-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "requests" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "volunteers" }, () => {
        void load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "organizations" }, () => {
        void load();
      })
      .subscribe();

    const onOnline = () => void load();
    window.addEventListener("online", onOnline);

    return () => {
      active = false;
      window.removeEventListener("online", onOnline);
      void supabase.removeChannel(channel);
    };
  }, [includePending]);

  return { requests, volunteers, organizations, pendingOrganizations, loading, offline };
}
