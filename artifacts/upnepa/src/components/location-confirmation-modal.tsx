import { useRef, useState } from 'react';
import { Check, LocateFixed, MapPin, Move, X } from 'lucide-react';
import { getNearestZone } from '@workspace/api-client-react';
import type { ReportInputStatus, ZoneDetail } from '@workspace/api-client-react';

export type Coordinates = { lat: number; lng: number };

type MapPickerProps = {
  value: Coordinates;
  onChange?: (value: Coordinates) => void;
  interactive?: boolean;
};

function MapPicker({ value, onChange, interactive = true }: MapPickerProps) {
  const [dragging, setDragging] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const originRef = useRef(value);

  function updateFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    if (!onChange || !mapRef.current) return;
    const bounds = mapRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
    onChange({
      lat: originRef.current.lat + (0.5 - y) * 0.06,
      lng: originRef.current.lng + (x - 0.5) * 0.08,
    });
  }

  const pinLeft = `${Math.max(8, Math.min(92, 50 + ((value.lng - originRef.current.lng) / 0.08) * 100))}%`;
  const pinTop = `${Math.max(8, Math.min(92, 50 - ((value.lat - originRef.current.lat) / 0.06) * 100))}%`;

  return (
    <div
      ref={mapRef}
      role={interactive ? 'application' : undefined}
      aria-label={interactive ? 'Location pin map' : 'Detected location map preview'}
      tabIndex={interactive ? 0 : undefined}
      onPointerDown={(event) => {
        if (!interactive) return;
        setDragging(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event);
      }}
      onPointerMove={(event) => {
        if (dragging) updateFromPointer(event);
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
      className={`relative h-[190px] overflow-hidden rounded-[12px] border border-[#343a36] bg-[#18251f] ${interactive ? 'cursor-crosshair touch-none' : ''}`}
    >
      <div className="absolute inset-0 opacity-70" style={{
        backgroundImage: 'linear-gradient(28deg, transparent 0 47%, rgba(91,145,111,.28) 48% 49%, transparent 50%), linear-gradient(118deg, transparent 0 42%, rgba(91,145,111,.2) 43% 44%, transparent 45%), repeating-linear-gradient(90deg, transparent 0 38px, rgba(116,155,122,.13) 39px 40px), repeating-linear-gradient(0deg, transparent 0 31px, rgba(116,155,122,.11) 32px 33px)',
      }} />
      <div className="absolute left-4 top-3 font-mono text-[9px] tracking-[0.18em] text-[#9ab5a0]">NEIGHBORHOOD GRID</div>
      <div className="absolute bottom-3 left-4 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] text-[#9ab5a0]">
        <Move size={11} /> {interactive ? 'TAP OR DRAG TO SET PIN' : 'DETECTED PIN'}
      </div>
      <div
        className={`absolute -translate-x-1/2 -translate-y-full transition-[left,top] duration-150 ${dragging ? 'scale-110' : ''}`}
        style={{ left: pinLeft, top: pinTop }}
      >
        <div className="grid h-10 w-10 place-items-center rounded-full border border-[#d7ffe0] bg-[#22c55e] text-[#0f1011] shadow-[0_0_0_7px_rgba(34,197,94,.16)]">
          <MapPin size={19} fill="currentColor" />
        </div>
      </div>
    </div>
  );
}

type LocationConfirmationModalProps = {
  open: boolean;
  zone: ZoneDetail;
  initialCoordinates: Coordinates;
  pendingStatus: ReportInputStatus | null;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (zone: ZoneDetail, coordinates: Coordinates) => Promise<void>;
};

export function LocationConfirmationModal({
  open,
  zone,
  initialCoordinates,
  pendingStatus,
  isSaving,
  onClose,
  onConfirm,
}: LocationConfirmationModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [pin, setPin] = useState(initialCoordinates);
  const [nearestZone, setNearestZone] = useState<ZoneDetail | null>(null);
  const [isMatching, setIsMatching] = useState(false);

  if (!open || !pendingStatus) return null;

  async function confirmPinnedLocation() {
    setIsMatching(true);
    try {
      const nearest = await getNearestZone({ lat: pin.lat, lng: pin.lng });
      setNearestZone(nearest);
      await onConfirm(nearest, pin);
    } catch {
      setNearestZone(null);
    } finally {
      setIsMatching(false);
    }
  }

  function resetAndClose() {
    if (isSaving) return;
    setStep(1);
    setPin(initialCoordinates);
    setNearestZone(null);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="location-confirmation-title">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[20px] border border-[#343737] bg-[#1c1d1e] p-5 shadow-2xl sm:rounded-[20px] sm:p-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="font-label mb-2 text-[10px] text-[#22c55e]">Location check</p>
            <h2 id="location-confirmation-title" className="text-[25px] font-semibold leading-tight tracking-[-0.05em] text-[#f5f5f7]">
              Is this you?
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#9f9fa0]">
              Confirm your zone once so reports stay useful without asking again on every tap.
            </p>
          </div>
          <button type="button" aria-label="Close location confirmation" onClick={resetAndClose} className="rounded-full p-2 text-[#9f9fa0] transition-colors hover:bg-[#2e2e2e] hover:text-[#f5f5f7]">
            <X size={18} />
          </button>
        </div>

        {step === 1 ? (
          <>
            <MapPicker value={initialCoordinates} interactive={false} />
            <div className="mt-5 rounded-[12px] border border-[#343737] bg-[#161718] p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 text-[#22c55e]"><LocateFixed size={18} /></span>
                <div>
                  <p className="font-label text-[10px] text-[#6a6b6b]">Detected zone</p>
                  <p className="mt-1 text-lg font-medium text-[#f5f5f7]">{zone.name}</p>
                  <p className="mt-1 text-xs text-[#9f9fa0]">{zone.parentArea} · near your current signal</p>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button type="button" disabled={isSaving} onClick={() => void onConfirm(zone, initialCoordinates)} className="min-h-12 rounded-[8px] bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-[#e7e7e7] disabled:cursor-wait disabled:opacity-60">
                {isSaving ? 'Saving location…' : "Yes, that's me"}
              </button>
              <button type="button" disabled={isSaving} onClick={() => setStep(2)} className="min-h-12 rounded-[8px] border border-[#777979] px-4 text-sm font-medium text-[#f5f5f7] transition-colors hover:bg-[#2e2e2e] disabled:opacity-60">
                No, let me set it
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="font-label text-[10px] text-[#6a6b6b]">Set your actual location</p>
              <p className="mt-1 text-sm text-[#9f9fa0]">Tap or drag the pin. We’ll match it to the nearest community zone.</p>
            </div>
            <MapPicker value={pin} onChange={setPin} />
            <div className="mt-4 rounded-[10px] border border-[#343737] bg-[#161718] px-4 py-3 text-xs text-[#9f9fa0]">
              {nearestZone ? <><span className="text-[#f5f5f7]">Closest zone:</span> {nearestZone.name}</> : 'The closest zone will appear after you place the pin.'}
            </div>
            {!nearestZone && !isMatching && <p className="mt-3 text-xs text-[#facc15]">We’ll match the pin when you confirm it.</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={isSaving || isMatching} onClick={() => setStep(1)} className="min-h-12 rounded-[8px] border border-[#777979] px-4 text-sm font-medium text-[#f5f5f7] transition-colors hover:bg-[#2e2e2e] disabled:opacity-60">
                Back
              </button>
              <button type="button" disabled={isSaving || isMatching} onClick={() => void confirmPinnedLocation()} className="min-h-12 flex-1 rounded-[8px] bg-white px-4 text-sm font-semibold text-black transition-colors hover:bg-[#e7e7e7] disabled:cursor-wait disabled:opacity-60">
                {isSaving || isMatching ? 'Matching location…' : `Confirm ${nearestZone?.name ?? 'this location'}`}
              </button>
            </div>
          </>
        )}
        <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#6a6b6b]">
          <Check size={12} className="text-[#22c55e]" /> Your report will be submitted after confirmation
        </div>
      </div>
    </div>
  );
}