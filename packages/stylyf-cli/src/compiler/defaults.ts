import type { ThemeIR } from "./generated-app.js";
import type { StylyfSpecV04 } from "../spec/types.js";

export function defaultTheme(spec: StylyfSpecV04): ThemeIR {
  return {
    preset: spec.experience?.theme ?? "opal",
    mode: spec.experience?.mode ?? "light",
    radius: spec.experience?.radius ?? "trim",
    density: spec.experience?.density ?? "comfortable",
    spacing: spec.experience?.spacing ?? "tight",
    fonts: {
      fancy: "Fraunces",
      sans: "Manrope",
      mono: "IBM Plex Mono",
    },
  };
}

export function humanize(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, match => match.toUpperCase());
}

export function singularize(value: string) {
  return value.endsWith("s") ? value.slice(0, -1) : value;
}
