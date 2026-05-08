import { DEG_TO_RAD } from "@/lib/sky-engine";

export function getSkyRadius(width: number, height: number, fullBleed: boolean) {
  return fullBleed && height > width ? height / 2 : Math.min(width, height) / 2 - 24;
}

export function projectToCanvas(
  alt: number,
  az: number,
  width: number,
  height: number,
  skyRadius: number,
  zoom: number,
  panX: number,
  panY: number
) {
  const radialDistance = (1 - alt / 90) * skyRadius;
  const azimuthRad = az * DEG_TO_RAD;
  return {
    x: width / 2 + radialDistance * Math.sin(azimuthRad) * zoom + panX,
    y: height / 2 - radialDistance * Math.cos(azimuthRad) * zoom + panY,
  };
}

export function skyPointToPan(alt: number, az: number, skyRadius: number, zoom: number, focusOffsetY = 0) {
  const radialDistance = (1 - alt / 90) * skyRadius;
  const azimuthRad = az * DEG_TO_RAD;
  return {
    x: -(radialDistance * Math.sin(azimuthRad)) * zoom,
    y: (radialDistance * Math.cos(azimuthRad)) * zoom + focusOffsetY,
  };
}
