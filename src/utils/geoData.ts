const EXPORTS_BASE = "/exports";

async function readGeoJSONResponse(response: Response): Promise<GeoJSON.FeatureCollection> {
  const contentEncoding = response.headers.get("content-encoding");

  // Static servers (including Vite) often set Content-Encoding: gzip for .gz assets.
  // fetch() transparently decompresses those bodies, so manual gzip decode would fail.
  const text =
    contentEncoding?.includes("gzip")
      ? await response.text()
      : await decompressGzipResponse(response);

  return JSON.parse(text) as GeoJSON.FeatureCollection;
}

async function decompressGzipResponse(response: Response): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Gzip decompression is not supported in this browser");
  }

  if (!response.body) {
    throw new Error("Empty response body");
  }

  const stream = response.body.pipeThrough(new DecompressionStream("gzip"));
  return new Response(stream).text();
}

async function fetchGzippedGeoJSON(filename: string): Promise<GeoJSON.FeatureCollection> {
  const response = await fetch(`${EXPORTS_BASE}/${filename}`);
  if (!response.ok) {
    throw new Error(`Failed to load ${filename}: ${response.status}`);
  }

  return readGeoJSONResponse(response);
}

async function loadGeoJSON(
  filename: string,
  cache: { data: GeoJSON.FeatureCollection | null; promise: Promise<GeoJSON.FeatureCollection> | null }
): Promise<GeoJSON.FeatureCollection> {
  if (cache.data) return cache.data;
  if (!cache.promise) {
    cache.promise = fetchGzippedGeoJSON(filename)
      .then((data) => {
        cache.data = data;
        return data;
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }
  return cache.promise;
}

const provincesCache = {
  data: null as GeoJSON.FeatureCollection | null,
  promise: null as Promise<GeoJSON.FeatureCollection> | null,
};

export async function loadProvincesGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  return loadGeoJSON("indonesia-provinces.geojson.gz", provincesCache);
}

const citiesCache = {
  data: null as GeoJSON.FeatureCollection | null,
  promise: null as Promise<GeoJSON.FeatureCollection> | null,
};

export async function loadCitiesGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  return loadGeoJSON("indonesia-cities.geojson.gz", citiesCache);
}

const subdistrictsCache = {
  data: null as GeoJSON.FeatureCollection | null,
  promise: null as Promise<GeoJSON.FeatureCollection> | null,
};

export async function loadSubdistrictsGeoJSON(): Promise<GeoJSON.FeatureCollection> {
  return loadGeoJSON("indonesia-subdistricts.geojson.gz", subdistrictsCache);
}

export async function loadCitiesByProvince(provinceCode: number): Promise<GeoJSON.FeatureCollection> {
  const all = await loadCitiesGeoJSON();
  return {
    type: "FeatureCollection",
    features: all.features.filter((feature) => feature.properties?.Parent === provinceCode),
  };
}

export async function loadSubdistrictsByCity(cityCode: string | number): Promise<GeoJSON.FeatureCollection> {
  const all = await loadSubdistrictsGeoJSON();
  const parentCode = `ID${cityCode}`;

  return {
    type: "FeatureCollection",
    features: all.features.filter((feature) => feature.properties?.ADM2_PCODE === parentCode),
  };
}

export async function getCityProperties(
  cityId: string | number
): Promise<Record<string, unknown> | null> {
  const id = Number(cityId);
  const all = await loadCitiesGeoJSON();
  const feature = all.features.find(
    (entry) => entry.properties?.whatGeoId === id || entry.properties?.Code === id
  );
  return feature?.properties ?? null;
}

export async function getSubdistrictProperties(
  subdistrictId: string
): Promise<Record<string, unknown> | null> {
  const all = await loadSubdistrictsGeoJSON();
  const feature = all.features.find((entry) => entry.properties?.ADM3_PCODE === subdistrictId);
  return feature?.properties ?? null;
}
