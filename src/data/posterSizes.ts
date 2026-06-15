export type PosterSizeId = "A4" | "A3" | "A2" | "A1";
export type PosterOrientation = "portrait" | "landscape";
export type ExportQuality = "screen" | "print150" | "hires300";

export const POSTER_SIZES: Record<PosterSizeId, { widthMm: number; heightMm: number }> = {
  A4: { widthMm: 210, heightMm: 297 },
  A3: { widthMm: 297, heightMm: 420 },
  A2: { widthMm: 420, heightMm: 594 },
  A1: { widthMm: 594, heightMm: 841 },
};

export const EXPORT_DPI: Record<ExportQuality, number> = {
  screen: 72,
  print150: 150,
  hires300: 300,
};

export function getPosterDimensions(
  size: PosterSizeId,
  orientation: PosterOrientation,
  dpi: number
) {
  const sheet = POSTER_SIZES[size];
  const widthMm = orientation === "portrait" ? sheet.widthMm : sheet.heightMm;
  const heightMm = orientation === "portrait" ? sheet.heightMm : sheet.widthMm;
  const widthPx = Math.round((widthMm / 25.4) * dpi);
  const heightPx = Math.round((heightMm / 25.4) * dpi);

  return { widthMm, heightMm, widthPx, heightPx, dpi };
}

export function formatPosterSizeLabel(
  size: PosterSizeId,
  orientation: PosterOrientation,
  quality: ExportQuality
) {
  const { widthMm, heightMm, widthPx, heightPx, dpi } = getPosterDimensions(
    size,
    orientation,
    EXPORT_DPI[quality]
  );
  return `${size} · ${widthMm}×${heightMm} mm · ${widthPx}×${heightPx} px @ ${dpi}dpi`;
}
