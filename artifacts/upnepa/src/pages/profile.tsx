import { useMemo } from 'react';
import { AlertCircle, Fingerprint, ShieldCheck } from 'lucide-react';
import { getGetProfileQueryKey, useGetProfile } from '@workspace/api-client-react';
import { formatDate, getDeviceId } from '@/lib/upnepa';

export default function ProfilePage() {
  const deviceId = useMemo(() => getDeviceId(), []);
  const profileQuery = useGetProfile(deviceId, { query: { queryKey: getGetProfileQueryKey(deviceId), staleTime: 30000 } });
  const profile = profileQuery.data;

  return (
    <div className="md:ml-[210px]">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="font-label mb-3 text-[10px] text-[#22c55e]">Your quiet contribution</p>
          <h1 className="text-[34px] font-semibold leading-none tracking-[-0.065em] sm:text-[44px]">Anonymous profile</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#9f9fa0]">Your device keeps a small local identity so your helpful signals can be counted without an account.</p>
        </div>

        <section className="border border-[#282a2b] bg-[#1c1d1e]" data-testid="card-anonymous-profile">
          <div className="flex items-center gap-4 border-b border-[#282a2b] p-5 sm:p-7">
            <div className="grid h-12 w-12 place-items-center rounded-full border border-[#3b403d] bg-[#252827] text-[#22c55e]"><Fingerprint size={23} /></div>
            <div className="min-w-0">
              <p className="font-label text-[9px] text-[#6a6b6b]">Local device ID</p>
              <p className="mt-1 truncate font-mono text-sm text-[#f5f5f7]" data-testid="text-device-id">{deviceId}</p>
            </div>
            <span className="ml-auto hidden items-center gap-1.5 font-label text-[9px] text-[#4ade80] sm:flex"><ShieldCheck size={13} /> Private by default</span>
          </div>

          {profileQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-px bg-[#282a2b] sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse bg-[#1c1d1e]" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-px bg-[#282a2b] sm:grid-cols-4">
              <div className="bg-[#1c1d1e] p-5"><span className="font-label block text-[9px] text-[#6a6b6b]">Reports made</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.06em] text-[#f5f5f7]" data-testid="value-report-count">{profile?.reportCount ?? 0}</strong></div>
              <div className="bg-[#1c1d1e] p-5"><span className="font-label block text-[9px] text-[#6a6b6b]">Zones reached</span><strong className="mt-3 block text-3xl font-medium tracking-[-0.06em] text-[#f5f5f7]" data-testid="value-zones-reported">{profile?.zonesReported ?? 0}</strong></div>
              <div className="bg-[#1c1d1e] p-5"><span className="font-label block text-[9px] text-[#6a6b6b]">First report</span><strong className="mt-3 block text-sm font-medium text-[#f5f5f7]" data-testid="value-first-report">{formatDate(profile?.firstReportAt ?? null)}</strong></div>
              <div className="bg-[#1c1d1e] p-5"><span className="font-label block text-[9px] text-[#6a6b6b]">Latest report</span><strong className="mt-3 block text-sm font-medium text-[#f5f5f7]" data-testid="value-last-report">{formatDate(profile?.lastReportAt ?? null)}</strong></div>
            </div>
          )}
          {profileQuery.isError && <p className="flex items-center gap-2 border-t border-[#282a2b] px-5 py-3 text-xs text-[#facc15]" data-testid="error-profile"><AlertCircle size={14} /> Your local summary will appear when the network reconnects.</p>}
        </section>

        <section className="mt-8 border border-dashed border-[#3a3c3d] bg-[#171819] p-5 sm:p-7" data-testid="card-future-reputation">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 text-[#eab308]"><ShieldCheck size={20} /></div>
            <div>
              <p className="font-label text-[9px] text-[#eab308]">Future area</p>
              <h2 className="mt-2 text-lg font-medium">Reputation, with care</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#9f9fa0]">We may add a helpfulness signal later. For now, your reports simply stand on their own — no score, no leaderboard, no public identity.</p>
              <span className="mt-5 inline-flex rounded-full border border-[#3a3c3d] px-3 py-1.5 font-label text-[9px] text-[#6a6b6b]">Not available yet</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}