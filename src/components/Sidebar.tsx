import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, LayoutDashboard } from "lucide-react";

const LOGO_SRC = "/logo.svg";

interface SidebarProps {
  children?: ReactNode;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ children, isCollapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const currentPath = location.pathname;

  if (isCollapsed) {
    if (!onToggleCollapse) return null;

    return (
      <button
        onClick={onToggleCollapse}
        className="print:hidden group fixed left-0 top-1/2 z-50 flex -translate-y-1/2 flex-col items-center gap-2.5 rounded-r-lg border border-l-0 border-white/10 bg-slate-950/95 py-5 pl-2 pr-3 shadow-2xl backdrop-blur-md transition-all hover:border-teal-400/40 hover:bg-slate-900"
        title="Open sidebar"
        type="button"
        aria-label="Open sidebar"
      >
        <ChevronRight
          size={12}
          className="text-slate-400 transition-colors group-hover:text-teal-400"
        />
        <img
          src={LOGO_SRC}
          alt=""
          aria-hidden
          className="h-5 w-5 opacity-70 transition-opacity group-hover:opacity-100"
        />
      </button>
    );
  }

  return (
    <aside className="w-85 border-r border-white/5 bg-slate-950 flex flex-col h-full text-slate-400 font-sans selection:bg-teal-500/20 z-10 transition-all duration-300">
      
      {/* Editorial Header */}
      <header className="flex items-center justify-between px-6 py-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <img
            src={LOGO_SRC}
            alt=""
            aria-hidden
            className="h-7 w-7 shrink-0"
          />
          <span className="text-sm font-black uppercase tracking-widest text-white font-mono">IndoMaps</span>
        </Link>
        <span className="text-[9px] font-mono border border-white/10 text-slate-500 rounded px-1.5 py-0.5 uppercase">
          v0.0.1
        </span>
      </header>

      {/* Persistent Navigation Tabs */}
      <div className="px-6 pt-5">
        <div className="flex gap-2 pb-4 border-b border-white/5">
          <Link
            to="/"
            className={`flex-grow flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentPath === "/" 
                ? "bg-teal-400 border-teal-300 text-slate-950 font-extrabold" 
                : "border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-slate-300"
            }`}
          >
            <LayoutDashboard size={11} />
            <span>Editor</span>
          </Link>
          <Link
            to="/demo"
            className={`flex-grow flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentPath === "/demo" 
                ? "bg-teal-400 border-teal-300 text-slate-950 font-extrabold" 
                : "border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-slate-300"
            }`}
          >
            <Sparkles size={11} />
            <span>Demo</span>
          </Link>
          <Link
            to="/poster"
            className={`flex-grow flex-1 flex items-center justify-center gap-1.5 rounded-lg border py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
              currentPath === "/poster" 
                ? "bg-teal-400 border-teal-300 text-slate-950 font-extrabold" 
                : "border-white/5 hover:border-white/10 hover:bg-white/[0.02] text-slate-300"
            }`}
          >
            <Sparkles size={11} />
            <span>Poster</span>
          </Link>
        </div>
      </div>

      {/* Page-Specific Children Controls */}
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>

      {/* Footer minimize control */}
      {onToggleCollapse && (
        <div className="border-t border-white/5 bg-black/10 px-5 py-3.5 flex items-center justify-between text-[9px] text-slate-600 font-mono uppercase">
          <span>XOCI LABS</span>
          <button
            onClick={onToggleCollapse}
            className="hover:text-white transition-colors flex items-center gap-0.5"
            title="Collapse sidebar"
            type="button"
          >
            <ChevronLeft size={10} />
            Minimize
          </button>
        </div>
      )}
    </aside>
  );
}
