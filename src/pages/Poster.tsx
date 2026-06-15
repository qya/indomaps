import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Download, RotateCcw } from "lucide-react";
import { IndonesiaMap } from "../components/IndonesiaMap";
import { Sidebar } from "../components/Sidebar";
import { PRESETS, THEME_VARS } from "../data/themes";
import {
  EXPORT_DPI,
  formatPosterSizeLabel,
  getPosterDimensions,
  POSTER_SIZES,
  type ExportQuality,
  type PosterOrientation,
  type PosterSizeId,
} from "../data/posterSizes";
import type { SelectedRegion } from "../types/map";
import type { PlaygroundHandoff } from "../types/posterHandoff";
import { getSelectionDetails } from "../utils/selectionDetails";
import { downloadPosterPng, downloadPosterSvg, serializePosterMapSvg } from "../utils/posterExport";

const PAPER_COLOR = "#f4f0e8";
const DEFAULT_COORDS = "0.789° S / 113.921° E";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase mb-3">
      {children}
    </h3>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-md border border-white/10 bg-black/20 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-[5px] px-2 py-1.5 text-[11px] font-medium transition-all ${
            value === option.value
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-slate-300">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-white" : "bg-white/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-slate-900 transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

export default function Poster() {
  const location = useLocation();
  const handoff = location.state as PlaygroundHandoff | null;
  const posterRef = useRef<HTMLDivElement>(null);
  const initialThemeName = handoff?.themeName && PRESETS[handoff.themeName]
    ? handoff.themeName
    : "blueprint";

  const [size, setSize] = useState<PosterSizeId>("A2");
  const [orientation, setOrientation] = useState<PosterOrientation>("portrait");
  const [themeName, setThemeName] = useState(initialThemeName);
  const [currentTheme, setCurrentTheme] = useState(() =>
    handoff?.currentTheme ? { ...handoff.currentTheme } : { ...PRESETS[initialThemeName] }
  );
  const [matFrame, setMatFrame] = useState(true);
  const [matColor, setMatColor] = useState("#ffffff");
  const [showDistricts, setShowDistricts] = useState(
    () => handoff?.toggles?.districts ?? false
  );
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [connectedMaps, setConnectedMaps] = useState(
    () => handoff?.toggles?.connectedMaps ?? true
  );
  const [mapZoom, setMapZoom] = useState(1);
  const [title, setTitle] = useState("");
  const [exportQuality, setExportQuality] = useState<ExportQuality>("print150");
  const [selected, setSelected] = useState<SelectedRegion>(() => handoff?.selected ?? null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mapControlsHost, setMapControlsHost] = useState<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const selectedDetails = getSelectionDetails(selected);
  const posterTitle = selectedDetails.isSelected ? selectedDetails.title : title || "Indonesia";
  const coordinates = DEFAULT_COORDS;

  const dimensions = useMemo(
    () => getPosterDimensions(size, orientation, EXPORT_DPI[exportQuality]),
    [size, orientation, exportQuality]
  );

  const previewAspect = useMemo(() => {
    const sheet = POSTER_SIZES[size];
    return orientation === "portrait"
      ? `${sheet.widthMm} / ${sheet.heightMm}`
      : `${sheet.heightMm} / ${sheet.widthMm}`;
  }, [size, orientation]);

  const buildExportOptions = () => ({
    theme: currentTheme,
    title: posterTitle,
    coordinates,
    widthPx: dimensions.widthPx,
    heightPx: dimensions.heightPx,
    matFrame,
    matColor,
    paperColor: PAPER_COLOR,
    showCoordinates,
    liveMapSvg: posterRef.current ? serializePosterMapSvg(posterRef.current) : null,
  });

  const handleThemePresetChange = (name: string) => {
    setThemeName(name);
    setCurrentTheme({ ...PRESETS[name] });
  };

  const handleThemeValueChange = (variable: string, value: string) => {
    setCurrentTheme((prev) => ({
      ...prev,
      [variable]: value,
    }));
  };

  const handleConnectedMapsChange = (enabled: boolean) => {
    setConnectedMaps(enabled);
    setMapZoom(1);
  };

  const handlePrint = () => {
    if (posterRef.current) {
      const liveSvg = serializePosterMapSvg(posterRef.current);
      const fallback = posterRef.current.querySelector(
        ".poster-print-map-fallback"
      ) as HTMLImageElement | null;
      if (liveSvg && fallback) {
        fallback.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(liveSvg)}`;
      }
    }

    const style = document.createElement("style");
    style.id = "poster-print-page";
    style.textContent = `@page { size: ${size} ${orientation}; margin: 0; }`;
    document.head.appendChild(style);
    window.print();
    window.addEventListener(
      "afterprint",
      () => {
        style.remove();
      },
      { once: true }
    );
  };

  useEffect(() => {
    const preparePrintMap = () => {
      if (!posterRef.current) return;
      const liveSvg = serializePosterMapSvg(posterRef.current);
      const fallback = posterRef.current.querySelector(
        ".poster-print-map-fallback"
      ) as HTMLImageElement | null;
      if (!liveSvg || !fallback) return;
      fallback.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(liveSvg)}`;
    };

    window.addEventListener("beforeprint", preparePrintMap);
    return () => window.removeEventListener("beforeprint", preparePrintMap);
  }, [currentTheme, connectedMaps, showDistricts, selected, posterTitle, mapZoom]);

  const handleDownloadPng = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadPosterPng(buildExportOptions(), `indonesia-poster-${size.toLowerCase()}.png`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "PNG export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSvg = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadPosterSvg(buildExportOptions(), `indonesia-poster-${size.toLowerCase()}.svg`);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "SVG export failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="poster-print-root flex flex-1 min-h-screen bg-[#242424] text-slate-300 font-sans"
      data-poster-orientation={orientation}
      data-poster-size={size}
    >
      <div className="print:hidden shrink-0">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        >
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scrollbar-thin">
            <SectionLabel>Size</SectionLabel>
            <div className="space-y-3">
              <select
                value={size}
                onChange={(event) => setSize(event.target.value as PosterSizeId)}
                className="w-full rounded-md border border-white/10 bg-black/25 px-3 py-2 text-[13px] text-slate-200 outline-none focus:border-white/25"
              >
                {(Object.keys(POSTER_SIZES) as PosterSizeId[]).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <SegmentedControl
                value={orientation}
                onChange={setOrientation}
                options={[
                  { value: "portrait", label: "Portrait" },
                  { value: "landscape", label: "Landscape" },
                ]}
              />
            </div>

            <SectionLabel>Theme</SectionLabel>
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(PRESETS).map((name) => {
                const preset = PRESETS[name];
                const isActive = themeName === name;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => handleThemePresetChange(name)}
                    className={`h-9 w-9 rounded-md border transition-all ${
                      isActive ? "border-white ring-2 ring-white/20 scale-105" : "border-white/10 hover:border-white/25"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${preset["--sea"]} 0 25%, ${preset["--land"]} 25% 50%, ${preset["--land-active"]} 50% 75%, ${preset["--stroke"]} 75% 100%)`,
                    }}
                  />
                );
              })}
            </div>
            <div className="space-y-3">
              {THEME_VARS.map((variable) => {
                const val = currentTheme[variable.v] || "";
                return (
                  <div key={variable.v} className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-slate-400">{variable.label}</span>
                    {variable.type === "color" ? (
                      <div className="relative h-6 w-6 overflow-hidden rounded border border-white/10">
                        <input
                          type="color"
                          value={val.startsWith("#") ? val : "#000000"}
                          onChange={(event) => handleThemeValueChange(variable.v, event.target.value)}
                          className="absolute inset-[-4px] h-10 w-10 cursor-pointer border-0 p-0"
                        />
                      </div>
                    ) : (
                      <input
                        type="range"
                        min={variable.min}
                        max={variable.max}
                        step={variable.step}
                        value={parseFloat(val) || 0}
                        onChange={(event) => handleThemeValueChange(variable.v, event.target.value)}
                        className="w-24 cursor-pointer accent-white"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <SectionLabel>Frame &amp; Text</SectionLabel>
            <div className="space-y-1">
              <ToggleRow label="Mat frame" checked={matFrame} onChange={setMatFrame} />
              <div className="flex items-center justify-between gap-3 py-1.5">
                <span className="text-[13px] text-slate-300">Mat colour</span>
                <input
                  type="color"
                  value={matColor}
                  onChange={(event) => setMatColor(event.target.value)}
                  className="h-6 w-6 cursor-pointer rounded border border-white/10 bg-transparent p-0"
                  aria-label="Mat colour"
                />
              </div>
              <ToggleRow label="Districts" checked={showDistricts} onChange={setShowDistricts} />
              <ToggleRow
                label="Connected maps"
                checked={connectedMaps}
                onChange={handleConnectedMapsChange}
              />
              {!connectedMaps && (
                <div className="flex items-center gap-3 py-2">
                  <span className="shrink-0 text-[11px] text-slate-500">Zoom</span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.05"
                    value={mapZoom}
                    onChange={(event) => setMapZoom(Number(event.target.value))}
                    className="min-w-0 flex-1 cursor-pointer accent-white"
                    aria-label="Map zoom"
                  />
                  <span className="w-10 shrink-0 text-right text-[11px] text-slate-500">
                    {Math.round(mapZoom * 100)}%
                  </span>
                </div>
              )}
              <ToggleRow label="Coordinates" checked={showCoordinates} onChange={setShowCoordinates} />
            </div>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Title (defaults to region)"
              className="w-full rounded-md border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] text-slate-200 placeholder:text-slate-600 outline-none focus:border-white/25"
            />

            {selectedDetails.isSelected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                <RotateCcw size={12} />
                Clear map selection
              </button>
            )}
          </div>

          <div className="border-t border-white/10 p-5 space-y-3">
            <SectionLabel>Export</SectionLabel>
            <SegmentedControl
              value={exportQuality}
              onChange={setExportQuality}
              options={[
                { value: "screen", label: "Screen" },
                { value: "print150", label: "Print 150" },
                { value: "hires300", label: "Hi-res 300" },
              ]}
            />

            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isExporting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-[#ececec] py-2.5 text-[13px] font-semibold text-slate-900 transition-colors hover:bg-white disabled:opacity-50"
            >
              <Download size={15} />
              Download PNG
            </button>

            <button
              type="button"
              onClick={handleDownloadSvg}
              disabled={isExporting}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-white/10 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50"
            >
              <Download size={15} />
              Download SVG (vector)
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex w-full items-center justify-center rounded-md border border-white/10 py-2 text-[11px] font-medium text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            >
              Print poster
            </button>

            <p className="text-[10px] leading-relaxed text-slate-600">
              {formatPosterSizeLabel(size, orientation, exportQuality)}
            </p>
            {exportError && (
              <p className="text-[10px] leading-relaxed text-red-400">{exportError}</p>
            )}
          </div>
        </Sidebar>
      </div>

      <main className="poster-preview-stage flex flex-1 flex-col items-center justify-center overflow-y-auto p-6 md:p-10 print:p-0 print:overflow-visible">
        <div
          ref={posterRef}
          id="poster-print-area"
          className="poster-sheet relative flex w-full flex-col shadow-2xl print:shadow-none"
          style={{
            aspectRatio: previewAspect,
            width: orientation === "portrait" ? "min(100%, 420px)" : "min(100%, 620px)",
            maxHeight: "calc(100vh - 120px)",
            backgroundColor: PAPER_COLOR,
          }}
        >
          <div
            className="poster-sheet-inner flex min-h-0 flex-1 flex-col"
            style={{
              margin: "7%",
              ...(matFrame
                ? {
                    border: `1px solid ${matColor === "#ffffff" ? "rgba(0,0,0,0.18)" : matColor}`,
                    padding: "5%",
                  }
                : {}),
            }}
          >
            <div
              className="poster-map-slot relative min-h-[220px] flex-[3] basis-0"
              style={{ backgroundColor: currentTheme["--sea"] }}
            >
              <div className="poster-map-live absolute inset-0 print:hidden">
                <IndonesiaMap
                  key={connectedMaps ? "connected" : "solo"}
                  theme={currentTheme}
                  showDistricts={showDistricts}
                  showLabels={false}
                  isStatic={false}
                  showConnectedMaps={connectedMaps}
                  zoomMultiplier={mapZoom}
                  onZoomMultiplierChange={setMapZoom}
                  initialSelection={selected ?? handoff?.selected ?? undefined}
                  hideInlineControls
                  controlsContainer={connectedMaps ? mapControlsHost : null}
                  onSelect={setSelected}
                />
              </div>
              <img
                alt=""
                aria-hidden="true"
                className="poster-print-map-fallback pointer-events-none absolute inset-0 hidden h-full w-full object-contain print:block"
              />
            </div>

            <div className="poster-text-slot flex shrink-0 flex-col items-center pt-[6%] text-center">
              <h1 className="font-serif text-[clamp(1.25rem,4.5vw,2.25rem)] font-bold uppercase tracking-[0.16em] text-stone-900">
                {posterTitle}
              </h1>
              <div className="my-[0.9rem] h-px w-14 bg-stone-400/70" />
              {showCoordinates && (
                <p className="font-mono text-[clamp(0.55rem,1.4vw,0.72rem)] tracking-[0.08em] text-stone-500">
                  {coordinates}
                </p>
              )}
            </div>
          </div>
        </div>

        {connectedMaps && (
          <div
            ref={setMapControlsHost}
            className="poster-map-controls print:hidden mt-5 w-full max-w-[420px] empty:hidden"
          />
        )}
      </main>
    </div>
  );
}
