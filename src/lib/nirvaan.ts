export type Urgency = "critical" | "high" | "medium" | "low";
export type Category = "medical" | "food" | "shelter" | "rescue" | "general";
export type RequestStatus = "pending" | "assigned" | "en_route" | "resolved";

export type HelpRequest = {
  id: string;
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
  is_sos: boolean;
  assigned_responder_id: string | null;
  assigned_responder_type: string | null;
  created_at: string;
  updated_at: string;
};

export type Volunteer = {
  id: string;
  signup_type: string;
  name: string;
  contact_phone: string;
  member_count: number | null;
  skills: string[];
  location_lat: number;
  location_lng: number;
  status: string;
  last_active: string;
};

export type Organization = {
  id: string;
  org_name: string;
  registration_number: string | null;
  contact_person: string;
  contact_phone: string;
  email: string;
  area_of_operation: string | null;
  resources_available: string | null;
  approval_status: string;
  website: string | null;
  verification_status: string;
  verification_score: number | null;
  verification_notes: string | null;
  verified_at: string | null;
  location_lat: number;
  location_lng: number;
  created_at: string;
};

export type ZoneAllocation = {
  id: string;
  org_id: string;
  area_name: string;
  center_lat: number;
  center_lng: number;
  radius_km: number;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
};

export const VADODARA: [number, number] = [22.3072, 73.1812];

export const URGENCY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/** Critical = red, high = orange, medium = yellow, low = pale yellow. */
export const URGENCY_COLOR: Record<string, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};

export const PIN_COLOR = {
  sos: "var(--sos)",
  volunteer: "var(--volunteer)",
  volunteerBusy: "var(--muted-foreground)",
  group: "var(--group)",
  ngo: "var(--ngo)",
} as const;

export function requestPinColor(request: Pick<HelpRequest, "is_sos" | "urgency">): string {
  if (request.is_sos) return PIN_COLOR.sos;
  return URGENCY_COLOR[request.urgency] ?? URGENCY_COLOR["medium"]!;
}

export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** The single organization responsible for a request's area + category + urgency. */
export function zoneForRequest(
  zones: ZoneAllocation[],
  request: Pick<HelpRequest, "location_lat" | "location_lng" | "category" | "urgency">,
): ZoneAllocation | null {
  const matches = zones.filter(
    (zone) =>
      zone.status === "active" &&
      (zone.category === "any" || zone.category === request.category) &&
      (zone.urgency === "any" || zone.urgency === request.urgency) &&
      distanceKm(
        { lat: zone.center_lat, lng: zone.center_lng },
        { lat: request.location_lat, lng: request.location_lng },
      ) <= zone.radius_km,
  );
  if (matches.length === 0) return null;
  // Prefer the most specific allocation.
  return (
    matches.sort((a, b) => {
      const specificity = (z: ZoneAllocation) =>
        (z.category === "any" ? 0 : 1) + (z.urgency === "any" ? 0 : 1);
      return specificity(b) - specificity(a) || a.radius_km - b.radius_km;
    })[0] ?? null
  );
}
