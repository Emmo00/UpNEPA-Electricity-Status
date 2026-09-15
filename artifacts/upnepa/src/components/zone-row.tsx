import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { ZoneSummary } from '@workspace/api-client-react';
import { formatMinutes, statusLabel } from '@/lib/upnepa';

const statusText: Record<ZoneSummary['status'], string> = {
  ON: 'text-[#4ade80]',
  OFF: 'text-[#f87171]',
  MIXED: 'text-[#facc15]',
  STALE: 'text-[#facc15]',
  NONE: 'text-[#9f9fa0]',
};

export function ZoneRow({ zone, selected, onSelect }: { zone: ZoneSummary; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      data-testid={`row-zone-${zone.id}`}
      onClick={onSelect}
      className={`group flex w-full items-center justify-between gap-4 border-b border-[#282a2b] px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-[#232526] ${selected ? 'bg-[#232526]' : 'bg-[#1c1d1e]'}`}
    >
      <span className="min-w-0">
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${zone.status === 'ON' ? 'bg-[#22c55e]' : zone.status === 'OFF' ? 'bg-[#ef4444]' : zone.status === 'NONE' ? 'bg-[#6a6b6b]' : 'bg-[#eab308]'}`} />
          <span className="truncate text-[15px] font-medium text-[#f5f5f7]">{zone.name}</span>
        </span>
        <span className="mt-1 block truncate pl-4 text-xs text-[#6a6b6b]">{zone.parentArea}</span>
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="text-right">
          <span className={`block font-label text-[10px] ${statusText[zone.status]}`}>{statusLabel(zone.status)}</span>
          <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#6a6b6b]"><Clock3 size={11} />{formatMinutes(zone.minutesAgo).replace('Confirmed ', '')}</span>
        </span>
        <ArrowUpRight size={16} className={`text-[#6a6b6b] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${selected ? 'text-[#f5f5f7]' : ''}`} />
      </span>
    </button>
  );
}