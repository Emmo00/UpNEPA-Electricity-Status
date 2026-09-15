import { Activity } from 'lucide-react';
import type { HistoryPoint } from '@workspace/api-client-react';
import { statusLabel } from '@/lib/upnepa';

export function HistoryStrip({ points }: { points: HistoryPoint[] }) {
  const visible = [...points].slice(0, 5);
  if (!visible.length) {
    return (
      <div className="flex min-h-[116px] items-center justify-center border border-dashed border-[#353738] bg-[#171819] px-5 text-center text-sm text-[#6a6b6b]" data-testid="empty-history">
        No confirmations in this zone yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-1 border border-[#282a2b] bg-[#171819] p-3" data-testid="chart-zone-history">
      {visible.map((point, index) => {
        const total = point.onCount + point.offCount;
        const onRatio = total ? Math.round((point.onCount / total) * 100) : 0;
        const isOn = point.status === 'ON';
        const isOff = point.status === 'OFF';
        return (
          <div className="min-w-0 px-1 py-2" key={`${point.at}-${index}`}>
            <div className="flex h-[62px] items-end justify-center gap-1.5">
              <span className="w-2 rounded-t-sm bg-[#22c55e]/80 transition-all" style={{ height: `${Math.max(8, onRatio)}%` }} />
              <span className="w-2 rounded-t-sm bg-[#ef4444]/75 transition-all" style={{ height: `${Math.max(8, 100 - onRatio)}%` }} />
            </div>
            <p className={`mt-2 truncate text-center font-label text-[8px] ${isOn ? 'text-[#4ade80]' : isOff ? 'text-[#f87171]' : 'text-[#facc15]'}`}>{statusLabel(point.status)}</p>
          </div>
        );
      })}
      <div className="col-span-5 mt-1 flex items-center justify-center gap-4 border-t border-[#282a2b] pt-2 font-label text-[8px] text-[#6a6b6b]">
        <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />On share</span>
        <span className="inline-flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#ef4444]" />Off share</span>
        <Activity size={11} />
      </div>
    </div>
  );
}