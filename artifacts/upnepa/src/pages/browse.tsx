import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import {
  getGetZoneHistoryQueryKey,
  getGetZoneQueryKey,
  getListZonesQueryKey,
  useGetZone,
  useGetZoneHistory,
  useListZones,
} from '@workspace/api-client-react';
import { HistoryStrip } from '@/components/history-strip';
import { ZoneRow } from '@/components/zone-row';
import { SEED_HISTORY, SEED_ZONE, SEED_ZONES, formatMinutes, formatTime, statusLabel } from '@/lib/upnepa';

export default function BrowsePage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(SEED_ZONE.id);
  const [refreshLocked, setRefreshLocked] = useState(false);
  const params = useMemo(() => ({ search: search.trim() || undefined, limit: 50 }), [search]);
  const listQuery = useListZones(params, { query: { queryKey: getListZonesQueryKey(params), staleTime: 30000 } });
  const zoneQuery = useGetZone(selectedId, { query: { queryKey: getGetZoneQueryKey(selectedId), staleTime: 20000, refetchInterval: 30000 } });
  const historyQuery = useGetZoneHistory(selectedId, { query: { queryKey: getGetZoneHistoryQueryKey(selectedId), staleTime: 30000 } });

  const zones = useMemo(() => listQuery.data?.length ? listQuery.data : SEED_ZONES.filter((zone) => {
    const needle = search.toLowerCase().trim();
    return !needle || `${zone.name} ${zone.parentArea}`.toLowerCase().includes(needle);
  }), [listQuery.data, search]);
  const selected = zoneQuery.data ?? zones.find((zone) => zone.id === selectedId) ?? SEED_ZONE;
  const coverageRadius = zoneQuery.data?.radiusM;
  const history = historyQuery.data ?? SEED_HISTORY;

  async function refreshBrowse() {
    if (refreshLocked || listQuery.isFetching || zoneQuery.isFetching || historyQuery.isFetching) return;
    setRefreshLocked(true);
    await Promise.all([listQuery.refetch(), zoneQuery.refetch(), historyQuery.refetch()]);
    window.setTimeout(() => setRefreshLocked(false), 900);
  }

  useEffect(() => {
    if (zones.length && !zones.some((zone) => zone.id === selectedId)) setSelectedId(zones[0].id);
  }, [selectedId, zones]);

  return (
    <div className="md:ml-[210px]">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-label mb-3 text-[10px] text-[#eab308]">The wider picture</p>
            <h1 className="text-[34px] font-semibold leading-none tracking-[-0.065em] sm:text-[44px]">Browse zones</h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9f9fa0]">Scan the neighborhood before you set out. Signals are community-confirmed, not predictions.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="font-label flex items-center gap-2 text-[10px] text-[#6a6b6b]"><SlidersHorizontal size={13} /> {zones.length} zones in view</div>
            <button type="button" onClick={() => void refreshBrowse()} disabled={refreshLocked || listQuery.isFetching || zoneQuery.isFetching || historyQuery.isFetching} aria-label="Refresh browse zones" data-testid="button-refresh-browse" className="inline-flex min-h-9 items-center gap-2 rounded-[8px] border border-[#343737] px-3 font-label text-[9px] text-[#9f9fa0] transition-colors hover:border-[#777979] hover:text-[#f5f5f7] disabled:cursor-wait disabled:opacity-60">
              <RefreshCw size={13} className={refreshLocked || listQuery.isFetching || zoneQuery.isFetching || historyQuery.isFetching ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(270px,0.8fr)_minmax(0,1.2fr)]">
          <section>
            <label className="relative block">
              <span className="sr-only">Search zones</span>
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a6b6b]" size={17} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search area or zone"
                data-testid="input-search-zones"
                className="h-12 w-full rounded-[8px] border border-[#1f2122] bg-[#090a0b] pl-11 pr-4 text-sm text-[#f5f5f7] outline-none transition-colors placeholder:text-[#6a6b6b] focus:border-[#5b5f5f]"
              />
            </label>
            <div className="mt-3 overflow-hidden border border-[#282a2b]" data-testid="list-zones">
              {listQuery.isLoading ? (
                <div className="space-y-px bg-[#1c1d1e] p-3">
                  {[1, 2, 3, 4].map((item) => <div key={item} className="h-14 animate-pulse bg-[#242526]" />)}
                </div>
              ) : zones.length ? (
                zones.map((zone) => <ZoneRow key={zone.id} zone={zone} selected={zone.id === selectedId} onSelect={() => setSelectedId(zone.id)} />)
              ) : (
                <div className="bg-[#1c1d1e] px-5 py-10 text-center" data-testid="empty-zones">
                  <p className="text-sm text-[#f5f5f7]">No zones match that search.</p>
                  <p className="mt-1 text-xs text-[#6a6b6b]">Try a neighborhood or parent area.</p>
                </div>
              )}
            </div>
            {listQuery.isError && <p className="mt-3 flex items-center gap-2 text-xs text-[#facc15]" data-testid="error-zones"><AlertCircle size={14} /> Showing the last known neighborhood list.</p>}
          </section>

          <section className="min-w-0" data-testid="section-zone-detail">
            <div className="border border-[#282a2b] bg-[#1c1d1e]">
              <div className="border-b border-[#282a2b] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-label text-[9px] text-[#6a6b6b]">{selected.parentArea} / zone detail</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em]" data-testid="text-selected-zone">{selected.name}</h2>
                  </div>
                  <span className={`font-label rounded-full border px-2.5 py-1 text-[9px] ${selected.status === 'ON' ? 'border-[#245d36] text-[#4ade80]' : selected.status === 'OFF' ? 'border-[#6c2d32] text-[#f87171]' : 'border-[#66581e] text-[#facc15]'}`} data-testid="status-selected-zone">{statusLabel(selected.status)}</span>
                </div>
                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="border-l border-[#22c55e] pl-3"><span className="font-label block text-[9px] text-[#6a6b6b]">On</span><strong className="mt-1 block text-xl font-medium text-[#4ade80]">{selected.onCount}</strong></div>
                  <div className="border-l border-[#ef4444] pl-3"><span className="font-label block text-[9px] text-[#6a6b6b]">Off</span><strong className="mt-1 block text-xl font-medium text-[#f87171]">{selected.offCount}</strong></div>
                  <div className="border-l border-[#eab308] pl-3"><span className="font-label block text-[9px] text-[#6a6b6b]">Reports</span><strong className="mt-1 block text-xl font-medium text-[#facc15]">{selected.totalReports}</strong></div>
                </div>
              </div>
              <div className="grid gap-3 border-b border-[#282a2b] p-5 text-xs text-[#9f9fa0] sm:grid-cols-2 sm:p-6">
                <div><span className="font-label block text-[9px] text-[#6a6b6b]">Last confirmed</span><span className="mt-1 block text-[#f5f5f7]">{formatTime(selected.lastConfirmedAt)} · {formatMinutes(selected.minutesAgo).replace('Confirmed ', '')}</span></div>
                <div><span className="font-label block text-[9px] text-[#6a6b6b]">Coverage radius</span><span className="mt-1 block text-[#f5f5f7]">{coverageRadius ? `${Math.round(coverageRadius / 100) / 10} km` : 'Community mapped'}</span></div>
              </div>
              <div className="p-5 sm:p-6">
                <div className="mb-3 flex items-end justify-between"><div><p className="font-label text-[9px] text-[#6a6b6b]">Signal history</p><h3 className="mt-1 text-base font-medium">Recent confirmations</h3></div><span className="font-label text-[9px] text-[#6a6b6b]">5 points</span></div>
                {historyQuery.isLoading ? <div className="h-[148px] animate-pulse border border-[#282a2b] bg-[#171819]" /> : <HistoryStrip points={history} />}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}