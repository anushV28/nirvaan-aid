import { supabase } from "@/integrations/supabase/client";

const PROFILE_KEY = "nirvaan.sos.profile.v1";
const QUEUE_KEY = "nirvaan.sos.queue.v1";

export type SosProfile = { name: string; phone: string };

export type SosPayload = {
  reporter_name: string;
  reporter_phone: string;
  relationship: string;
  location_lat: number;
  location_lng: number;
  landmark: string | null;
  description: string;
  category: string;
  urgency: string;
  status: string;
};

export function readProfile(): SosProfile {
  if (typeof window === "undefined") return { name: "", phone: "" };
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as SosProfile) : { name: "", phone: "" };
  } catch {
    return { name: "", phone: "" };
  }
}

export function writeProfile(profile: SosProfile) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // best effort
  }
}

function readQueue(): SosPayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SosPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: SosPayload[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // best effort
  }
}

export function queuedCount(): number {
  return readQueue().length;
}

/** Resolve the device position, falling back to null when denied/unavailable. */
export function getPosition(timeoutMs = 8000): Promise<{ lat: number; lng: number } | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
  return new Promise((resolve) => {
    let settled = false;
    const done = (value: { lat: number; lng: number } | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer);
        done({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timer);
        done(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

/** Send an SOS. Falls back to a local queue when the network is unavailable. */
export async function sendSos(
  payload: SosPayload,
): Promise<{ ok: true; id: string } | { ok: false; queued: true }> {
  try {
    const { data, error } = await supabase
      .from("requests")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return { ok: true, id: (data as { id: string }).id };
  } catch {
    writeQueue([...readQueue(), payload]);
    return { ok: false, queued: true };
  }
}

/** Flush any SOS messages that were captured while offline. */
export async function flushSosQueue(): Promise<number> {
  const queue = readQueue();
  if (queue.length === 0) return 0;
  const remaining: SosPayload[] = [];
  let sent = 0;
  for (const item of queue) {
    const { error } = await supabase.from("requests").insert(item);
    if (error) remaining.push(item);
    else sent += 1;
  }
  writeQueue(remaining);
  return sent;
}

export const SOS_EVENT = "nirvaan:sos";

export function openSos() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SOS_EVENT));
}
