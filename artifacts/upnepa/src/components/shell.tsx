import type { ReactNode } from 'react';
import { Activity, Compass, House, UserRound, Zap } from 'lucide-react';
import { getHealthCheckQueryKey, useHealthCheck } from '@workspace/api-client-react';
import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';

const navItems = [
  { href: '/', label: 'Report', icon: House, testId: 'link-report' },
  { href: '/browse', label: 'Browse', icon: Compass, testId: 'link-browse' },
  { href: '/profile', label: 'Profile', icon: UserRound, testId: 'link-profile' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const current = location === '/' ? '/' : `/${location.split('/')[1]}`;
  const healthQuery = useHealthCheck({
    query: { queryKey: getHealthCheckQueryKey(), staleTime: 30000, refetchInterval: 60000 },
  });
  const networkLabel = useMemo(() => healthQuery.isError ? 'Network quiet' : healthQuery.isLoading ? 'Checking network' : 'Live network', [healthQuery.isError, healthQuery.isLoading]);
  const networkColor = healthQuery.isError ? 'bg-[#eab308]' : 'bg-[#22c55e]';

  return (
    <div className="min-h-[100dvh] bg-[#0f1011] text-[#f5f5f7]">
      <header className="sticky top-0 z-30 border-b border-[#282a2b] bg-[#0f1011]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="group flex items-center gap-3" data-testid="link-brand">
            <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-[#3b403d] bg-[#1c1d1e] text-[#22c55e] transition-colors group-hover:border-[#22c55e]">
              <Zap size={18} strokeWidth={2.5} />
            </span>
            <span className="text-[17px] font-semibold tracking-[-0.04em]">UpNEPA</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 rounded-full ${networkColor} ${healthQuery.isLoading ? 'pulse-soft' : ''}`} />
            <span className="font-label text-[10px] text-[#9f9fa0]" data-testid="status-network">{networkLabel}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-28 pt-6 sm:px-8 sm:pt-10 md:pb-14">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#282a2b] bg-[#111213]/95 px-4 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden" aria-label="Main navigation">
        <div className="mx-auto grid max-w-md grid-cols-3">
          {navItems.map(({ href, label, icon: Icon, testId }) => {
            const active = current === href;
            return (
              <Link
                href={href}
                key={href}
                data-testid={testId}
                className={`flex min-h-[68px] flex-col items-center justify-center gap-1.5 text-[11px] transition-colors ${active ? 'text-[#f5f5f7]' : 'text-[#6a6b6b] hover:text-[#9f9fa0]'}`}
              >
                <Icon size={19} strokeWidth={active ? 2.2 : 1.7} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <aside className="fixed bottom-0 left-0 top-[68px] hidden w-[210px] border-r border-[#282a2b] bg-[#0b0c0d] px-4 py-8 md:block">
        <p className="font-label mb-5 px-3 text-[9px] text-[#6a6b6b]">Control room</p>
        <div className="space-y-1">
          {navItems.map(({ href, label, icon: Icon, testId }) => {
            const active = current === href;
            return (
              <Link
                href={href}
                key={href}
                data-testid={`${testId}-desktop`}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${active ? 'bg-[#1c1d1e] text-[#f5f5f7]' : 'text-[#9f9fa0] hover:bg-[#171819] hover:text-[#f5f5f7]'}`}
              >
                <Icon size={17} />
                <span>{label}</span>
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#22c55e]" />}
              </Link>
            );
          })}
        </div>
        <div className="absolute bottom-8 left-7 right-6">
          <div className="mb-3 flex items-center gap-2 text-[#6a6b6b]">
            <Activity size={14} />
            <span className="font-label text-[9px]">Community signal</span>
          </div>
          <p className="text-xs leading-relaxed text-[#6a6b6b]">A quiet log of what your neighborhood sees.</p>
        </div>
      </aside>
    </div>
  );
}