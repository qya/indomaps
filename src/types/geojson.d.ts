export interface GeoJSONPosition extends Array<number> {
  0: number;
  1: number;
}

export interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

export interface GeoJSONFeature {
  type: "Feature";
  geometry: GeoJSONGeometry;
  properties?: Record<string, unknown>;
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

declare global {
  namespace GeoJSON {
    type Position = GeoJSONPosition;
    type Geometry = GeoJSONGeometry;
    type Feature = GeoJSONFeature;
    type FeatureCollection = GeoJSONFeatureCollection;
  }
}

export {};
