import bcrypt from "bcryptjs";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";

export function hashPassword(plain: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(plain, salt);
}

export async function verifyPassword(plain: string, hashOrPlain: string): Promise<boolean> {
  // If a hash is provided, verify; if not, compare as plain (for simple demos)
  if (hashOrPlain.startsWith("$2a$") || hashOrPlain.startsWith("$2b$") || hashOrPlain.startsWith("$2y$")) {
    return bcrypt.compare(plain, hashOrPlain);
  }
  return plain === hashOrPlain;
}

export async function verifyOwnerCredentials(username: string, password: string): Promise<{ openId: string; name: string } | null> {
  const configuredUser = ENV.ownerOpenId || "admin";
  const configuredName = ENV.ownerName || "Admin";
  const passwordSource = ENV.ownerPasswordHash || ENV.ownerPassword || "";
  if (!ENV.localAuthEnabled) return null;
  if (!passwordSource) return null;
  if (username !== configuredUser) return null;
  const ok = await verifyPassword(password, passwordSource);
  return ok ? { openId: configuredUser, name: configuredName } : null;
}

export function makeLocalUser(openId: string, name: string): User {
  // Minimal in-memory user for offline mode
  const adminOpenId = ENV.ownerOpenId || "admin";
  return {
    id: 0,
    openId,
    name,
    email: null,
    loginMethod: "local",
    role: (openId === adminOpenId ? "admin" : "viewer") as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as unknown as User;
}
