import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="grid min-h-[70dvh] place-items-center text-center">
      <div>
        <p className="font-label text-[10px] text-[#eab308]">Signal lost</p>
        <h1 className="mt-3 text-5xl font-semibold tracking-[-0.08em]">404</h1>
        <p className="mt-3 text-sm text-[#9f9fa0]">This room does not exist in the current grid.</p>
        <Link href="/" data-testid="link-return-home" className="mt-6 inline-flex rounded-md border border-[#3b403d] px-4 py-2 text-sm text-[#f5f5f7] hover:bg-[#1c1d1e]">Return to report</Link>
      </div>
    </div>
  );
}
