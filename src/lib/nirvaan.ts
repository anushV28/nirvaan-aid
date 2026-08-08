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
  location_lat: number;
  location_lng: number;
  created_at: string;
};

export const VADODARA: [number, number] = [22.3072, 73.1812];

export const URGENCY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const URGENCY_COLOR: Record<string, string> = {
  critical: "var(--critical)",
  high: "var(--high)",
  medium: "var(--medium)",
  low: "var(--low)",
};

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
