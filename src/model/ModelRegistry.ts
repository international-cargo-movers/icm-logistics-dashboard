import { Connection, Model, Schema } from "mongoose";
import { getTenantDb } from "@/lib/mongodb";
import { getCurrentTenantDb } from "@/lib/tenant";

/**
 * Registry to keep track of models across different connections to avoid re-compilation errors.
 */
const modelRegistry: Record<string, Model<any>> = {};

export async function getModel<T>(name: string, schema: Schema): Promise<Model<T>> {
  const dbName = await getCurrentTenantDb();
  const conn = await getTenantDb(dbName);
  
  const key = `${dbName}-${name}`;
  if (conn.models[name]) {
    return conn.models[name];
  }
  
  return conn.model<T>(name, schema);
}

/**
 * Specifically for the Admin database (Users, etc.)
 */
export async function getAdminModel<T>(name: string, schema: Schema): Promise<Model<T>> {
  const conn = await getTenantDb("icm_admin");
  if (conn.models[name]) {
    return conn.models[name];
  }
  return conn.model<T>(name, schema);
}
