/**
 * Seed script for demo users and role permissions
 * Run with: node server/seed.mjs
 */

import { drizzle } from "drizzle-orm/mysql2";
import { users, rolePermissions } from "./drizzle/schema.js";

if (!process.env.DATABASE_URL) {
  console.error("[Seed] ❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

async function seed() {
  console.log("[Seed] Starting database seeding...");

  try {
    // Seed demo users
    console.log("[Seed] Creating demo users...");

    const demoUsers = [
      {
        openId: "admin-demo-001",
        name: "Admin User",
        email: "admin@example.com",
        loginMethod: "demo",
        role: "admin",
      },
      {
        openId: "editor-demo-001",
        name: "Editor User",
        email: "editor@example.com",
        loginMethod: "demo",
        role: "editor",
      },
      {
        openId: "editor-demo-002",
        name: "Editor User 2",
        email: "editor2@example.com",
        loginMethod: "demo",
        role: "editor",
      },
      {
        openId: "viewer-demo-001",
        name: "Viewer User",
        email: "viewer@example.com",
        loginMethod: "demo",
        role: "viewer",
      },
    ];

    for (const user of demoUsers) {
      try {
        await db.insert(users).values({
          ...user,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        });
        console.log(`  ✓ Created user: ${user.name} (${user.role})`);
      } catch (err) {
        console.error(`  ✗ Failed to create user ${user.name}:`, err.message);
      }
    }

    // Seed role permissions
    console.log("[Seed] Creating role permissions...");

    const permissions = [
      // Admin permissions
      { role: "admin", permission: "posts:create", description: "Create posts" },
      { role: "admin", permission: "posts:read", description: "Read all posts" },
      { role: "admin", permission: "posts:update", description: "Update any post" },
      { role: "admin", permission: "posts:delete", description: "Delete any post" },
      { role: "admin", permission: "users:read", description: "Read user list" },
      { role: "admin", permission: "users:create", description: "Create users" },
      { role: "admin", permission: "users:update", description: "Update users" },
      { role: "admin", permission: "users:delete", description: "Delete users" },
      { role: "admin", permission: "users:manage", description: "Manage users and roles" },
      { role: "admin", permission: "roles:manage", description: "Manage roles" },
      { role: "admin", permission: "permissions:manage", description: "Manage permissions" },
      { role: "admin", permission: "audit:read", description: "Read audit logs" },

      // Editor permissions
      { role: "editor", permission: "posts:create", description: "Create posts" },
      { role: "editor", permission: "posts:read", description: "Read published posts" },
      { role: "editor", permission: "posts:update_own", description: "Update own posts" },
      { role: "editor", permission: "posts:delete_own", description: "Delete own posts" },

      // Viewer permissions
      { role: "viewer", permission: "posts:read", description: "Read published public posts" },
    ];

    for (const perm of permissions) {
      try {
        await db.insert(rolePermissions).values({
          ...perm,
          createdAt: new Date(),
        });
        console.log(`  ✓ Created permission: ${perm.role} - ${perm.permission}`);
      } catch (err) {
        console.error(`  ✗ Failed to create permission ${perm.permission}:`, err.message);
      }
    }

    console.log("[Seed] ✅ Database seeding completed successfully!");
    console.log("\nDemo Users Created:");
    console.log("  - Admin: admin@example.com (openId: admin-demo-001)");
    console.log("  - Editor: editor@example.com (openId: editor-demo-001)");
    console.log("  - Editor: editor2@example.com (openId: editor-demo-002)");
    console.log("  - Viewer: viewer@example.com (openId: viewer-demo-001)");
    console.log("\nNote: Use these openIds to test different roles in the application.");
  } catch (error) {
    console.error("[Seed] ❌ Error during seeding:", error);
    process.exit(1);
  }
}

seed();
