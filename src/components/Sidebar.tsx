import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, LayoutDashboard, X } from "lucide-react";

const LOGO_SRC = "/logo.svg";
const GITHUB_URL = "https://github.com/qya/indomaps";

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
    <>
      {onToggleCollapse && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onToggleCollapse}
          className="fixed inset-0 z-30 bg-slate-950/55 backdrop-blur-sm md:hidden"
        />
      )}
      <aside className="mobile-sidebar fixed inset-y-0 left-0 z-40 flex w-[min(88vw,340px)] shrink-0 flex-col border-r border-white/5 bg-slate-950 font-sans text-slate-400 shadow-2xl selection:bg-teal-500/20 md:static md:h-full md:w-85 md:shadow-none">
      
      {/* Editorial Header */}
      <header className="flex items-center justify-between border-b border-white/5 px-4 py-4 md:px-6 md:py-6">
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
        {onToggleCollapse && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onToggleCollapse}
            className="ml-2 flex size-9 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white md:hidden"
          >
            <X size={16} />
          </button>
        )}
      </header>

      {/* Persistent Navigation Tabs */}
      <div className="px-4 pt-3 md:px-6 md:pt-5">
        <div className="flex gap-2 border-b border-white/5 pb-3 md:pb-4">
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

      {/* Footer actions */}
      <div className="flex items-center justify-between border-t border-white/5 bg-black/10 px-4 py-3 font-mono text-[9px] uppercase text-slate-600 md:px-5 md:py-3.5">
          <div className="flex items-center gap-2">
            <span>XOCI LABS</span>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="flex size-7 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
              title="Open GitHub repository"
              aria-label="Open GitHub repository"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="size-3.5 fill-current"
              >
                <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.51 2.87 8.34 6.84 9.69.5.09.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.51.47-3.16-.63-3.36-1.21-.11-.3-.6-1.21-1.03-1.46-.35-.19-.85-.66-.01-.67.79-.01 1.35.74 1.54 1.05.9 1.55 2.34 1.11 2.91.85.09-.67.35-1.11.64-1.37-2.22-.26-4.55-1.14-4.55-5.05 0-1.11.39-2.03 1.03-2.74-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.04A9.3 9.3 0 0 1 12 6.93c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.04 2.75-1.04.55 1.4.2 2.44.1 2.7.64.71 1.03 1.62 1.03 2.74 0 3.92-2.34 4.79-4.57 5.05.36.32.68.94.68 1.91 0 1.38-.01 2.49-.01 2.83 0 .27.18.59.69.49A10.04 10.04 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
              </svg>
            </a>
          </div>
          <div className="flex items-center gap-2">
            {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
                className="hidden items-center gap-0.5 transition-colors hover:text-white md:flex"
            title="Collapse sidebar"
            type="button"
          >
            <ChevronLeft size={10} />
            Minimize
          </button>
            )}
          </div>
        </div>
    </aside>
    </>
  );
}
