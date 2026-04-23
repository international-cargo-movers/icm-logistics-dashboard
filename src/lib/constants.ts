export const INTERNAL_COMPANIES = [
  { id: "icm-delhi", name: "International Cargo Movers - Delhi", dbName: "icm_delhi" },
  { id: "icm-mumbai", name: "International Cargo Movers - Mumbai", dbName: "icm_mumbai" },
  { id: "intimation-delhi", name: "Intimation Cargo Movers - Delhi", dbName: "intimation_delhi" },
  { id: "intimation-mumbai", name: "Intimation Cargo Movers - Mumbai", dbName: "intimation_mumbai" },
];

export type InternalCompanyId = typeof INTERNAL_COMPANIES[number]["id"];
