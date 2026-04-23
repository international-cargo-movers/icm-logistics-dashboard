import { cookies } from "next/headers";
import { INTERNAL_COMPANIES } from "./constants";

export async function getCurrentTenantDb() {
  const cookieStore = await cookies();
  const tenantId = cookieStore.get("tenant-id")?.value;
  
  const company = INTERNAL_COMPANIES.find(c => c.id === tenantId);
  return company?.dbName || "icm_admin"; // Default to admin if not set
}
