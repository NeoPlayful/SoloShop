import { components as defaultComponents } from "./presets/default-theme/index.js";
import { components as oceanComponents } from "./presets/ocean-theme/index.js";

export interface ThemeConfig {
  id: string;
  labelKey: string;
  previewColors: { light: string; dark: string };
  hasDark: boolean;
}

export const themeRegistry: ThemeConfig[] = [
  {
    id: "default-theme",
    labelKey: "themeDefault",
    previewColors: { light: "#ffffff", dark: "#1f2937" },
    hasDark: true,
  },
  {
    id: "ocean-theme",
    labelKey: "themeOcean",
    previewColors: { light: "#f0fdfa", dark: "#083344" },
    hasDark: true,
  },
];

export function getThemeConfig(id: string): ThemeConfig | undefined {
  return themeRegistry.find((t) => t.id === id);
}

export function getThemeComponents(id: string) {
  switch (id) {
    case "default-theme":
      return defaultComponents;
    case "ocean-theme":
      return oceanComponents;
    default:
      return defaultComponents;
  }
}
