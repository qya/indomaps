import type { SelectedRegion } from "./map";

export interface PlaygroundHandoff {
  themeName: string;
  currentTheme: Record<string, string>;
  toggles: {
    districts: boolean;
    labels: boolean;
    static: boolean;
    connectedMaps: boolean;
  };
  selected: SelectedRegion;
}

export function getPosterStyleFromTheme(
  themeName: string
): "minimal" | "blueprint" | "batik" | "dark" {
  switch (themeName) {
    case "light":
    case "mono":
      return "minimal";
    case "batik":
      return "batik";
    case "flat-dark":
      return "dark";
    default:
      return "blueprint";
  }
}
