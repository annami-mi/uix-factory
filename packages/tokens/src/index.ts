// Списки стилистик и схем генерируются scripts/build.mjs из source/themes/<стилистика>/<схема>.json — не хардкодить здесь.
export { schemes, themes, type SchemeName, type ThemeName } from "../dist/themes";
export { breakpoints } from "../dist/constants";
export { accentPlate, accentPresets, type AccentPreset, type AccentPresetName } from "../dist/accentPresets";
