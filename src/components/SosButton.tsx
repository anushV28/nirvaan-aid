import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Loader2, MapPin, Siren, WifiOff, X } from "lucide-react";
import { toast } from "sonner";

import { VADODARA } from "@/lib/nirvaan";
import {
  SOS_EVENT,
  flushSosQueue,
  getPosition,
  readProfile,
  sendSos,
  writeProfile,
} from "@/lib/sos";

const HOLD_MS = 2000;

type Sent = { id: string | null; queued: boolean };

export function SosButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const raf = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    const profile = readProfile();
    setName(profile.name);
    setPhone(profile.phone);
  }, []);

  // Retry anything captured while offline.
  useEffect(() => {
    const flush = () => {
      void flushSosQueue().then((count) => {
        if (count > 0) toast.success(t("sos.queuedSent", { count }));
      });
    };
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [t]);

  const openPanel = useCallback(() => {
    setSent(null);
    setOpen(true);
    setLocating(true);
    void getPosition().then((pos) => {
      setCoords(pos ?? { lat: VADODARA[0], lng: VADODARA[1] });
      setLocating(false);
    });
  }, []);

  useEffect(() => {
    window.addEventListener(SOS_EVENT, openPanel);
    return () => window.removeEventListener(SOS_EVENT, openPanel);
  }, [openPanel]);

  const stopHold = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    startedAt.current = null;
    setProgress(0);
  };

  const fire = async () => {
    stopHold();
    if (sending) return;
    setSending(true);
    const point = coords ?? (await getPosition()) ?? { lat: VADODARA[0], lng: VADODARA[1] };
    const result = await sendSos({
      reporter_name: name.trim().slice(0, 100) || "SOS",
      reporter_phone: phone.trim().slice(0, 30) || "unknown",
      relationship: "self",
      location_lat: point.lat,
      location_lng: point.lng,
      landmark: null,
      description: `SOS — ${note.trim().slice(0, 500) || t("sos.defaultDescription")}`,
      category: "rescue",
      urgency: "critical",
      status: "pending",
    });
    writeProfile({ name: name.trim(), phone: phone.trim() });
    setSending(false);
    setSent(result.ok ? { id: result.id, queued: false } : { id: null, queued: true });
    if (navigator.vibrate) navigator.vibrate([80, 60, 80]);
  };

  const startHold = () => {
    if (sending || sent) return;
    startedAt.current = performance.now();
    const tick = () => {
      if (startedAt.current === null) return;
      const elapsed = performance.now() - startedAt.current;
      const pct = Math.min(1, elapsed / HOLD_MS);
      setProgress(pct);
      if (pct >= 1) {
        void fire();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => () => stopHold(), []);

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        aria-label={t("sos.button")}
        className="fixed bottom-5 right-5 z-40 grid size-16 place-items-center rounded-full bg-critical text-primary-foreground shadow-xl ring-4 ring-critical/25 transition-transform hover:scale-105 active:scale-95"
      >
        <span className="font-display text-base font-black tracking-tight">SOS</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-end bg-foreground/60 p-0 backdrop-blur-sm sm:place-items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("sos.title")}
            className="w-full max-w-md rounded-t-2xl border border-border bg-card p-6 shadow-2xl sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 font-display text-2xl font-bold">
                <Siren className="size-6 text-critical" aria-hidden="true" />
                {t("sos.title")}
              </h2>
              <button
                type="button"
                onClick={() => {
                  stopHold();
                  setOpen(false);
                }}
                aria-label={t("sos.close")}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            {sent ? (
              <div className="mt-6 text-center">
                {sent.queued ? (
                  <WifiOff className="mx-auto size-10 text-high" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mx-auto size-10 text-low" aria-hidden="true" />
                )}
                <p className="mt-3 font-display text-xl font-bold">
                  {sent.queued ? t("sos.queuedTitle") : t("sos.sentTitle")}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sent.queued ? t("sos.queuedBody") : t("sos.sentBody")}
                </p>
                {sent.id ? (
                  <p className="mt-4 rounded-lg bg-secondary px-4 py-3 font-mono text-sm font-bold">
                    {sent.id.slice(0, 8).toUpperCase()}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="mt-6 w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
                >
                  {t("sos.close")}
                </button>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-muted-foreground">{t("sos.subtitle")}</p>

                <div className="mt-4 space-y-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("sos.name")}
                    maxLength={100}
                    className="nirvaan-input"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t("sos.phone")}
                    type="tel"
                    maxLength={30}
                    className="nirvaan-input"
                  />
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("sos.notePlaceholder")}
                    maxLength={500}
                    className="nirvaan-input"
                  />
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {locating
                    ? t("sos.locating")
                    : coords
                      ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                      : t("sos.locationError")}
                </p>

                <button
                  type="button"
                  onPointerDown={startHold}
                  onPointerUp={stopHold}
                  onPointerLeave={stopHold}
                  onPointerCancel={stopHold}
                  disabled={sending}
                  className="relative mt-5 w-full touch-none overflow-hidden rounded-xl bg-critical px-6 py-5 font-display text-lg font-black text-primary-foreground disabled:opacity-70"
                >
                  <span
                    className="absolute inset-y-0 left-0 bg-foreground/25 transition-none"
                    style={{ width: `${progress * 100}%` }}
                    aria-hidden="true"
                  />
                  <span className="relative inline-flex items-center justify-center gap-2">
                    {sending ? (
                      <>
                        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                        {t("sos.sending")}
                      </>
                    ) : (
                      t("sos.hold")
                    )}
                  </span>
                </button>
                <p className="mt-3 text-center text-xs text-muted-foreground">{t("sos.note")}</p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
