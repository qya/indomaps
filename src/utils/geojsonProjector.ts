export interface ProjectedPath {
  id: string;
  title: string;
  d: string;
}

export interface ProjectedMap {
  viewBox: string;
  paths: ProjectedPath[];
  projectPoint?: (lng: number, lat: number) => { x: number; y: number };
}

export function projectGeoJSONToPaths(
  geojson: GeoJSON.FeatureCollection,
  width = 800,
  height = 600,
  boundsGeojson: GeoJSON.FeatureCollection = geojson
): ProjectedMap {
  function project(lng: number, lat: number) {
    const x = (lng + 180) * (width / 360);
    const latRad = (lat * Math.PI) / 180;
    const y = (width / (2 * Math.PI)) * Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    return [x, -y];
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const features = geojson.features || [];
  const boundsFeatures = boundsGeojson.features || [];

  const projectFeature = (feature: GeoJSON.Feature, shouldTrackBounds: boolean) => {
    const geom = feature.geometry;
    const props = feature.properties || {};

    const title = String(props.Name || props.NAMOBJ || props.KECAMATAN || props.ADM3_EN || props.ADM2_EN || "Region");
    const id = String(
      props.slug ??
        props.Code ??
        props.whatGeoId ??
        props.ADM3_PCODE ??
        props.ADM2_PCODE ??
        props.id ??
        title
    );

    const projectedCoordinates: number[][][][] = [];

    const processPolygon = (polygon: number[][][]) => {
      return polygon.map((ring) => {
        return ring.map((coord) => {
          const [x, y] = project(coord[0], coord[1]);
          if (shouldTrackBounds) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
          return [x, y];
        });
      });
    };

    if (geom.type === "Polygon") {
      projectedCoordinates.push(processPolygon(geom.coordinates as number[][][]));
    } else if (geom.type === "MultiPolygon") {
      (geom.coordinates as number[][][][]).forEach((polygon) => {
        projectedCoordinates.push(processPolygon(polygon));
      });
    }

    return { id, title, coordinates: projectedCoordinates };
  };

  const projectedFeatures = features.map((feature) => projectFeature(feature, false));
  boundsFeatures.forEach((feature) => projectFeature(feature, true));

  if (!Number.isFinite(minX) || !Number.isFinite(maxX)) {
    return { viewBox: `0 0 ${width} ${height}`, paths: [] };
  }

  const padding = 40;
  const contentWidth = width - padding * 2;
  const contentHeight = height - padding * 2;

  const dx = maxX - minX;
  const dy = maxY - minY;
  const scale = Math.min(contentWidth / dx, contentHeight / dy);

  const xOffset = padding + (contentWidth - dx * scale) / 2;
  const yOffset = padding + (contentHeight - dy * scale) / 2;
  const projectPoint = (lng: number, lat: number) => {
    const [x, y] = project(lng, lat);
    return {
      x: (x - minX) * scale + xOffset,
      y: (y - minY) * scale + yOffset,
    };
  };

  const paths = projectedFeatures.map((feat) => {
    const d = feat.coordinates
      .map((polygon: number[][][]) => {
        return polygon
          .map((ring: number[][]) => {
            const points = ring.map(([x, y]: number[]) => {
              const sx = ((x - minX) * scale + xOffset).toFixed(1);
              const sy = ((y - minY) * scale + yOffset).toFixed(1);
              return `${sx},${sy}`;
            });
            return `M${points.join("L")}Z`;
          })
          .join(" ");
      })
      .join(" ");

    return { id: feat.id, title: feat.title, d };
  });

  return { viewBox: `0 0 ${width} ${height}`, paths, projectPoint };
}
