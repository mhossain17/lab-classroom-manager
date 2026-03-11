import { ThemeSettings } from "@prisma/client";
import type { CSSProperties } from "react";

function hexToRgbTriplet(hex: string): string {
  const safeHex = hex.replace("#", "").trim();
  const fullHex =
    safeHex.length === 3
      ? safeHex
          .split("")
          .map((char) => char + char)
          .join("")
      : safeHex;

  if (!/^[0-9A-Fa-f]{6}$/.test(fullHex)) {
    return "15 76 129";
  }

  const r = Number.parseInt(fullHex.slice(0, 2), 16);
  const g = Number.parseInt(fullHex.slice(2, 4), 16);
  const b = Number.parseInt(fullHex.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function getThemeCssVars(theme: ThemeSettings): CSSProperties {
  return {
    ["--color-primary" as string]: hexToRgbTriplet(theme.primaryColor),
    ["--color-secondary" as string]: hexToRgbTriplet(theme.secondaryColor),
    ["--color-accent" as string]: hexToRgbTriplet(theme.accentColor)
  };
}

export const presetThemes = [
  {
    name: "STEM Navy",
    primaryColor: "#0F4C81",
    secondaryColor: "#1B9AAA",
    accentColor: "#F4A259"
  },
  {
    name: "Workshop Green",
    primaryColor: "#1F6E43",
    secondaryColor: "#2A9D8F",
    accentColor: "#E9C46A"
  },
  {
    name: "Tech Crimson",
    primaryColor: "#7B1E3A",
    secondaryColor: "#A53860",
    accentColor: "#EE964B"
  }
];
