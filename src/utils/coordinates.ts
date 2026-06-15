import {
  loadCitiesGeoJSON,
  loadProvincesGeoJSON,
  loadSubdistrictsGeoJSON,
} from "./geoData";
import type { SelectedRegion } from "../types/map";

export const INDONESIA_DEFAULT_COORDS = "2.465° S / 118.016° E";

export function formatLatLng(lat: number, lng: number): string {
  const latHemi = lat >= 0 ? "N" : "S";
  const lngHemi = lng >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(3)}° ${latHemi} / ${Math.abs(lng).toFixed(3)}° ${lngHemi}`;
}

function getFeatureCentroid(feature: GeoJSON.Feature): { lat: number; lng: number } | null {
  const geom = feature.geometry;
  if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) {
    return null;
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  const trackCoord = (lng: number, lat: number) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  };

  const trackRing = (ring: number[][]) => {
    for (const [lng, lat] of ring) {
      trackCoord(lng, lat);
    }
  };

  if (geom.type === "Polygon") {
    for (const ring of geom.coordinates) {
      trackRing(ring);
    }
  } else {
    for (const polygon of geom.coordinates) {
      for (const ring of polygon) {
        trackRing(ring);
      }
    }
  }

  if (!Number.isFinite(minLng)) {
    return null;
  }

  return {
    lat: (minLat + maxLat) / 2,
    lng: (minLng + maxLng) / 2,
  };
}

function formatFeatureCoords(feature: GeoJSON.Feature | undefined): string | null {
  if (!feature) return null;
  const centroid = getFeatureCentroid(feature);
  return centroid ? formatLatLng(centroid.lat, centroid.lng) : null;
}

export async function resolveSelectionCoordinates(selected: SelectedRegion): Promise<string> {
  if (!selected) {
    return INDONESIA_DEFAULT_COORDS;
  }

  if (typeof selected === "string") {
    const provinces = await loadProvincesGeoJSON();
    const feature = provinces.features.find((entry) => entry.properties?.slug === selected);
    return formatFeatureCoords(feature) ?? INDONESIA_DEFAULT_COORDS;
  }

  if (selected.subdistrictId) {
    const subdistricts = await loadSubdistrictsGeoJSON();
    const feature = subdistricts.features.find(
      (entry) => entry.properties?.ADM3_PCODE === selected.subdistrictId
    );
    const formatted = formatFeatureCoords(feature);
    if (formatted) return formatted;
  }

  if (selected.cityId) {
    const cities = await loadCitiesGeoJSON();
    const cityId = Number(selected.cityId);
    const feature = cities.features.find(
      (entry) => entry.properties?.whatGeoId === cityId || entry.properties?.Code === cityId
    );
    const formatted = formatFeatureCoords(feature);
    if (formatted) return formatted;
  }

  const provinces = await loadProvincesGeoJSON();
  const province = provinces.features.find((entry) => entry.properties?.slug === selected.state);
  return formatFeatureCoords(province) ?? INDONESIA_DEFAULT_COORDS;
}
