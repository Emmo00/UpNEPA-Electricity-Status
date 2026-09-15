import { Check, Clock3, Info, Power, TriangleAlert, ZapOff } from 'lucide-react';
import type { ZoneSummary } from '@workspace/api-client-react';
import { formatMinutes, statusLabel, statusTone } from '@/lib/upnepa';

type StatusTileProps = {
  zone: ZoneSummary;
  onReport: (status: 'ON' | 'OFF') => void;
  isPending: boolean;
  receiptMessage?: string;
};

const toneStyles: Record<string, string> = {
  'status-on': 'bg-[#163622] text-[#b8f5c8]',
  'status-off': 'bg-[#3e1d20] text-[#ffc3c5]',
  'status-mixed': 'bg-[#40371a] text-[#f6df8b]',
  'status-stale': 'bg-[#40371a] text-[#f6df8b]',
  'status-none': 'bg-[#292b2c] text-[#c8c9c9]',
};

function StatusIcon({ status }: { status: ZoneSummary['status'] }) {
  if (status === 'ON') return <Check size={22} strokeWidth={2.5} />;
  if (status === 'OFF') return <ZapOff size={22} strokeWidth={2.2} />;
  if (status === 'STALE') return <TriangleAlert size={22} strokeWidth={2.2} />;
  return <Info size={22} strokeWidth={2.2} />;
}

export function StatusTile({ zone, onReport, isPending, receiptMessage }: StatusTileProps) {
  const tone = statusTone(zone.status);
  const isStale = zone.isStale || zone.status === 'STALE';

  return (
    <section className="rise-in overflow-hidden rounded-[14px] border border-[#323536] bg-[#1c1d1e]" data-testid="card-current-status">
      <div className={`min-h-[235px] p-6 sm:min-h-[280px] sm:p-8 ${toneStyles[tone]}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-current/25 bg-black/10">
              <StatusIcon status={zone.status} />
            </span>
            <span className="font-label text-[10px] opacity-80">{isStale ? 'Needs a fresh check' : 'Current signal'}</span>
          </div>
          <span className="font-label text-[10px] opacity-70">{zone.totalReports} reports</span>
        </div>
        <div className="mt-14 sm:mt-16">
          <p className="font-label text-[11px] opacity-75">Zone status</p>
          <h2 className="mt-1 text-[42px] font-semibold leading-none tracking-[-0.075em] sm:text-[56px]" data-testid="status-current">
            {statusLabel(zone.status)}
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-medium opacity-85">
            <span>{zone.onCount} say on</span>
            <span>{zone.offCount} say off</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={13} />{formatMinutes(zone.minutesAgo)}</span>
          </div>
        </div>
      </div>
      <div className="border-t border-[#323536] bg-[#161718] p-4">
        <p className="font-label mb-3 text-[9px] text-[#6a6b6b]">What do you see right now?</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            data-testid="button-report-on"
            disabled={isPending}
            onClick={() => onReport('ON')}
            className="flex min-h-[64px] items-center justify-center gap-2 rounded-[10px] border border-[#245d36] bg-[#1b3f28] text-sm font-semibold text-[#b8f5c8] transition-transform hover:bg-[#245332] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
          >
            <Power size={18} /> {isPending ? 'Sending' : 'Power is ON'}
          </button>
          <button
            type="button"
            data-testid="button-report-off"
            disabled={isPending}
            onClick={() => onReport('OFF')}
            className="flex min-h-[64px] items-center justify-center gap-2 rounded-[10px] border border-[#6c2d32] bg-[#482126] text-sm font-semibold text-[#ffc3c5] transition-transform hover:bg-[#5b292f] active:scale-[0.98] disabled:cursor-wait disabled:opacity-50"
          >
            <ZapOff size={18} /> {isPending ? 'Sending' : 'Power is OFF'}
          </button>
        </div>
        {receiptMessage && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[#b8f5c8]" data-testid="text-report-receipt">
            <Check size={14} /> {receiptMessage}
          </p>
        )}
      </div>
    </section>
  );
}