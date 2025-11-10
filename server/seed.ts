import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { users, rolePermissions } from '../drizzle/schema';

async function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const u = new URL(url);
  const pool = mysql.createPool({
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  });
  return drizzle(pool);
}

async function main() {
  const db = await getDb();
  console.log('[Seed] Seeding demo users and permissions');

  const demoUsers = [
    { openId: 'admin-demo-001', name: 'Admin User', email: 'admin@example.com', loginMethod: 'demo', role: 'admin' as const },
    { openId: 'editor-demo-001', name: 'Editor User', email: 'editor@example.com', loginMethod: 'demo', role: 'editor' as const },
    { openId: 'viewer-demo-001', name: 'Viewer User', email: 'viewer@example.com', loginMethod: 'demo', role: 'viewer' as const },
  ];

  for (const user of demoUsers) {
    await db.insert(users).values({
      openId: user.openId,
      name: user.name,
      email: user.email,
      loginMethod: user.loginMethod,
      role: user.role,
    }).onDuplicateKeyUpdate({
      set: {
        name: user.name,
        email: user.email,
        loginMethod: user.loginMethod,
        role: user.role,
      }
    });
    console.log(`  ✓ user ${user.openId}`);
  }

  const permissions = [
    { role: 'admin' as const, permission: 'posts:create', description: 'Create posts' },
    { role: 'admin' as const, permission: 'posts:read', description: 'Read all posts' },
    { role: 'admin' as const, permission: 'posts:update', description: 'Update any post' },
    { role: 'admin' as const, permission: 'posts:delete', description: 'Delete any post' },
    { role: 'admin' as const, permission: 'users:manage', description: 'Manage users and roles' },
    { role: 'admin' as const, permission: 'audit:read', description: 'Read audit logs' },
    { role: 'editor' as const, permission: 'posts:create', description: 'Create posts' },
    { role: 'editor' as const, permission: 'posts:read', description: 'Read published posts' },
    { role: 'editor' as const, permission: 'posts:update_own', description: 'Update own posts' },
    { role: 'editor' as const, permission: 'posts:delete_own', description: 'Delete own posts' },
    { role: 'viewer' as const, permission: 'posts:read', description: 'Read published public posts' },
  ];

  await db.delete(rolePermissions);
  for (const perm of permissions) {
    await db.insert(rolePermissions).values({
      role: perm.role,
      permission: perm.permission,
      description: perm.description,
    });
  }
  console.log('  ✓ permissions seeded');

  // Seed categories
  console.log('[Seed] Creating post categories...');
  const { postCategories } = await import('../drizzle/schema.js');
  const categories = [
    { name: 'Technology', description: 'Tech-related posts' },
    { name: 'Business', description: 'Business and management posts' },
    { name: 'Education', description: 'Educational content' },
    { name: 'General', description: 'General discussion' },
  ];

  for (const cat of categories) {
    await db.insert(postCategories).values(cat).onDuplicateKeyUpdate({ set: { description: cat.description } });
  }
  console.log('  ✓ categories seeded');

  console.log('[Seed] done');
}

main().catch(err => {
  console.error('[Seed] failed', err);
  process.exit(1);
});
