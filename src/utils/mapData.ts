import { PROVINCE_BY_SLUG } from "../data/provinceMeta";
import {
  loadCitiesByProvince,
  loadProvincesGeoJSON,
  loadSubdistrictsByCity,
} from "./geoData";
import { projectGeoJSONToPaths } from "./geojsonProjector";

export interface ParsedPath {
  d: string;
  title: string;
  id: string;
}

export interface ParsedMapData {
  viewBox: string;
  paths: ParsedPath[];
  projectPoint?: (lng: number, lat: number) => { x: number; y: number };
}

let nationalMapCache: ParsedMapData | null = null;
let nationalMapPromise: Promise<ParsedMapData> | null = null;

export async function fetchNationalMap(
  width = 1000,
  height = 369
): Promise<ParsedMapData> {
  if (nationalMapCache) return nationalMapCache;
  if (!nationalMapPromise) {
    nationalMapPromise = loadProvincesGeoJSON().then((collection) => {
      const projected = projectGeoJSONToPaths(collection, width, height);
      nationalMapCache = projected;
      return projected;
    });
  }
  return nationalMapPromise;
}

export async function fetchProvinceCitiesMap(
  provinceSlug: string,
  width = 800,
  height = 600
): Promise<ParsedMapData | null> {
  const meta = PROVINCE_BY_SLUG[provinceSlug];
  if (!meta) return null;

  const collection = await loadCitiesByProvince(meta.whatGeoId);
  return projectGeoJSONToPaths(collection, width, height);
}

export async function fetchProvinceCitiesOverlayMap(
  provinceSlug: string,
  width = 1000,
  height = 369
): Promise<ParsedMapData | null> {
  const meta = PROVINCE_BY_SLUG[provinceSlug];
  if (!meta) return null;

  const [cities, provinces] = await Promise.all([
    loadCitiesByProvince(meta.whatGeoId),
    loadProvincesGeoJSON(),
  ]);
  return projectGeoJSONToPaths(cities, width, height, provinces);
}

export async function fetchCitySubdistrictsMap(
  cityCode: string | number,
  width = 800,
  height = 600
): Promise<ParsedMapData | null> {
  const collection = await loadSubdistrictsByCity(cityCode);
  return projectGeoJSONToPaths(collection, width, height);
}

export async function fetchCitySubdistrictsOverlayMap(
  cityCode: string | number,
  width = 1000,
  height = 369
): Promise<ParsedMapData | null> {
  const [subdistricts, provinces] = await Promise.all([
    loadSubdistrictsByCity(cityCode),
    loadProvincesGeoJSON(),
  ]);
  return projectGeoJSONToPaths(subdistricts, width, height, provinces);
}
