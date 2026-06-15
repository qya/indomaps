import { useState } from "react";
import { IndonesiaMap } from "../components/IndonesiaMap";
import { InfoPanel } from "../components/InfoPanel";
import { Sidebar } from "../components/Sidebar";
import { PRESETS } from "../data/themes";
import type { SelectedRegion } from "../types/map";
import { formatPopulation, getSelectionDetails } from "../utils/selectionDetails";
import { Pin, BarChart3, RotateCcw, Globe2, MapPinned } from "lucide-react";



const GDP_DATA_ID: Record<string, number> = {
  "id-ac": 4.2, // Aceh
  "id-su": 4.7, // North Sumatra
  "id-sb": 4.5, // West Sumatra
  "id-ri": 4.9, // Riau
  "id-kr": 5.1, // Riau Islands
  "id-ja": 4.3, // Jambi
  "id-ss": 5.0, // South Sumatra
  "id-bb": 4.1, // Bangka Belitung
  "id-be": 4.0, // Bengkulu
  "id-la": 4.8, // Lampung
  "id-jk": 5.8, // Jakarta
  "id-bt": 5.2, // Banten
  "id-jb": 5.4, // West Java
  "id-jt": 5.1, // Central Java
  "id-yo": 5.3, // Yogyakarta
  "id-ji": 5.2, // East Java
  "id-ba": 5.6, // Bali
  "id-nb": 4.6, // West Nusa Tenggara
  "id-nt": 4.3, // East Nusa Tenggara
  "id-kb": 4.7, // West Kalimantan
  "id-kt": 4.8, // Central Kalimantan
  "id-ks": 4.9, // South Kalimantan
  "id-ki": 5.5, // East Kalimantan
  "id-ku": 5.0, // North Kalimantan
  "id-sa": 5.1, // North Sulawesi
  "id-st": 5.3, // Central Sulawesi
  "id-sg": 5.2, // Southeast Sulawesi
  "id-sn": 5.4, // South Sulawesi
  "id-go": 4.5, // Gorontalo
  "id-sr": 4.8, // West Sulawesi
  "id-ma": 4.7, // Maluku
  "id-mu": 5.0, // North Maluku
  "id-pb": 4.4, // West Papua
  "id-pa": 4.2, // Papua
};

// Geographic coordinates are projected into the active SVG viewBox by IndonesiaMap.
const CAPITAL_PINS_ID = [
  { lng: 106.8272, lat: -6.1751, label: "Jakarta" },
  { lng: 112.7508, lat: -7.2575, label: "Surabaya" },
  { lng: 119.4238, lat: -5.1477, label: "Makassar" },
  { lng: 104.0305, lat: 1.0456, label: "Batam" },
  { lng: 140.7181, lat: -2.5916, label: "Jayapura" },
];

export default function Demo() {
  const [selected, setSelected] = useState<SelectedRegion>(null);
  const [demoMode, setDemoMode] = useState<"standard" | "choropleth">("standard");
  const [pinsAdded, setPinsAdded] = useState(false);
  const [showConnectedMaps, setShowConnectedMaps] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
  );

  const theme = PRESETS["flat-dark"];

  const handleSelect = (payload: SelectedRegion) => {
    setSelected(payload);
  };

  const handleChoroplethToggle = () => {
    setDemoMode((prev) => prev === "choropleth" ? "standard" : "choropleth");
  };

  const handlePinsToggle = () => {
    setPinsAdded((prev) => !prev);
  };

  const handleReset = () => {
    setSelected(null);
    setDemoMode("standard");
    setPinsAdded(false);
    setShowConnectedMaps(true);
  };

  const activeGdpData = GDP_DATA_ID;
  const activePins = CAPITAL_PINS_ID;
  const selectedDetails = getSelectionDetails(selected);
  const selectedGdp =
    selectedDetails.provinceId && GDP_DATA_ID[selectedDetails.provinceId]
      ? `${GDP_DATA_ID[selectedDetails.provinceId].toFixed(1)}%`
      : "No sample value";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950 font-sans text-slate-400 select-none md:flex-row">
      
      {/* Shared Sidebar layout with Demo controls */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      >
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 scrollbar-thin md:space-y-7 md:px-6 md:py-5">

          {/* Headline context */}
          <div>
            <h4 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-1.5 font-mono">
              Specimen View
            </h4>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              DEMONSTRATION PANEL
            </h2>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              Showcases choropleth data overlay rendering and vector pin mapping on custom projection coordinates.
            </p>
          </div>

          {/* Interactive actions list */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mb-1 font-mono">
              Map Actions
            </h4>

            {/* GDP Choropleth toggle */}
            <button
              onClick={handleChoroplethToggle}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                demoMode === "choropleth"
                  ? "bg-teal-400 border-teal-300 text-slate-950 shadow-md"
                  : "bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={14} />
                <span>GDP Growth Overlay</span>
              </div>
              <span className="text-[9px] opacity-60 uppercase font-mono">Toggle</span>
            </button>

            {/* Capital Pins toggle */}
            <button
              onClick={handlePinsToggle}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                pinsAdded
                  ? "bg-teal-400 border-teal-300 text-slate-950 shadow-md"
                  : "bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Pin size={14} />
                <span>State Capital Pins</span>
              </div>
              <span className="text-[9px] opacity-60 uppercase font-mono">Toggle</span>
            </button>

            <button
              onClick={() => setShowConnectedMaps((prev) => !prev)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                showConnectedMaps
                  ? "bg-teal-400 border-teal-300 text-slate-950 shadow-md"
                  : "bg-white/[0.01] border-white/5 text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe2 size={14} />
                <span>Connected Province View</span>
              </div>
              <span className="text-[9px] opacity-60 uppercase font-mono">Toggle</span>
            </button>
          </div>

          <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">
                  Click Detail
                </h4>
                <p className="mt-1 text-[10px] text-slate-500 leading-relaxed">
                  {selectedDetails.isSelected
                    ? "Current map selection is ready for analysis, export, or poster composition."
                    : "Click a province or district to inspect the selected geography."}
                </p>
              </div>
              <MapPinned size={18} className={selectedDetails.isSelected ? "text-teal-300" : "text-slate-600"} />
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { label: "Selected", value: selectedDetails.title },
                {
                  label: "Level",
                  value: selectedDetails.isSubdistrict
                    ? "Sub-district"
                    : selectedDetails.isCity
                      ? "City/Regency"
                      : selectedDetails.isSelected
                        ? "Province"
                        : "National",
                },
                { label: "Province", value: selectedDetails.provinceName },
                { label: "Population", value: formatPopulation(selectedDetails.population) },
                { label: "GDP Sample", value: selectedGdp },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3 border-b border-white/[0.04] pb-2 text-[10px]">
                  <span className="font-mono uppercase tracking-wider text-slate-500">{row.label}</span>
                  <span className="max-w-[58%] truncate text-right font-semibold text-slate-200">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legend Details */}
          {demoMode === "choropleth" && (
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
              <h4 className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">
                ECONOMIC METRICS
              </h4>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Color value ramp ranges from lowest GDP growth (4.0%) to highest (5.8%).
              </p>
              <div className="mt-3.5 flex items-center justify-between text-[8px] text-slate-500 font-mono uppercase">
                <span>4.0%</span>
                <div className="flex-1 mx-2 h-1 rounded-full bg-gradient-to-r from-slate-950 to-teal-400 border border-white/5" />
                <span>5.8%</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Dock Action Reset */}
        <div className="space-y-3 border-t border-white/5 bg-black/10 p-4 font-sans md:p-5">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold py-2.5 px-4 shadow-sm hover:shadow-md transition-all text-xs uppercase tracking-wider"
          >
            <RotateCcw size={14} />
            <span>Reset Map Showcase</span>
          </button>
        </div>
      </Sidebar>

      {/* Main Canvas View Stage */}
      <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Dynamic Title Overlay Header */}
        <div className="absolute top-4 left-4 z-10 max-w-[calc(100vw-2rem)] pointer-events-none transition-all duration-300 text-white md:top-6 md:left-7">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-50 font-mono">
            Interactive Showcase Specimen
          </span>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight mt-0.5 text-white leading-none">
            indonesia DEMO
          </h1>
          <p className="text-[10px] font-mono opacity-50 mt-1 uppercase">
            {selectedDetails.isSelected ? "Selected" : "Theme"} //{" "}
            <span className="font-semibold">
              {selectedDetails.isSelected ? selectedDetails.title : "Flat Dark"}
            </span>
          </p>
        </div>

        {/* Info Panel Details HUD */}
        <InfoPanel selected={selected} onClose={() => setSelected(null)} />

        {/* Canvas */}
        <div className="flex min-h-[48dvh] flex-1 items-center justify-center">
          <IndonesiaMap
            theme={theme}
            showDistricts={false}
            showLabels={true}
            isStatic={false}
            showConnectedMaps={showConnectedMaps}
            onSelect={handleSelect}
            data={demoMode === "choropleth" ? activeGdpData : null}
            pins={pinsAdded ? activePins : null}
          />
        </div>

        <div className="absolute bottom-4 left-4 z-10 hidden max-w-[min(520px,calc(100vw-2rem))] items-center gap-3 rounded-lg border border-white/5 bg-slate-950/75 px-3.5 py-2.5 text-xs text-slate-300 shadow-xl backdrop-blur-md sm:flex md:bottom-5 md:left-7">
          <MapPinned size={15} className="shrink-0 text-teal-300" />
          <div className="min-w-0">
            <div className="truncate font-bold text-white">{selectedDetails.title}</div>
            <div className="truncate text-[10px] text-slate-500">
              {selectedDetails.subtitle} · Code {selectedDetails.code}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
