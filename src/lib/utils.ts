import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAutoUnitAndQty(jobOrQuote: any) {
  const mode = jobOrQuote.mode || jobOrQuote.shipmentDetails?.mode || "";
  const cargo = jobOrQuote.cargoSummary || jobOrQuote.cargoDetails || {};
  
  // Weights and Vol from either Job or Quote structure
  const grossWeight = Number(cargo.totalGrossWeight || cargo.grossWeight || 0);
  const volWeight = Number(cargo.totalVolumetricWeight || cargo.volumetricWeight || 0);
  const chargeableWeight = Math.max(grossWeight, volWeight);
  
  let unit = "SET";
  let qty = 1;

  if (mode.includes("Air")) {
    unit = "per KG";
    qty = chargeableWeight || 1;
  } else if (mode.includes("Sea FCL")) {
    unit = "per CONTAINER";
    if (cargo.containerCount) {
      qty = Number(cargo.containerCount);
    } else {
      // Fallback: Try to parse container count from equipment string like "1x 40' HC"
      const equipment = cargo.equipment || "";
      const match = equipment.match(/(\d+)\s*x/i);
      qty = match ? parseInt(match[1]) : 1;
    }
  } else if (mode.includes("Sea LCL")) {
    unit = "per CBM";
    qty = cargo.totalCBM || volWeight || 1;
  }

  return { unit, qty };
}
