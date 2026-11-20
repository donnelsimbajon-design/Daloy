import { Link } from '@inertiajs/react';
import { Waves, ArrowUpRight, Menu } from 'lucide-react';

// This header intentionally avoids hard-coded fake alerts, misleading badges,
// and a search input that does not search any backend endpoint.
export default function Topbar({ pageTitle, onMenuToggle }) {
    return (
        <header className="adm-topbar">
            <div className="adm-topbar-left">
                <button className="adm-menu-toggle" onClick={onMenuToggle}
                    type="button" aria-label="Open admin navigation">
                    <Menu size={22} />
                </button>
                <div className="flex flex-col min-w-0">
                    <span className="hidden sm:block text-[10px] uppercase tracking-[.18em] font-bold text-[#555555]">Daloy / Admin</span>
                    <h2 className="truncate">{pageTitle}</h2>
                </div>
            </div>
            <div className="adm-topbar-right">
                <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-[#f7f7f8] px-3 py-2 text-xs font-semibold text-[#555555]">
                    <Waves size={15} /> Workspace
                </span>
                <Link href="/app" className="inline-flex items-center gap-1.5 rounded-xl border border-[#e5e5e5] bg-white px-3 py-2 text-xs font-bold text-[#111111] hover:bg-[#f0f0f1] transition-colors">
                    Back to Daloy <ArrowUpRight size={15} />
                </Link>
            </div>
        </header>
    );
}
