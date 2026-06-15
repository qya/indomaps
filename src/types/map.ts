export interface MapSelection {
  state: string;
  district: string;
  cityId?: string;
  subdistrict?: string;
  subdistrictId?: string;
}

export type SelectedRegion = string | MapSelection | null;

export interface Point {
  x: number;
  y: number;
}

export interface LatLng {
  lng: number;
  lat: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface StateData {
  slug: string;
  name: string;
  type: "state" | "ft";
  d: string;
  centroid: Point;
  bbox: BoundingBox;
  ll: LatLng;
}

export interface StateMeta {
  capital: string;
  pop: number;
}

export interface DistrictData {
  slug: string;
  name: string;
  state: string;
  d: string;
  centroid: Point;
  bbox: BoundingBox;
  ll: LatLng;
}

export interface ThemePreset {
  "--sea": string;
  "--grid": string;
  "--land": string;
  "--land-hover": string;
  "--land-active": string;
  "--stroke": string;
  "--stroke-w": string;
  "--district": string;
  "--carve": string;
  "--carve-w": string;
  "--district-hi": string;
  "--label": string;
  "--accent": string;
  "--pin": string;
  "--pin-ring": string;
  "--panel-bg": string;
  "--panel-edge": string;
  [key: string]: string;
}

export interface ThemeVarConfig {
  v: string;
  label: string;
  type: "color" | "range";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}
