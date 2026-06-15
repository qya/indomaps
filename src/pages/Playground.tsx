import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
import { IndonesiaMap } from "../components/IndonesiaMap";
import { InfoPanel } from "../components/InfoPanel";
import { PRESETS, THEME_VARS } from "../data/themes";
import type { SelectedRegion } from "../types/map";
import type { PlaygroundHandoff } from "../types/posterHandoff";
import { renderSVG } from "../utils/render";
import {
  Map as MapIcon,
  Layers,
  Eye,
  EyeOff,
  Download,
  CheckCircle,
  Globe2,
  Printer,
} from "lucide-react";

export default function Playground() {
  const navigate = useNavigate();
  const [themeName, setThemeName] = useState("blueprint");
  const [currentTheme, setCurrentTheme] = useState({ ...PRESETS["blueprint"] });

  const [toggles, setToggles] = useState({
    districts: false,
    labels: false,
    static: false,
    connectedMaps: false,
  });

  const [selected, setSelected] = useState<SelectedRegion>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePresetChange = (name: string) => {
    setThemeName(name);
    setCurrentTheme({ ...PRESETS[name] });
  };

  const handleThemeValueChange = (variable: string, value: string) => {
    setCurrentTheme((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleToggle = (key: "districts" | "labels" | "static" | "connectedMaps") => {
    if (key === "districts") return;
    setToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSelect = (payload: SelectedRegion) => {
    setSelected(payload);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

  const handleExportSVG = async () => {
    try {
      const svgContent = await renderSVG({ theme: currentTheme });
      const url = URL.createObjectURL(
        new Blob([svgContent], { type: "image/svg+xml" })
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "indonesia-provinces.svg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast("SVG Map downloaded successfully!");
    } catch {
      showToast("Failed to export SVG map");
    }
  };

  const handleGeneratePoster = () => {
    const handoff: PlaygroundHandoff = {
      themeName,
      currentTheme,
      toggles,
      selected,
    };
    navigate("/poster", { state: handoff });
  };

  const isBackgroundLight = () => {
    let seaColor = (currentTheme["--sea"] || "").replace(/^#/, "");
    if (seaColor.length === 3) seaColor = seaColor.replace(/./g, "$&$&");
    const ok = /^[0-9a-f]{6}$/i.test(seaColor);
    if (!ok) return false;
    const r = parseInt(seaColor.slice(0, 2), 16);
    const g = parseInt(seaColor.slice(2, 4), 16);
    const b = parseInt(seaColor.slice(4, 6), 16);
    const brightness = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return brightness > 150;
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-hidden font-sans select-none relative md:flex-row"
      style={{ background: currentTheme["--sea"] }}
    >
      {/* Sidebar Controls Panel */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 scrollbar-thin md:space-y-7 md:px-6 md:py-5">

          {/* Presets Grid */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-3.5 font-mono">
              Presets / Colorways
            </h4>
            <div className="flex flex-wrap gap-3">
              {Object.keys(PRESETS).map((name) => {
                const p = PRESETS[name];
                const isActive = name === themeName;
                return (
                  <button
                    key={name}
                    onClick={() => handlePresetChange(name)}
                    className={`w-9 h-9 rounded-md border transition-all relative cursor-pointer ${
                      isActive 
                        ? "border-teal-400/80 scale-105 ring-2 ring-teal-500/10" 
                        : "border-white/5 hover:border-white/20"
                    }`}
                    title={name}
                    style={{
                      background: `linear-gradient(135deg, ${p["--sea"]} 0 25%, ${p["--land"]} 25% 50%, ${p["--land-active"]} 50% 75%, ${p["--stroke"]} 75% 100%)`,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Variables Sliders & Colors */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-4.5 font-mono">
              Style Variables
            </h4>
            <div className="space-y-4">
              {THEME_VARS.map((v) => {
                const val = currentTheme[v.v] || "";
                return (
                  <div key={v.v} className="flex items-center justify-between text-xs gap-4">
                    <span className="font-medium text-slate-400">{v.label}</span>
                    {v.type === "color" ? (
                      <div className="w-6 h-6 rounded-md border border-white/5 overflow-hidden relative cursor-pointer hover:border-white/20 transition-all">
                        <input
                          type="color"
                          value={val.startsWith("#") ? val : "#000000"}
                          onChange={(e) => handleThemeValueChange(v.v, e.target.value)}
                          className="absolute inset-[-4px] w-10 h-10 border-0 p-0 cursor-pointer"
                        />
                      </div>
                    ) : (
                      <input
                        type="range"
                        min={v.min}
                        max={v.max}
                        step={v.step}
                        value={parseFloat(val) || 0}
                        onChange={(e) => handleThemeValueChange(v.v, e.target.value)}
                        className="w-24 text-teal-400 accent-teal-400 cursor-pointer bg-white/10 rounded-lg appearance-none"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Dock Controls */}
        <div className="space-y-3 border-t border-white/5 bg-black/10 p-4 font-sans md:p-5">
          <button
            onClick={handleExportSVG}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold py-2.5 px-4 shadow-sm hover:shadow-md transition-all text-xs uppercase tracking-wider"
          >
            <Download size={14} />
            <span>Export SVG Map</span>
          </button>
          <button
            onClick={handleGeneratePoster}
            className="w-full flex items-center justify-center gap-2 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-white font-bold py-2.5 px-4 transition-all text-xs uppercase tracking-wider"
          >
            <Printer size={14} className="text-teal-400" />
            <span>Generate Poster</span>
          </button>
        </div>
      </Sidebar>

      {/* Main Map Stage */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Dynamic Title Overlay Header */}
        <div
          className={`absolute top-4 left-4 z-10 max-w-[calc(100vw-2rem)] pointer-events-none transition-all duration-300 md:top-6 md:left-7 ${
            isBackgroundLight() ? "text-slate-900" : "text-white"
          }`}
        >
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 font-mono">
            Interactive Blueprint Specimen
          </span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight leading-none mt-1 uppercase">
            indonesia
          </h1>
          <p className="text-[10px] font-mono opacity-50 mt-1 uppercase">
            Theme // <span className="font-semibold">{themeName}</span>
          </p>
        </div>

        {/* Map Layer Mode HUD Controls (Top Right) */}
        <div className="absolute inset-x-3 top-20 z-10 flex max-w-[calc(100vw-1.5rem)] items-center gap-3 md:inset-x-auto md:top-5 md:right-6">
          {/* Map Layer HUD Controls */}
          <div className="flex max-w-full overflow-x-auto rounded-lg border border-white/5 bg-slate-950/80 p-1 backdrop-blur-md scrollbar-thin">
            {/* Districts Toggle */}
            <button
              onClick={() => handleToggle("districts")}
              disabled
              className={`flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors opacity-35 cursor-not-allowed ${
                toggles.districts
                  ? "bg-teal-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Layers size={11} />
              <span>Districts</span>
            </button>

            {/* Labels Toggle */}
            <button
              onClick={() => handleToggle("labels")}
              className={`flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors ${
                toggles.labels
                  ? "bg-teal-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Show region names on the map (provinces, districts, or sub-districts based on zoom)"
            >
              {toggles.labels ? <Eye size={11} /> : <EyeOff size={11} />}
              <span>Labels</span>
            </button>

            {/* Static Toggle */}
            <button
              onClick={() => handleToggle("static")}
              className={`flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors ${
                toggles.static
                  ? "bg-teal-400 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MapIcon size={11} />
              <span>Static</span>
            </button>

            {/* Connected Map Toggle */}
            <button
              onClick={() => handleToggle("connectedMaps")}
              disabled={toggles.static}
              className={`flex items-center gap-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors ${
                toggles.static
                  ? "opacity-35 cursor-not-allowed text-slate-500"
                  : toggles.connectedMaps
                    ? "bg-teal-400 text-slate-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
              }`}
              title="Show other connected maps when zooming into a province"
            >
              <Globe2 size={11} />
              <span>Connected</span>
            </button>
          </div>
        </div>

        {/* Info Panel Details HUD */}
        <InfoPanel selected={selected} onClose={() => setSelected(null)} />

        {/* Map Canvas */}
        <div className="flex min-h-[46dvh] flex-1 items-center justify-center">
          <IndonesiaMap
            theme={currentTheme}
            showDistricts={toggles.districts}
            showLabels={toggles.labels}
            isStatic={toggles.static}
            showConnectedMaps={toggles.connectedMaps}
            onSelect={handleSelect}
          />
        </div>

        {/* Lower Left Sign HUD Overlay */}
        <div
          className={`absolute bottom-4 left-4 z-10 hidden text-[9px] font-mono tracking-wider transition-opacity duration-300 pointer-events-none uppercase sm:block md:bottom-5 md:left-7 ${
            isBackgroundLight() ? "text-slate-900/40" : "text-white/30"
          }`}
        >
          INDONESIA VECTOR MAP ENGINE.
        </div>

      </main>

      {/* Toast Overlay Notification */}
      {toastMessage && (
        <div className="absolute bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-xl bg-teal-400 px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-2xl transition-all duration-300 sm:bottom-20 sm:px-5 sm:py-3.5">
          <CheckCircle size={14} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
