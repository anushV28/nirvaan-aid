import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { HelpRequest, Organization, Volunteer } from "@/lib/nirvaan";

export function useLiveData(options?: { includePending?: boolean }) {
  const includePending = options?.includePending ?? false;
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [pendingOrganizations, setPendingOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      const [req, vol, org] = await Promise.all([
        supabase.from("requests").select("*").order("created_at", { ascending: false }),
        supabase.from("volunteers").select("*"),
        supabase.from("organizations").select("*").eq("approval_status", "approved"),
      ]);
      if (!active) return;
      if (req.data) setRequests(req.data as HelpRequest[]);
      if (vol.data) setVolunteers(vol.data as Volunteer[]);
      if (org.data) setOrganizations(org.data as Organization[]);
      if (includePending) {
        const pending = await supabase
          .from("organizations")
          .select("*")
          .eq("approval_status", "pending_approval");
        if (active && pending.data) setPendingOrganizations(pending.data as Organization[]);
      }
      setLoading(false);
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

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [includePending]);

  return { requests, volunteers, organizations, pendingOrganizations, loading };
}
