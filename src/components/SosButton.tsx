import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Siren, X } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { VADODARA } from "@/lib/nirvaan";

function getPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("no geolocation"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

export function SosButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const send = async () => {
    if (!phone.trim()) {
      toast.error(t("sos.phoneRequired"));
      return;
    }
    setSending(true);
    setStatus(t("sos.locating"));
    let lat = VADODARA[0];
    let lng = VADODARA[1];
    try {
      const pos = await getPosition();
      lat = pos.lat;
      lng = pos.lng;
    } catch {
      toast.warning(t("sos.locationError"));
    }
    setStatus(t("sos.sending"));
    const { error } = await supabase.from("requests").insert({
      reporter_name: t("sos.badge"),
      reporter_phone: phone.trim(),
      relationship: "self",
      location_lat: lat,
      location_lng: lng,
      description: note.trim() || t("sos.title"),
      category: "rescue",
      urgency: "critical",
      is_sos: true,
      status: "pending",
    });
    setSending(false);
    setStatus(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t("sos.sent"));
    setOpen(false);
    setNote("");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("sos.title")}
        className="fixed bottom-5 right-5 z-[1000] inline-flex items-center gap-2 rounded-full bg-sos px-5 py-4 font-display text-base font-bold text-white shadow-2xl ring-4 ring-critical/40 transition-transform hover:-translate-y-0.5"
      >
        <Siren className="size-5 animate-pulse" aria-hidden="true" />
        {t("sos.button")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[1001] grid place-items-center bg-foreground/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold text-critical">
                  {t("sos.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{t("sos.subtitle")}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={t("sos.cancel")}
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label className="mt-4 block text-sm font-semibold" htmlFor="sos-phone">
              {t("sos.phone")}
            </label>
            <input
              id="sos-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base"
            />

            <label className="mt-3 block text-sm font-semibold" htmlFor="sos-note">
              {t("sos.note")}
            </label>
            <textarea
              id="sos-note"
              rows={3}
              value={note}
              placeholder={t("sos.notePlaceholder")}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base"
            />

            {status ? <p className="mt-2 text-xs text-muted-foreground">{status}</p> : null}

            <button
              disabled={sending}
              onClick={() => void send()}
              className="mt-4 w-full rounded-lg bg-critical px-4 py-3 font-display text-lg font-bold text-white disabled:opacity-60"
            >
              {sending ? t("sos.sending") : t("sos.send")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
