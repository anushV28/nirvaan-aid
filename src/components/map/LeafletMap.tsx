import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  kind: "request" | "volunteer" | "group" | "ngo";
  color?: string | undefined;
  badge?: string | undefined;
  title?: string | undefined;
  pulsing?: boolean | undefined;
  onClick?: (() => void) | undefined;
};

export type MapLine = { id: string; from: [number, number]; to: [number, number] };

export type LeafletMapProps = {
  center: [number, number];
  zoom?: number | undefined;
  pins?: MapPin[] | undefined;
  lines?: MapLine[] | undefined;
  draggable?:
    | { lat: number; lng: number; onChange: (lat: number, lng: number) => void }
    | undefined;
  recenterTo?: [number, number] | null | undefined;
  className?: string | undefined;
};

function pinHtml(pin: MapPin) {
  const color = pin.color ?? "var(--primary)";
  if (pin.kind === "ngo") {
    return `<div style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);color:white;font:700 11px/1 system-ui">NGO</div>`;
  }
  if (pin.kind === "group") {
    return `<div style="position:relative;width:26px;height:26px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)">
      <span style="position:absolute;inset:0;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;color:white;font:700 10px/1 system-ui">${pin.badge ?? ""}</span>
    </div>`;
  }
  const size = pin.kind === "request" ? 20 : 16;
  const ring = pin.pulsing
    ? `<span style="position:absolute;inset:-6px;border-radius:999px;border:2px solid ${color};opacity:.5"></span>`
    : "";
  return `<div style="position:relative;display:flex;align-items:center;justify-content:center">
    ${ring}
    <span style="width:${size}px;height:${size}px;border-radius:999px;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35);display:block"></span>
  </div>`;
}

function makeIcon(pin: MapPin) {
  return L.divIcon({
    className: "nirvaan-pin",
    html: pinHtml(pin),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const dragIcon = L.divIcon({
  className: "nirvaan-pin",
  html: `<div style="position:relative;width:30px;height:40px">
    <div style="width:30px;height:30px;border-radius:50% 50% 50% 4px;transform:rotate(-45deg);background:var(--accent);border:3px solid white;box-shadow:0 4px 10px rgba(0,0,0,.4)"></div>
  </div>`,
  iconSize: [30, 40],
  iconAnchor: [15, 38],
});

function Recenter({ to }: { to: [number, number] | null | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (to) map.flyTo(to, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [to, map]);
  return null;
}

function ClickCapture({ onPick }: { onPick?: ((lat: number, lng: number) => void) | undefined }) {
  const map = useMap();
  useEffect(() => {
    if (!onPick) return;
    const handler = (e: L.LeafletMouseEvent) => onPick(e.latlng.lat, e.latlng.lng);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, [map, onPick]);
  return null;
}

export default function LeafletMap({
  center,
  zoom = 12,
  pins = [],
  lines = [],
  draggable,
  recenterTo,
  className,
}: LeafletMapProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const icons = useMemo(() => pins.map((pin) => ({ pin, icon: makeIcon(pin) })), [pins]);

  return (
    <div className={className ?? "h-full w-full"}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter to={recenterTo} />
        <ClickCapture
          onPick={draggable ? (lat, lng) => draggable.onChange(lat, lng) : undefined}
        />
        {icons.map(({ pin, icon }) => (
          <Marker
            key={pin.id}
            position={[pin.lat, pin.lng]}
            icon={icon}
            title={pin.title}
            {...(pin.onClick ? { eventHandlers: { click: pin.onClick } } : {})}
          />
        ))}
        {lines.map((line) => (
          <Polyline
            key={line.id}
            positions={[line.from, line.to]}
            pathOptions={{ color: "#f97316", weight: 3, dashArray: "6 8" }}
          />
        ))}
        {draggable ? (
          <Marker
            position={[draggable.lat, draggable.lng]}
            icon={dragIcon}
            draggable
            ref={(instance) => {
              markerRef.current = instance;
            }}
            eventHandlers={{
              dragend: () => {
                const pos = markerRef.current?.getLatLng();
                if (pos) draggable.onChange(pos.lat, pos.lng);
              },
            }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
