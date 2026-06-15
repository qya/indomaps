import { escAttr, renderSVG } from "./render";

export interface PosterExportOptions {
  theme: Record<string, string>;
  title: string;
  coordinates: string;
  widthPx: number;
  heightPx: number;
  matFrame: boolean;
  matColor: string;
  paperColor: string;
  showCoordinates: boolean;
  liveMapSvg?: string | null;
}

const MAX_PNG_DIMENSION = 4096;

function parseMapSvg(mapSvg: string, fallbackSea: string) {
  const doc = new DOMParser().parseFromString(mapSvg, "image/svg+xml");
  const svg = doc.documentElement;
  const viewBox = svg.getAttribute("viewBox") ?? "0 0 1000 369";
  const style = svg.getAttribute("style") ?? "";
  const seaFromStyle = style.match(/background-color:\s*([^;]+)/)?.[1]?.trim();
  const seaFromRect = doc.querySelector("rect")?.getAttribute("fill");
  const sea = seaFromStyle || seaFromRect || fallbackSea;
  const inner = svg.innerHTML.trim();
  return { viewBox, inner, sea };
}

export function serializePosterMapSvg(posterRoot: HTMLElement): string | null {
  const svg = posterRoot.querySelector("svg");
  if (!svg) return null;
  return new XMLSerializer().serializeToString(svg);
}

export async function buildPosterSvg(options: PosterExportOptions): Promise<string> {
  const fallbackSea = options.theme["--sea"] ?? "#06162f";
  let mapContent: { viewBox: string; inner: string; sea: string };

  if (options.liveMapSvg) {
    mapContent = parseMapSvg(options.liveMapSvg, fallbackSea);
  } else {
    const mapSvg = await renderSVG({ theme: options.theme });
    mapContent = parseMapSvg(mapSvg, fallbackSea);
  }

  const { viewBox, inner, sea } = mapContent;
  const { widthPx: w, heightPx: h } = options;
  const pad = w * 0.08;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const matPad = options.matFrame ? w * 0.025 : 0;
  const contentX = pad + matPad;
  const contentY = pad + matPad;
  const contentW = innerW - matPad * 2;
  const contentH = innerH - matPad * 2;
  const mapH = contentH * 0.58;
  const textY = contentY + mapH + h * 0.06;
  const titleSize = w * 0.055;
  const coordSize = w * 0.018;

  const matRect = options.matFrame
    ? `<rect x="${pad}" y="${pad}" width="${innerW}" height="${innerH}" fill="none" stroke="${escAttr(options.matColor)}" stroke-width="${Math.max(1, w * 0.0015)}"/>`
    : "";

  const coordsLine = options.showCoordinates
    ? `<text x="${w / 2}" y="${textY + titleSize * 1.8}" text-anchor="middle" font-family="Georgia, serif" font-size="${coordSize}" fill="#6b7280">${escAttr(options.coordinates)}</text>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${escAttr(options.paperColor)}"/>
  ${matRect}
  <rect x="${contentX}" y="${contentY}" width="${contentW}" height="${mapH}" fill="${escAttr(sea)}"/>
  <svg x="${contentX}" y="${contentY}" width="${contentW}" height="${mapH}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">
    ${inner}
  </svg>
  <text x="${w / 2}" y="${textY}" text-anchor="middle" font-family="Georgia, serif" font-size="${titleSize}" font-weight="700" fill="#1c1917" letter-spacing="0.08em">${escAttr(options.title.toUpperCase())}</text>
  <line x1="${w / 2 - w * 0.06}" y1="${textY + titleSize * 0.55}" x2="${w / 2 + w * 0.06}" y2="${textY + titleSize * 0.55}" stroke="#a8a29e" stroke-width="${Math.max(1, w * 0.001)}"/>
  ${coordsLine}
</svg>`;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPosterSvg(
  options: PosterExportOptions,
  filename = "indonesia-poster.svg"
) {
  const svg = await buildPosterSvg(options);
  downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), filename);
}

function getPngRenderSize(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_PNG_DIMENSION) {
    return { width, height, scale: 1 };
  }
  const scale = MAX_PNG_DIMENSION / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  };
}

function svgToPng(svg: string, width: number, height: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const encoded = encodeURIComponent(svg)
      .replace(/'/g, "%27")
      .replace(/"/g, "%22");
    const url = `data:image/svg+xml;charset=utf-8,${encoded}`;

    image.onload = () => {
      const renderSize = getPngRenderSize(width, height);
      const canvas = document.createElement("canvas");
      canvas.width = renderSize.width;
      canvas.height = renderSize.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(image, 0, 0, renderSize.width, renderSize.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("PNG export failed"));
        },
        "image/png",
        1
      );
    };

    image.onerror = () => reject(new Error("Failed to render poster image"));
    image.src = url;
  });
}

export async function downloadPosterPng(
  options: PosterExportOptions,
  filename = "indonesia-poster.png"
) {
  const svg = await buildPosterSvg(options);
  const blob = await svgToPng(svg, options.widthPx, options.heightPx);
  downloadBlob(blob, filename);
}

export async function exportPosterFromElement(
  posterRoot: HTMLElement,
  options: Omit<PosterExportOptions, "liveMapSvg">
) {
  const liveMapSvg = serializePosterMapSvg(posterRoot);
  return buildPosterSvg({ ...options, liveMapSvg });
}
