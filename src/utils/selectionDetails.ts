import { INDONESIA_META } from "../data/indonesiaMeta";
import { PROVINCE_BY_SLUG } from "../data/provinceMeta";
import type { SelectedRegion } from "../types/map";

export function getSelectionDetails(selected: SelectedRegion) {
  if (!selected) {
    return {
      isSelected: false,
      isCity: false,
      isSubdistrict: false,
      provinceId: null,
      provinceName: "Indonesia",
      title: "Indonesia",
      subtitle: "No region selected",
      code: "ID",
      capital: "Jakarta",
      population: null as number | null,
    };
  }

  const isCity = typeof selected === "object";
  const provinceId = isCity ? selected.state : selected;
  const province = PROVINCE_BY_SLUG[provinceId];
  const meta = INDONESIA_META[provinceId] || {};
  const provinceName = province?.name || provinceId;
  const title = isCity && selected.subdistrict ? selected.subdistrict : isCity ? selected.district : provinceName;
  const subtitle = isCity && selected.subdistrict
    ? `Sub-district in ${selected.district}, ${provinceName}`
    : isCity
      ? `City/Regency in ${provinceName}`
      : `Province capital: ${meta.capital || "Unknown"}`;
  const code = isCity && selected.subdistrictId
    ? selected.subdistrictId
    : isCity
      ? selected.cityId || selected.district
      : province?.whatGeoId
        ? String(province.whatGeoId)
        : provinceId;

  return {
    isSelected: true,
    isCity,
    isSubdistrict: Boolean(isCity && selected.subdistrict),
    provinceId,
    provinceName,
    title,
    subtitle,
    code,
    capital: meta.capital || null,
    population: meta.pop || null,
  };
}

export function formatPopulation(value: number | null) {
  return value ? value.toLocaleString("id-ID") : "Not available";
}
