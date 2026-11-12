import { Search } from "lucide-react";
import { MobileNav, Sidebar } from "@/components/app/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-line bg-ink-950/85 px-5 backdrop-blur">
          <label className="flex w-full max-w-md items-center gap-2 rounded-lg border border-line bg-ink-900 px-3 py-1.5 text-sm text-slate-500">
            <Search size={14} />
            <input
              placeholder="Search incidents, assets, locations..."
              className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[11px] text-slate-500 sm:block">Ops Manager</span>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-accent/20 text-xs font-medium text-accent">AS</div>
          </div>
        </header>
        <MobileNav />
        <main className="flex-1 p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
