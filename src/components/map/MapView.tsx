import { Suspense, lazy, useEffect, useState } from "react";

import type { LeafletMapProps } from "./LeafletMap";

const LeafletMap = lazy(() => import("./LeafletMap"));

function MapSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div
      className={`${className ?? "h-full w-full"} animate-pulse bg-muted`}
      aria-hidden="true"
    />
  );
}

export function MapView(props: LeafletMapProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <MapSkeleton className={props.className} />;
  return (
    <Suspense fallback={<MapSkeleton className={props.className} />}>
      <LeafletMap {...props} />
    </Suspense>
  );
}
