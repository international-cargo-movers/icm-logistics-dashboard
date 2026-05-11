import { cookies } from "next/headers";
import { getTenantModels } from "@/model/tenantModels";

const COMPANY_CONFIG: Record<string, { short: string, loc: string }> = {
  "icm-delhi": { short: "ICM", loc: "ICMDEL" },
  "icm-mumbai": { short: "ICM", loc: "ICMMUM" },
  "intimation-delhi": { short: "ICMPL", loc: "ICMPLDEL" },
  "intimation-mumbai": { short: "ICMPL", loc: "ICMPLMUM" },
};

function getFinancialYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed, 3 = April
  
  if (month >= 3) {
    return `${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${(year - 1).toString().slice(-2)}-${year.toString().slice(-2)}`;
  }
}

async function getNextSeq(type: string) {
  const { Counter } = await getTenantModels();
  const counter = await Counter.findOneAndUpdate(
    { model: type },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq.toString().padStart(2, '0');
}

export async function generateJobNumber(mode: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || "icm-delhi";
  const config = COMPANY_CONFIG[tenantId] || COMPANY_CONFIG["icm-delhi"];
  
  const seq = await getNextSeq("job");
  const dir = mode.toLowerCase().includes("import") ? "IMP" : "EXP";
  const fy = getFinancialYear();
  
  return `${config.short}${seq}/${dir}/${fy}`;
}

export async function generateInvoiceNumber() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || "icm-delhi";
  const config = COMPANY_CONFIG[tenantId] || COMPANY_CONFIG["icm-delhi"];
  
  const seq = await getNextSeq("invoice");
  const fy = getFinancialYear();
  
  return `${config.loc}/${seq}/${fy}`;
}

export async function generateQuoteNumber() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || "icm-delhi";
  const config = COMPANY_CONFIG[tenantId] || COMPANY_CONFIG["icm-delhi"];
  
  const seq = await getNextSeq("quote");
  const fy = getFinancialYear();
  
  return `QT/${config.short}/${seq}/${fy}`;
}

export async function generateHawbNumber(destPort: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || "icm-delhi";
  const config = COMPANY_CONFIG[tenantId] || COMPANY_CONFIG["icm-delhi"];
  
  const seq = await getNextSeq("hawb");
  const destCode = extractPortCode(destPort);
  
  return `${config.short}(${destCode})${seq}`;
}

export async function generateHblNumber(destPort: string) {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value || "icm-delhi";
  const config = COMPANY_CONFIG[tenantId] || COMPANY_CONFIG["icm-delhi"];
  
  const seq = await getNextSeq("hbl");
  const destCode = extractPortCode(destPort);
  
  return `${config.loc}/(${destCode})${seq}`;
}

function extractPortCode(port: string) {
  if (!port) return "XXX";
  // If it's a 5-letter locode like INBOM, take last 3
  if (port.length === 5) return port.slice(2).toUpperCase();
  // Otherwise take first 3 letters
  return port.slice(0, 3).toUpperCase();
}
