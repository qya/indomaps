import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { PROVINCE_BY_SLUG } from "../data/provinceMeta";
import type { SelectedRegion } from "../types/map";
import type { ParsedMapData } from "../utils/mapData";

type ZoomLevel = "full" | "province" | "district" | "subdistrict";

const ZOOM_MAX = 5;
const ZOOM_STEP = 0.05;

function getInitialProvince(selection: SelectedRegion): string | null {
  if (!selection) return null;
  return typeof selection === "string" ? selection : selection.state || null;
}

function getInitialCity(selection: SelectedRegion): string | null {
  return selection && typeof selection === "object" ? selection.cityId || null : null;
}

function getInitialSubdistrict(selection: SelectedRegion): string | null {
  return selection && typeof selection === "object" ? selection.subdistrictId || null : null;
}

function getInitialZoomLevel(selection: SelectedRegion): ZoomLevel {
  if (!selection) return "full";
  if (typeof selection === "string") return "province";
  if (selection.subdistrictId) return "subdistrict";
  if (selection.cityId) return "district";
  return selection.state ? "province" : "full";
}

function brightenGridColor(grid: string): string {
  const rgba = grid.match(/^rgba?\((.+)\)$/);
  if (!rgba) return "rgba(255, 255, 255, 0.14)";

  const parts = rgba[1].split(",").map((part) => part.trim());
  if (parts.length === 4) {
    const alpha = Math.min(parseFloat(parts[3]) * 3.2, 0.22);
    return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
  }

  return grid;
}

function MapGridShell({
  theme,
  isStatic,
  className = "",
  children,
}: {
  theme: Record<string, string>;
  isStatic: boolean;
  className?: string;
  children: ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStatic) return;

    const root = rootRef.current;
    if (!root) return;

    let glowRaf: number | null = null;
    let lastGlow: PointerEvent | null = null;

    const onGlowMove = (event: PointerEvent) => {
      lastGlow = event;
      if (glowRaf) return;

      glowRaf = requestAnimationFrame(() => {
        glowRaf = null;
        if (!lastGlow) return;

        const rect = root.getBoundingClientRect();
        root.style.setProperty("--mx", `${lastGlow.clientX - rect.left}px`);
        root.style.setProperty("--my", `${lastGlow.clientY - rect.top}px`);
      });
    };

    const onGlowLeave = () => {
      root.style.setProperty("--mx", "-200px");
      root.style.setProperty("--my", "-200px");
    };

    root.addEventListener("pointermove", onGlowMove);
    root.addEventListener("pointerleave", onGlowLeave);

    return () => {
      if (glowRaf) cancelAnimationFrame(glowRaf);
      root.removeEventListener("pointermove", onGlowMove);
      root.removeEventListener("pointerleave", onGlowLeave);
    };
  }, [isStatic]);

  const gridGradient = `linear-gradient(to right, ${theme["--grid"]} 1px, transparent 1px), linear-gradient(to bottom, ${theme["--grid"]} 1px, transparent 1px)`;

  return (
    <div
      ref={rootRef}
      className={`mmap w-full h-full transition-all duration-300 ${className} ${isStatic ? "mmap--static" : ""}`}
      style={{
        backgroundColor: theme["--sea"],
        backgroundImage: isStatic ? "none" : gridGradient,
        backgroundSize: isStatic ? undefined : "38px 38px",
        ["--grid-glow" as string]: brightenGridColor(theme["--grid"]),
      }}
    >
      {children}
    </div>
  );
}

interface IndonesiaMapProps {
  theme: Record<string, string>;
  showDistricts: boolean;
  showLabels: boolean;
  isStatic: boolean;
  showConnectedMaps?: boolean;
  initialSelection?: SelectedRegion;
  hideInlineControls?: boolean;
  controlsContainer?: HTMLElement | null;
  zoomMultiplier?: number;
  onZoomMultiplierChange?: (value: number) => void;
  onSelect: (payload: SelectedRegion) => void;
  data?: Record<string, number> | null;
  pins?: Array<{ lng: number; lat: number; label: string; x?: number; y?: number }> | null;
}

export function IndonesiaMap({
  theme,
  showLabels,
  isStatic,
  showConnectedMaps = false,
  initialSelection,
  hideInlineControls = false,
  controlsContainer = null,
  zoomMultiplier: zoomMultiplierProp,
  onZoomMultiplierChange,
  onSelect,
  data = null,
  pins = null,
}: IndonesiaMapProps) {
  const [nationalMap, setNationalMap] = useState<ParsedMapData | null>(null);
  const [loadingNational, setLoadingNational] = useState(true);

  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(() =>
    getInitialProvince(initialSelection ?? null)
  );

  const [cityMapData, setCityMapData] = useState<ParsedMapData | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(() =>
    getInitialCity(initialSelection ?? null)
  );

  const [subdistrictMapData, setSubdistrictMapData] = useState<ParsedMapData | null>(null);
  const [loadingSubdistricts, setLoadingSubdistricts] = useState(false);
  const [hoveredSubdistrict, setHoveredSubdistrict] = useState<string | null>(null);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState<string | null>(() =>
    getInitialSubdistrict(initialSelection ?? null)
  );
  const [zoomMultiplierInternal, setZoomMultiplierInternal] = useState(1);
  const zoomMultiplier = zoomMultiplierProp ?? zoomMultiplierInternal;
  const setZoomMultiplier = onZoomMultiplierChange ?? setZoomMultiplierInternal;
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(() =>
    getInitialZoomLevel(initialSelection ?? null)
  );

  useEffect(() => {
    import("../utils/mapData")
      .then(({ fetchNationalMap }) => fetchNationalMap())
      .then(setNationalMap)
      .catch((err) => console.error("Failed to load national map:", err))
      .finally(() => setLoadingNational(false));
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      return;
    }

    import("../utils/mapData")
      .then(({ fetchProvinceCitiesMap, fetchProvinceCitiesOverlayMap }) => {
        setLoadingCities(true);
        return showConnectedMaps
          ? fetchProvinceCitiesOverlayMap(selectedProvince)
          : fetchProvinceCitiesMap(selectedProvince);
      })
      .then((res) => {
        setCityMapData(res);
        setSelectedCity(null);
        setSelectedSubdistrict(null);
      })
      .catch((err) => {
        console.error("City map load error:", err);
        setCityMapData(null);
      })
      .finally(() => setLoadingCities(false));
  }, [selectedProvince, showConnectedMaps]);

  useEffect(() => {
    if (!selectedCity) {
      return;
    }

    import("../utils/mapData")
      .then(({ fetchCitySubdistrictsMap, fetchCitySubdistrictsOverlayMap }) => {
        setLoadingSubdistricts(true);
        return showConnectedMaps
          ? fetchCitySubdistrictsOverlayMap(selectedCity)
          : fetchCitySubdistrictsMap(selectedCity);
      })
      .then((res) => {
        setSubdistrictMapData(res);
        setSelectedSubdistrict(null);
      })
      .catch((err) => {
        console.error("Subdistrict map load error:", err);
        setSubdistrictMapData(null);
      })
      .finally(() => setLoadingSubdistricts(false));
  }, [selectedCity, showConnectedMaps]);

  const handleProvinceSelect = (id: string) => {
    if (isStatic) return;
    const target = selectedProvince === id ? null : id;
    setSelectedProvince(target);
    setSelectedCity(null);
    setSelectedSubdistrict(null);
    setZoomMultiplier(1);
    setZoomLevel(target ? "province" : "full");
    onSelect(target);
  };

  const handleCitySelect = (id: string, title: string) => {
    if (isStatic) return;
    const target = selectedCity === id ? null : id;
    setSelectedCity(target);
    setSelectedSubdistrict(null);
    setZoomMultiplier(1);
    setZoomLevel(target ? "district" : selectedProvince ? "province" : "full");
    onSelect(
      target
        ? { state: selectedProvince || "", district: title, cityId: id }
        : selectedProvince
          ? selectedProvince
          : null
    );
  };

  const handleSubdistrictSelect = (id: string, title: string) => {
    if (isStatic) return;
    const target = selectedSubdistrict === id ? null : id;
    const selectedCityPath = selectedCity
      ? cityMapData?.paths.find((path) => path.id === selectedCity)
      : null;

    setSelectedSubdistrict(target);
    setZoomMultiplier(1);
    setZoomLevel(target ? "subdistrict" : selectedCity ? "district" : selectedProvince ? "province" : "full");
    onSelect(
      target
        ? {
            state: selectedProvince || "",
            district: selectedCityPath?.title || selectedCity || "",
            cityId: selectedCity || undefined,
            subdistrict: title,
            subdistrictId: id,
          }
        : selectedCity
          ? {
              state: selectedProvince || "",
              district: selectedCityPath?.title || selectedCity,
              cityId: selectedCity,
            }
          : selectedProvince
            ? selectedProvince
            : null
    );
  };

  const getProvinceFillColor = (locId: string, isSelected: boolean, isHovered: boolean) => {
    if (data && data[locId] !== undefined) {
      const values = Object.values(data);
      const min = Math.min(...values);
      const max = Math.max(...values);
      const val = data[locId];
      const ratio = max === min ? 0.5 : (val - min) / (max - min);

      const fromR = 30, fromG = 41, fromB = 59;
      const toR = 20, toG = 184, toB = 166;

      const r = Math.round(fromR + ratio * (toR - fromR));
      const g = Math.round(fromG + ratio * (toG - fromG));
      const b = Math.round(fromB + ratio * (toB - fromB));

      return `rgb(${r}, ${g}, ${b})`;
    }

    if (isSelected) return theme["--land-active"];
    if (isHovered) return theme["--land-hover"];
    return theme["--land"];
  };

  const getPathBounds = (d: string) => {
    const values = Array.from(d.matchAll(/-?\d+(?:\.\d+)?/g), (match) => Number(match[0]));
    const xs: number[] = [];
    const ys: number[] = [];

    for (let index = 0; index < values.length; index += 2) {
      xs.push(values[index]);
      ys.push(values[index + 1]);
    }

    if (!xs.length || !ys.length) return null;

    return {
      minX: Math.min(...xs),
      maxX: Math.max(...xs),
      minY: Math.min(...ys),
      maxY: Math.max(...ys),
    };
  };

  const getPathCenter = (d: string) => {
    const bounds = getPathBounds(d);

    if (!bounds) return null;

    return {
      x: bounds.minX + (bounds.maxX - bounds.minX) / 2,
      y: bounds.minY + (bounds.maxY - bounds.minY) / 2,
    };
  };

  type LabelLevel = "province" | "city" | "subdistrict";

  type LabelFitProfile = {
    minFontSize: number;
    maxFontSize: number;
  };

  const ABSOLUTE_MIN_LABEL_FONT = 0.42;

  const getLabelFitProfile = (level: LabelLevel): LabelFitProfile => {
    if (showConnectedMaps) {
      if (level === "subdistrict") return { minFontSize: 0.55, maxFontSize: 2.8 };
      if (level === "city") return { minFontSize: 0.75, maxFontSize: 4.5 };
      return { minFontSize: 1.8, maxFontSize: 7 };
    }

    if (level === "subdistrict") return { minFontSize: 1.1, maxFontSize: 5 };
    if (level === "city") return { minFontSize: 1.5, maxFontSize: 6 };
    return { minFontSize: 2, maxFontSize: 8 };
  };

  const truncateLabelToWidth = (
    label: string,
    maxChars: number
  ): { text: string; truncated: boolean } => {
    if (maxChars >= label.length) return { text: label, truncated: false };
    if (maxChars <= 1) return { text: "…", truncated: true };
    if (maxChars === 2) return { text: `${label[0]}…`, truncated: true };

    return {
      text: `${label.slice(0, maxChars - 1).trimEnd()}…`,
      truncated: true,
    };
  };

  const fitLabelToBoundary = (
    d: string,
    label: string,
    profile: LabelFitProfile
  ): {
    displayLabel: string;
    fontSize: number;
    center: { x: number; y: number };
    truncated: boolean;
  } | null => {
    const bounds = getPathBounds(d);
    const center = getPathCenter(d);
    const trimmed = label.trim();
    if (!bounds || !center || !trimmed) return null;

    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const minDim = Math.min(width, height);
    const maxDim = Math.max(width, height);
    const charWidthRatio = 0.56;
    const widthPad = 0.85;
    const heightPad = 0.24;

    const byHeight = height * heightPad;
    const byMinSide = minDim * 0.12;
    const byArea = Math.sqrt(width * height) * 0.08;
    const hardCap = Math.min(minDim * 0.13, profile.maxFontSize);

    let fontSize = Math.min(byHeight, byMinSide, byArea, hardCap);

    const aspect = maxDim / Math.max(minDim, 0.001);
    if (aspect > 3) {
      fontSize = Math.min(fontSize, (width * widthPad) / (4 * charWidthRatio));
    } else if (aspect > 2) {
      fontSize = Math.min(fontSize, (width * widthPad) / (6 * charWidthRatio));
    }

    fontSize = Math.max(fontSize, ABSOLUTE_MIN_LABEL_FONT);

    const textFits = (size: number, text: string) =>
      text.length * size * charWidthRatio <= width * widthPad;

    let maxChars = Math.max(1, Math.floor((width * widthPad) / (fontSize * charWidthRatio)));
    let { text: displayLabel, truncated } = truncateLabelToWidth(trimmed, maxChars);

    while (fontSize > ABSOLUTE_MIN_LABEL_FONT && !textFits(fontSize, displayLabel)) {
      fontSize *= 0.9;
      maxChars = Math.max(1, Math.floor((width * widthPad) / (fontSize * charWidthRatio)));
      const next = truncateLabelToWidth(trimmed, maxChars);
      displayLabel = next.text;
      truncated = next.truncated;
    }

    if (truncated) {
      for (let trySize = fontSize; trySize >= ABSOLUTE_MIN_LABEL_FONT; trySize *= 0.9) {
        const tryChars = Math.max(1, Math.floor((width * widthPad) / (trySize * charWidthRatio)));
        const tryLabel = truncateLabelToWidth(trimmed, tryChars);

        if (!tryLabel.truncated || tryLabel.text.length > displayLabel.length) {
          fontSize = trySize;
          displayLabel = tryLabel.text;
          truncated = tryLabel.truncated;
        }

        if (!truncated) break;
      }
    }

    fontSize = Math.max(fontSize, ABSOLUTE_MIN_LABEL_FONT);

    return { displayLabel, fontSize, center, truncated };
  };

  type LabelLayer = {
    mapData: ParsedMapData;
    getLabel: (path: ParsedMapData["paths"][number]) => string;
    level: LabelLevel;
  };

  const getIndonesiaFocus = () => {
    if (isStatic || !selectedProvince || zoomLevel === "full") return null;

    const provinceFocus =
      nationalMap && selectedProvince
        ? {
            path: nationalMap.paths.find((path) => path.id === selectedProvince),
            mapData: nationalMap,
            maxScale: 8,
          }
        : null;
    const districtFocus =
      cityMapData && selectedCity
        ? {
            path: cityMapData.paths.find((path) => path.id === selectedCity),
            mapData: cityMapData,
            maxScale: 18,
          }
        : null;
    const subdistrictFocus =
      subdistrictMapData && selectedSubdistrict
        ? {
            path: subdistrictMapData.paths.find((path) => path.id === selectedSubdistrict),
            mapData: subdistrictMapData,
            maxScale: 30,
          }
        : null;

    return zoomLevel === "subdistrict"
      ? subdistrictFocus || districtFocus || provinceFocus
      : zoomLevel === "district"
        ? districtFocus || provinceFocus
        : provinceFocus;
  };

  const getIndonesiaViewScale = () => {
    const focus = getIndonesiaFocus();
    if (!focus?.path || !focus.mapData) return 1;

    const baseScale = getPathFitScale(focus.path.d, focus.mapData.viewBox, focus.maxScale);
    return Math.min(baseScale * zoomMultiplier, focus.maxScale * 1.8);
  };

  const getActiveLabelLayer = (): LabelLayer | null => {
    if (!showLabels) return null;

    if (selectedProvince && selectedCity && subdistrictMapData && !showConnectedMaps) {
      return {
        mapData: subdistrictMapData,
        getLabel: (path) => path.title,
        level: "subdistrict",
      };
    }

    if (selectedProvince && cityMapData && !showConnectedMaps) {
      return {
        mapData: cityMapData,
        getLabel: (path) => path.title,
        level: "city",
      };
    }

    if (showConnectedMaps && (zoomLevel === "subdistrict" || zoomLevel === "district") && subdistrictMapData) {
      return {
        mapData: subdistrictMapData,
        getLabel: (path) => path.title,
        level: "subdistrict",
      };
    }

    if (zoomLevel === "subdistrict" && subdistrictMapData) {
      return {
        mapData: subdistrictMapData,
        getLabel: (path) => path.title,
        level: "subdistrict",
      };
    }

    if (zoomLevel === "district" && subdistrictMapData) {
      return {
        mapData: subdistrictMapData,
        getLabel: (path) => path.title,
        level: "subdistrict",
      };
    }

    if (showConnectedMaps && zoomLevel === "province" && cityMapData) {
      return {
        mapData: cityMapData,
        getLabel: (path) => path.title,
        level: "city",
      };
    }

    if (zoomLevel === "province" && cityMapData) {
      return {
        mapData: cityMapData,
        getLabel: (path) => path.title,
        level: "city",
      };
    }

    if (nationalMap) {
      return {
        mapData: nationalMap,
        getLabel: (path) => PROVINCE_BY_SLUG[path.id]?.name || path.title,
        level: "province",
      };
    }

    return null;
  };

  const renderPathLabels = (layer: LabelLayer) => {
    const profile = getLabelFitProfile(layer.level);

    return (
      <g className="pointer-events-none select-none">
        {layer.mapData.paths.map((path) => {
          const label = layer.getLabel(path);
          const metrics = fitLabelToBoundary(path.d, label, profile);
          if (!metrics) return null;

          const { displayLabel, fontSize, center, truncated } = metrics;
          const strokeWidth = Math.max(fontSize * 0.07, 0.08);

          return (
            <text
              key={`label-${path.id}`}
              x={center.x}
              y={center.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={theme["--label"] || "#ffffff"}
              fontSize={fontSize}
              fontWeight={truncated ? 500 : 600}
              stroke={theme["--sea"]}
              strokeWidth={strokeWidth}
              paintOrder="stroke fill"
              opacity={truncated ? 0.85 : 1}
            >
              {displayLabel}
            </text>
          );
        })}
      </g>
    );
  };

  const getPathFitScale = (d: string, viewBox: string, maxScale: number) => {
    const bounds = getPathBounds(d);
    const viewBoxValues = viewBox.split(/\s+/).map(Number);

    if (!bounds || viewBoxValues.length !== 4) return 1;

    const [, , viewWidth, viewHeight] = viewBoxValues;
    const width = Math.max(bounds.maxX - bounds.minX, 1);
    const height = Math.max(bounds.maxY - bounds.minY, 1);
    const scale = Math.min((viewWidth * 0.66) / width, (viewHeight * 0.66) / height);

    return Math.min(Math.max(scale, 1), maxScale);
  };

  const getSimpleZoomTransform = (viewBox: string, multiplier: number) => {
    if (multiplier === 1) return undefined;
    const viewBoxValues = viewBox.split(/\s+/).map(Number);
    if (viewBoxValues.length !== 4) return undefined;
    const [viewX, viewY, viewWidth, viewHeight] = viewBoxValues;
    const centerX = viewX + viewWidth / 2;
    const centerY = viewY + viewHeight / 2;
    return `translate(${centerX} ${centerY}) scale(${multiplier}) translate(${-centerX} ${-centerY})`;
  };

  const getIndonesiaViewTransform = () => {
    const focus = getIndonesiaFocus();
    if (!focus?.path || !focus.mapData) return undefined;

    const center = getPathCenter(focus.path.d);
    const viewBoxValues = focus.mapData.viewBox.split(/\s+/).map(Number);
    const scale = getIndonesiaViewScale();
    if (!center || viewBoxValues.length !== 4) {
      return undefined;
    }

    const [viewX, viewY, viewWidth, viewHeight] = viewBoxValues;
    const targetX = viewX + viewWidth / 2;
    const targetY = viewY + viewHeight / 2;
    const translateX = targetX - center.x * scale;
    const translateY = targetY - center.y * scale;

    return `matrix(${scale} 0 0 ${scale} ${translateX} ${translateY})`;
  };

  const renderPaths = (
    mapData: ParsedMapData,
    {
      selectedId,
      hoveredId,
      onHover,
      onSelectPath,
      getFill,
      className = "",
      labelLayer,
    }: {
      selectedId: string | null;
      hoveredId: string | null;
      onHover: (id: string | null) => void;
      onSelectPath: (id: string, title: string) => void;
      getFill: (id: string, selected: boolean, hovered: boolean) => string;
      className?: string;
      labelLayer?: Omit<LabelLayer, "mapData">;
    }
  ) => (
    <MapGridShell theme={theme} isStatic={isStatic} className={className}>
      <svg viewBox={mapData.viewBox} className="w-full h-full transition-all duration-300">
      <g transform={getSimpleZoomTransform(mapData.viewBox, zoomMultiplier)}>
        {mapData.paths.map((path) => {
          const isSelected = selectedId === path.id;
          const isHovered = hoveredId === path.id;

          return (
            <path
              key={path.id}
              d={path.d}
              id={path.id}
              fill={getFill(path.id, isSelected, isHovered)}
              stroke={theme["--stroke"]}
              strokeWidth={parseFloat(theme["--stroke-w"]) || 1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="transition-colors duration-150 cursor-pointer"
              onMouseEnter={() => !isStatic && onHover(path.id)}
              onMouseLeave={() => !isStatic && onHover(null)}
              onClick={() => onSelectPath(path.id, path.title)}
            />
          );
        })}
        {showLabels &&
          labelLayer &&
          renderPathLabels({
            mapData,
            ...labelLayer,
          })}
      </g>
    </svg>
    </MapGridShell>
  );

  const renderMapControls = (controls: ReactNode) => {
    if (!controls || isStatic) return null;
    if (hideInlineControls) {
      return controlsContainer ? createPortal(controls, controlsContainer) : null;
    }
    return controls;
  };

  const renderBottomBar = ({
    backLabel,
    onBack,
    contextLabel,
    levelSelect = false,
    positioned = true,
  }: {
    backLabel?: string;
    onBack?: () => void;
    contextLabel?: string;
    levelSelect?: boolean;
    positioned?: boolean;
  }) => (
    <div
      className={`flex max-w-[min(640px,calc(100vw-1.5rem))] items-center gap-2 overflow-x-auto rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2.5 shadow-xl backdrop-blur-md scrollbar-thin sm:gap-3 ${
        positioned ? "absolute bottom-3 left-3 z-20 sm:bottom-5 sm:left-5" : "w-full"
      }`}
    >
      {backLabel && onBack && (
        <button
          onClick={onBack}
          className="shrink-0 whitespace-nowrap rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-slate-800 sm:py-1.5"
          type="button"
        >
          ← {backLabel}
        </button>
      )}

      {contextLabel && (
        <span className="hidden min-w-0 truncate text-xs text-slate-300 sm:inline">{contextLabel}</span>
      )}

      {levelSelect && (
        <>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Level</span>
          <select
            value={zoomLevel}
            onChange={(event) => {
              setZoomLevel(event.target.value as ZoomLevel);
              setZoomMultiplier(1);
            }}
            className="min-w-24 rounded-md border border-white/5 bg-slate-900 px-2 py-2 text-xs font-semibold text-slate-200 outline-none transition-colors focus:border-teal-400 sm:max-w-28 sm:py-1"
            aria-label="Zoom level"
          >
            <option value="full">Indonesia</option>
            <option value="province" disabled={!selectedProvince}>
              {selectedProvince ? PROVINCE_BY_SLUG[selectedProvince]?.name || selectedProvince : "Province"}
            </option>
            <option value="district" disabled={!selectedCity}>
              {selectedCity
                ? cityMapData?.paths.find((path) => path.id === selectedCity)?.title || selectedCity
                : "District"}
            </option>
            <option value="subdistrict" disabled={!selectedSubdistrict}>
              {selectedSubdistrict
                ? subdistrictMapData?.paths.find((path) => path.id === selectedSubdistrict)?.title || selectedSubdistrict
                : "Subdistrict"}
            </option>
          </select>
        </>
      )}

      <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Zoom</span>
      <input
        type="range"
        min="1"
        max={ZOOM_MAX}
        step={ZOOM_STEP}
        value={zoomMultiplier}
        onChange={(event) => setZoomMultiplier(Number(event.target.value))}
        className="h-2 w-28 min-w-20 shrink accent-teal-400 sm:h-1 sm:w-40"
        aria-label="Map zoom"
      />
      <span className="w-10 shrink-0 text-right text-xs font-mono tabular-nums text-slate-200">
        {Math.round(zoomMultiplier * 100)}%
      </span>
    </div>
  );

  if (selectedProvince && selectedCity && subdistrictMapData && !showConnectedMaps) {
    const provinceName = PROVINCE_BY_SLUG[selectedProvince]?.name || selectedProvince;
    const selectedCityName = cityMapData?.paths.find((path) => path.id === selectedCity)?.title || selectedCity;

    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center p-4">
        {!isStatic && !hideInlineControls &&
          renderBottomBar({
            backLabel: provinceName,
            onBack: () => handleCitySelect(selectedCity, selectedCityName),
            contextLabel: `${selectedCityName} · Kecamatan`,
          })}

        {loadingSubdistricts && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-30 text-xs font-bold font-mono text-teal-400 uppercase tracking-widest animate-pulse">
            Loading sub-districts...
          </div>
        )}

        {renderPaths(subdistrictMapData, {
          selectedId: selectedSubdistrict,
          hoveredId: hoveredSubdistrict,
          onHover: setHoveredSubdistrict,
          onSelectPath: handleSubdistrictSelect,
          getFill: (_id, selected, hovered) =>
            selected ? theme["--land-active"] : hovered ? theme["--land-hover"] : theme["--land"],
          className: "max-h-[70vh]",
          labelLayer: {
            getLabel: (path) => path.title,
            level: "subdistrict",
          },
        })}

        {hoveredSubdistrict && !isStatic && !hideInlineControls && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xl"
            style={{ left: "50%", top: "10%", transform: "translateX(-50%)" }}
          >
            {subdistrictMapData.paths.find((p) => p.id === hoveredSubdistrict)?.title}
          </div>
        )}

      </div>
    );
  }

  if (selectedProvince && cityMapData && !showConnectedMaps) {
    const provinceName = PROVINCE_BY_SLUG[selectedProvince]?.name || selectedProvince;

    return (
      <div className="w-full h-full relative flex flex-col items-center justify-center p-4">
        {!isStatic && !hideInlineControls &&
          renderBottomBar({
            backLabel: "Indonesia",
            onBack: () => handleProvinceSelect(selectedProvince),
            contextLabel: `${provinceName} · Kota/Kab`,
          })}

        {loadingCities && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-30 text-xs font-bold font-mono text-teal-400 uppercase tracking-widest animate-pulse">
            Loading cities...
          </div>
        )}

        {renderPaths(cityMapData, {
          selectedId: selectedCity,
          hoveredId: hoveredCity,
          onHover: setHoveredCity,
          onSelectPath: handleCitySelect,
          getFill: (_id, selected, hovered) =>
            selected ? theme["--land-active"] : hovered ? theme["--land-hover"] : theme["--land"],
          className: "max-h-[70vh]",
          labelLayer: {
            getLabel: (path) => path.title,
            level: "city",
          },
        })}

        {hoveredCity && !isStatic && !hideInlineControls && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xl"
            style={{ left: "50%", top: "10%", transform: "translateX(-50%)" }}
          >
            {cityMapData.paths.find((p) => p.id === hoveredCity)?.title}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
      {(loadingNational || loadingCities || loadingSubdistricts) && (
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-30 text-xs font-bold font-mono text-teal-400 uppercase tracking-widest animate-pulse">
          {loadingNational
            ? "Loading Indonesia map..."
            : loadingSubdistricts
              ? "Loading sub-districts..."
              : "Loading cities..."}
        </div>
      )}

      {nationalMap && (
        <MapGridShell theme={theme} isStatic={isStatic} className="w-full h-full">
          <svg viewBox={nationalMap.viewBox} className="w-full h-full transition-all duration-300">
            <g
              transform={
                getIndonesiaViewTransform() ||
                (!showConnectedMaps
                  ? getSimpleZoomTransform(nationalMap.viewBox, zoomMultiplier)
                  : undefined)
              }
            >
              <g>
                {nationalMap.paths.map((path) => {
                  const isSelected = selectedProvince === path.id;
                  const isHovered = hoveredProvince === path.id;
                  const provinceIsFocused = Boolean(selectedProvince && showConnectedMaps);

                  return (
                    <path
                      key={path.id}
                      d={path.d}
                      id={path.id}
                      fill={getProvinceFillColor(path.id, isSelected, isHovered)}
                      stroke={theme["--stroke"]}
                      strokeWidth={isSelected ? 1.6 : parseFloat(theme["--stroke-w"]) || 1}
                      opacity={provinceIsFocused && !isSelected ? 0.38 : 1}
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      className="transition-colors duration-150 cursor-pointer"
                      onMouseEnter={() => !isStatic && setHoveredProvince(path.id)}
                      onMouseLeave={() => !isStatic && setHoveredProvince(null)}
                      onClick={() => handleProvinceSelect(path.id)}
                    />
                  );
                })}
              </g>
              {selectedProvince && showConnectedMaps && cityMapData && (
                <g>
                  {cityMapData.paths.map((path) => {
                    const isSelected = selectedCity === path.id;
                    const isHovered = hoveredCity === path.id;
                    const fill = isSelected
                      ? theme["--land-active"]
                      : isHovered
                        ? theme["--land-hover"]
                        : theme["--land"];

                    return (
                      <path
                        key={path.id}
                        d={path.d}
                        id={path.id}
                        fill={fill}
                        fillOpacity={isSelected || isHovered ? 1 : 0.12}
                        stroke={theme["--stroke"]}
                        strokeOpacity={0.9}
                        strokeWidth={0.8}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className="transition-colors duration-150 cursor-pointer"
                        onMouseEnter={() => !isStatic && setHoveredCity(path.id)}
                        onMouseLeave={() => !isStatic && setHoveredCity(null)}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCitySelect(path.id, path.title);
                        }}
                      />
                    );
                  })}
                </g>
              )}
              {selectedProvince && selectedCity && showConnectedMaps && subdistrictMapData && (
                <g>
                  {subdistrictMapData.paths.map((path) => {
                    const isSelected = selectedSubdistrict === path.id;
                    const isHovered = hoveredSubdistrict === path.id;
                    const fill = isSelected
                      ? theme["--land-active"]
                      : isHovered
                        ? theme["--land-hover"]
                        : theme["--land"];

                    return (
                      <path
                        key={path.id}
                        d={path.d}
                        id={path.id}
                        fill={fill}
                        fillOpacity={isSelected || isHovered ? 1 : 0.22}
                        stroke={theme["--stroke"]}
                        strokeOpacity={0.95}
                        strokeWidth={0.65}
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                        className="transition-colors duration-150 cursor-pointer"
                        onMouseEnter={() => !isStatic && setHoveredSubdistrict(path.id)}
                        onMouseLeave={() => !isStatic && setHoveredSubdistrict(null)}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSubdistrictSelect(path.id, path.title);
                        }}
                      />
                    );
                  })}
                </g>
              )}
              {pins && (
                <g>
                  {pins.map((pin, i) => {
                    const projectedPin =
                      nationalMap.projectPoint && Number.isFinite(pin.lng) && Number.isFinite(pin.lat)
                        ? nationalMap.projectPoint(pin.lng, pin.lat)
                        : null;
                    const x = projectedPin?.x ?? pin.x;
                    const y = projectedPin?.y ?? pin.y;

                    if (x === undefined || y === undefined) return null;
                    return (
                      <g key={i} className="animate-fade-in pointer-events-none">
                        <circle
                          cx={x}
                          cy={y}
                          r="8"
                          fill={theme["--accent"] || "#14b8a6"}
                          className="animate-ping opacity-40"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill={theme["--accent"] || "#14b8a6"}
                          stroke={theme["--sea"]}
                          strokeWidth="1"
                        />
                        {showLabels && (
                          <text
                            x={x}
                            y={y - 8}
                            textAnchor="middle"
                            fill={theme["--label"] || "#ffffff"}
                            fontSize="8"
                            fontWeight="bold"
                            className="font-mono bg-slate-900/80 px-1 py-0.5 rounded"
                          >
                            {pin.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              )}
              {(() => {
                const labelLayer = getActiveLabelLayer();
                return labelLayer ? renderPathLabels(labelLayer) : null;
              })()}
            </g>
          </svg>
        </MapGridShell>
      )}

      {hoveredProvince && !isStatic && !hideInlineControls && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xl"
          style={{ left: "50%", top: "10%", transform: "translateX(-50%)" }}
        >
          {PROVINCE_BY_SLUG[hoveredProvince]?.name || hoveredProvince}
        </div>
      )}
      {hoveredCity && cityMapData && showConnectedMaps && !isStatic && !hideInlineControls && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xl"
          style={{ left: "50%", top: "10%", transform: "translateX(-50%)" }}
        >
          {cityMapData.paths.find((p) => p.id === hoveredCity)?.title}
        </div>
      )}
      {hoveredSubdistrict && subdistrictMapData && showConnectedMaps && !isStatic && !hideInlineControls && (
        <div
          className="absolute z-20 pointer-events-none rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-white shadow-xl"
          style={{ left: "50%", top: "10%", transform: "translateX(-50%)" }}
        >
          {subdistrictMapData.paths.find((p) => p.id === hoveredSubdistrict)?.title}
        </div>
      )}
      {renderMapControls(
        showConnectedMaps && !isStatic
          ? renderBottomBar({
              backLabel: selectedProvince ? "Indonesia" : undefined,
              onBack: selectedProvince ? () => handleProvinceSelect(selectedProvince) : undefined,
              contextLabel: selectedProvince
                ? PROVINCE_BY_SLUG[selectedProvince]?.name || selectedProvince
                : undefined,
              levelSelect: true,
              positioned: !hideInlineControls,
            })
          : null
      )}
    </div>
  );
}
