import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, LocateFixed, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetZoneHistoryQueryKey,
  getGetZoneQueryKey,
  getGetProfileQueryKey,
  getGetNearestZoneQueryKey,
  getListZonesQueryKey,
  useCreateReport,
  useConfirmLocation,
  useGetZone,
  useGetNearestZone,
  useGetProfile,
  useGetZoneHistory,
  useListZones,
} from '@workspace/api-client-react';
import type { ReportInputStatus } from '@workspace/api-client-react';
import { HistoryStrip } from '@/components/history-strip';
import { LocationConfirmationModal, type Coordinates } from '@/components/location-confirmation-modal';
import { StatusTile } from '@/components/status-tile';
import { SEED_HISTORY, SEED_ZONE, getDeviceId } from '@/lib/upnepa';

export default function HomePage() {
  const queryClient = useQueryClient();
  const deviceId = useMemo(() => getDeviceId(), []);
  const [zoneId, setZoneId] = useState(SEED_ZONE.id);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState('Using a seeded zone nearby');
  const [receiptMessage, setReceiptMessage] = useState('');
  const [pendingReport, setPendingReport] = useState<ReportInputStatus | null>(null);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [confirmedLocation, setConfirmedLocation] = useState<{ zoneId: number; coordinates: Coordinates } | null>(null);

  const zonesQuery = useListZones(undefined, { query: { queryKey: getListZonesQueryKey(), staleTime: 30000 } });
  const zoneQuery = useGetZone(zoneId, {
    query: { queryKey: getGetZoneQueryKey(zoneId), staleTime: 20000, refetchInterval: 30000 },
  });
  const historyQuery = useGetZoneHistory(zoneId, {
    query: { queryKey: getGetZoneHistoryQueryKey(zoneId), staleTime: 30000 },
  });
  const profileQuery = useGetProfile(deviceId, {
    query: { queryKey: getGetProfileQueryKey(deviceId), staleTime: 30000 },
  });
  const nearestParams = useMemo(() => coordinates ?? { lat: SEED_ZONE.centerLat, lng: SEED_ZONE.centerLng }, [coordinates]);
  const nearestQuery = useGetNearestZone(nearestParams, {
    query: {
      queryKey: getGetNearestZoneQueryKey(nearestParams),
      enabled: coordinates !== null,
      staleTime: 60000,
    },
  });
  const createReport = useCreateReport();
  const confirmLocation = useConfirmLocation();

  const firstZoneId = zonesQuery.data?.[0]?.id;
  useEffect(() => {
    if (firstZoneId) setZoneId(firstZoneId);
  }, [firstZoneId]);

  useEffect(() => {
    if (!nearestQuery.data || locationModalOpen) return;
    setZoneId(nearestQuery.data.id);
    setLocationLabel(`Detected near ${nearestQuery.data.name}`);
  }, [locationModalOpen, nearestQuery.data]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationLabel('Location available · matched to nearby zone');
      },
      () => setLocationLabel('Location off · showing the seeded neighborhood'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
    );
  }, []);

  const zone = zoneQuery.data ?? (zonesQuery.data?.find((item) => item.id === zoneId) as typeof SEED_ZONE | undefined) ?? SEED_ZONE;
  const history = historyQuery.data ?? SEED_HISTORY;

  function submitReport(status: ReportInputStatus, reportZoneId: number, reportCoordinates: Coordinates) {
    setReceiptMessage('');
    createReport.mutate(
      { zoneId: reportZoneId, data: { deviceId, status, geoLat: reportCoordinates.lat, geoLng: reportCoordinates.lng } },
      {
        onSuccess: (receipt) => {
          setReceiptMessage(receipt.message || 'Your signal is in the log.');
          void queryClient.invalidateQueries({ queryKey: getGetZoneQueryKey(reportZoneId) });
          void queryClient.invalidateQueries({ queryKey: getGetZoneHistoryQueryKey(reportZoneId) });
          void queryClient.invalidateQueries({ queryKey: getListZonesQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(deviceId) });
        },
      },
    );
  }

  function report(status: ReportInputStatus) {
    setReceiptMessage('');
    const storedLocation = confirmedLocation ?? (
      profileQuery.data?.lastConfirmedZoneId
        ? {
            zoneId: profileQuery.data.lastConfirmedZoneId,
            coordinates: {
              lat: profileQuery.data.lastConfirmedLat ?? zone.centerLat,
              lng: profileQuery.data.lastConfirmedLng ?? zone.centerLng,
            },
          }
        : null
    );
    if (!storedLocation || storedLocation.zoneId !== zoneId) {
      setPendingReport(status);
      setLocationModalOpen(true);
      return;
    }
    submitReport(status, storedLocation.zoneId, coordinates ?? storedLocation.coordinates);
  }

  async function confirmAndReport(confirmedZone: typeof SEED_ZONE, confirmedCoordinates: Coordinates) {
    if (!pendingReport) return;
    await confirmLocation.mutateAsync({
      deviceId,
      data: { zoneId: confirmedZone.id, lat: confirmedCoordinates.lat, lng: confirmedCoordinates.lng },
    });
    setConfirmedLocation({ zoneId: confirmedZone.id, coordinates: confirmedCoordinates });
    setZoneId(confirmedZone.id);
    setCoordinates(confirmedCoordinates);
    setLocationLabel(`Location confirmed · ${confirmedZone.name}`);
    setLocationModalOpen(false);
    const status = pendingReport;
    setPendingReport(null);
    submitReport(status, confirmedZone.id, confirmedCoordinates);
    void queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey(deviceId) });
  }

  const modalCoordinates = coordinates ?? { lat: zone.centerLat, lng: zone.centerLng };

  return (
    <div className="md:ml-[210px]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="font-label mb-3 text-[10px] text-[#22c55e]">Neighborhood power log</p>
            <h1 className="text-balance text-[34px] font-semibold leading-[1.03] tracking-[-0.065em] text-[#f5f5f7] sm:text-[44px]">What is the signal<br className="hidden sm:block" /> on your street?</h1>
          </div>
          <span className="hidden shrink-0 pb-1 font-label text-[10px] text-[#6a6b6b] sm:block">Refresh / 30 sec</span>
        </div>

        <div className="mb-5 flex items-center justify-between border-y border-[#282a2b] py-3">
          <div className="flex min-w-0 items-center gap-2 text-xs text-[#9f9fa0]" data-testid="text-location-state">
            <LocateFixed size={14} className="shrink-0 text-[#22c55e]" />
            <span className="truncate">{locationLabel}</span>
          </div>
          <button type="button" data-testid="button-refresh-home" onClick={() => void zoneQuery.refetch()} className="ml-3 inline-flex shrink-0 items-center gap-1.5 font-label text-[9px] text-[#9f9fa0] transition-colors hover:text-[#f5f5f7]">
            <RefreshCw size={12} className={zoneQuery.isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {zoneQuery.isLoading ? (
          <div className="min-h-[390px] animate-pulse rounded-[14px] border border-[#282a2b] bg-[#1c1d1e]" data-testid="loading-status" />
        ) : zoneQuery.isError && !zoneQuery.data ? (
          <div className="border border-[#563035] bg-[#241719] p-6" data-testid="error-status">
            <AlertCircle className="mb-4 text-[#f87171]" size={22} />
            <h2 className="text-lg font-medium text-[#f5f5f7]">The live signal is quiet.</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#9f9fa0]">We are showing the last seeded zone while the network reconnects.</p>
            <button type="button" data-testid="button-retry-status" onClick={() => void zoneQuery.refetch()} className="mt-5 inline-flex items-center gap-2 rounded-md border border-[#754047] px-3 py-2 text-xs text-[#ffc3c5] hover:bg-[#3e1d20]"><RefreshCw size={13} /> Try again</button>
          </div>
        ) : (
          <StatusTile zone={zone} onReport={report} isPending={createReport.isPending} receiptMessage={receiptMessage} />
        )}

        {createReport.isError && <p className="mt-3 text-xs text-[#f87171]" data-testid="error-report">That report did not go through. Please try again.</p>}

        <section className="mt-8" data-testid="section-home-history">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <p className="font-label text-[9px] text-[#6a6b6b]">Recent pulse</p>
              <h2 className="mt-1 text-lg font-medium">Last five check-ins</h2>
            </div>
            <span className="font-label text-[9px] text-[#6a6b6b]">Live zone</span>
          </div>
          {historyQuery.isLoading ? <div className="h-[148px] animate-pulse border border-[#282a2b] bg-[#171819]" /> : <HistoryStrip points={history} />}
        </section>

        <div className="mt-8 border-l-2 border-[#22c55e] bg-[#171819] px-4 py-3.5 text-sm leading-relaxed text-[#9f9fa0]" data-testid="text-community-note">
          <span className="text-[#f5f5f7]">One tap is enough.</span> Your anonymous signal helps the next person know before they reach for the switch.
        </div>
      </div>
      <LocationConfirmationModal
        open={locationModalOpen}
        zone={zone}
        initialCoordinates={modalCoordinates}
        pendingStatus={pendingReport}
        isSaving={confirmLocation.isPending || createReport.isPending}
        onClose={() => {
          setLocationModalOpen(false);
          setPendingReport(null);
        }}
        onConfirm={confirmAndReport}
      />
    </div>
  );
}