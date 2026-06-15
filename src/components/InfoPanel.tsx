import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { INDONESIA_META } from "../data/indonesiaMeta";
import { PROVINCE_BY_SLUG } from "../data/provinceMeta";
import type { SelectedRegion } from "../types/map";
import { getCityProperties, getSubdistrictProperties } from "../utils/geoData";

interface InfoPanelProps {
  selected: SelectedRegion;
  onClose: () => void;
}

export function InfoPanel({ selected, onClose }: InfoPanelProps) {
  const [cityProps, setCityProps] = useState<Record<string, unknown> | null>(null);
  const [subdistrictProps, setSubdistrictProps] = useState<Record<string, unknown> | null>(null);

  const cityId =
    selected && typeof selected === "object" ? selected.cityId : undefined;
  const subdistrictId =
    selected && typeof selected === "object" ? selected.subdistrictId : undefined;

  useEffect(() => {
    if (!cityId) return;

    let cancelled = false;
    getCityProperties(cityId)
      .then((props) => {
        if (!cancelled) setCityProps(props);
      })
      .catch(() => {
        if (!cancelled) setCityProps(null);
      });

    return () => {
      cancelled = true;
    };
  }, [cityId]);

  useEffect(() => {
    if (!subdistrictId) return;

    let cancelled = false;
    getSubdistrictProperties(subdistrictId)
      .then((props) => {
        if (!cancelled) setSubdistrictProps(props);
      })
      .catch(() => {
        if (!cancelled) setSubdistrictProps(null);
      });

    return () => {
      cancelled = true;
    };
  }, [subdistrictId]);

  if (!selected) return null;

  const isCity = typeof selected === "object";
  const provinceId = isCity ? selected.state : selected;
  const provinceInfo = PROVINCE_BY_SLUG[provinceId];
  const meta = INDONESIA_META[provinceId] || {};
  const activeCityProps = cityId ? cityProps : null;
  const activeSubdistrictProps = subdistrictId ? subdistrictProps : null;

  let kicker = "Province · Indonesia";
  let title = provinceInfo?.name || provinceId;
  let rows: Array<{ label: string; value: string }>;

  if (isCity && selected.subdistrict) {
    kicker = `Sub-district · ${selected.district}`;
    title = String(activeSubdistrictProps?.ADM3_EN || selected.subdistrict);
    rows = [
      { label: "Province", value: provinceInfo?.name || provinceId },
      { label: "City/Regency", value: selected.district },
      { label: "Sub-district", value: selected.subdistrict },
      selected.subdistrictId ? { label: "P-Code", value: selected.subdistrictId } : null,
      activeSubdistrictProps?.ADM2_PCODE ? { label: "Parent P-Code", value: String(activeSubdistrictProps.ADM2_PCODE) } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  } else if (isCity) {
    kicker = `${String(activeCityProps?.Kind || "City/Regency")} · ${provinceInfo?.name || provinceId}`;
    title = String(activeCityProps?.Name || selected.district);
    rows = [
      { label: "Province", value: provinceInfo?.name || provinceId },
      { label: "City/Regency", value: selected.district },
      selected.cityId ? { label: "BPS Code", value: selected.cityId } : null,
      activeCityProps?.Year ? { label: "Data Year", value: String(activeCityProps.Year) } : null,
      activeCityProps?.Source ? { label: "Source", value: String(activeCityProps.Source) } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  } else {
    rows = [
      meta.pop ? { label: "Population", value: meta.pop.toLocaleString("id-ID") } : null,
      { label: "Code", value: provinceId },
      provinceInfo ? { label: "BPS Code", value: String(provinceInfo.whatGeoId) } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }

  return (
    <div className="absolute inset-x-3 bottom-3 z-20 max-h-[42dvh] overflow-y-auto rounded-xl border border-white/10 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 scrollbar-thin sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-80 sm:max-w-[90vw] sm:max-h-[85vh] sm:p-6">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        aria-label="Close panel"
      >
        <X size={18} />
      </button>

      <div className="mb-4">
        <span className="text-[10px] font-bold tracking-wider text-teal-400 uppercase">
          {kicker}
        </span>
        <h3 className="mt-1 pr-7 text-xl font-bold capitalize text-white sm:text-2xl">{title}</h3>
        {!isCity && meta.capital && (
          <p className="text-xs text-slate-400 italic mt-0.5">Capital · {meta.capital}</p>
        )}
      </div>

      <div className="space-y-2.5 border-t border-white/5 pt-4">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3 border-b border-white/[0.03] py-1 text-sm"
          >
            <span className="text-slate-400 font-medium">{row.label}</span>
            <span className="max-w-[58%] break-words text-right font-semibold text-slate-200">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
