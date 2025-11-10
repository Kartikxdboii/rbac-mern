import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getAllCustomRolePermissions } from "../db";
import { primeCustomRolePermissions } from "../rbac";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  // Prime custom role permissions cache once per process start lazily
  if ((globalThis as any).__customRoleCachePrimed !== true) {
    try {
      const all = await getAllCustomRolePermissions();
      const grouped: Record<number, string[]> = {};
      for (const row of all) {
        (grouped[row.customRoleId] ||= []).push(row.permission);
      }
      for (const [roleId, perms] of Object.entries(grouped)) {
        primeCustomRolePermissions(Number(roleId), perms);
      }
      (globalThis as any).__customRoleCachePrimed = true;
    } catch {}
  }

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

