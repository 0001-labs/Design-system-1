/* Design system 1 responsive scale calculation, shared with native HTML sites */
export type ScalingMode = "auto" | "fixed" | "fluid";

export interface ScalingConfig {
  mode: ScalingMode;
  baseWidth: number;
  minScale: number;
  maxScale: number;
}

// ============================================================================
// Configuration & Signals
// ============================================================================

export const defaultScalingConfig: ScalingConfig = {
  mode: "auto",
  baseWidth: 280,
  minScale: 0.75,
  maxScale: 2.0,
};

export function calculateScalingFactor(viewportWidth: number, config: ScalingConfig = defaultScalingConfig): number {
  if (config.mode === "fixed") return 1;
  return Number(Math.max(config.minScale, Math.min(config.maxScale, viewportWidth / config.baseWidth)).toFixed(3));
}
