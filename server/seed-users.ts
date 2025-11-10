import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { users } from '../drizzle/schema';
import { hashPassword } from './_core/localAuth';

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
  console.log('[Seed] Creating sample users...');

  const sampleUsers = [
    {
      openId: 'admin2',
      name: 'Admin User 2',
      email: 'admin2@fineaccess.com',
      passwordHash: hashPassword('pass123'),
      role: 'admin' as const,
      loginMethod: 'local',
    },
    {
      openId: 'editor1',
      name: 'Editor User 1',
      email: 'editor1@fineaccess.com',
      passwordHash: hashPassword('pass123'),
      role: 'editor' as const,
      loginMethod: 'local',
    },
    {
      openId: 'editor2',
      name: 'Editor User 2',
      email: 'editor2@fineaccess.com',
      passwordHash: hashPassword('pass123'),
      role: 'editor' as const,
      loginMethod: 'local',
    },
    {
      openId: 'editor3',
      name: 'Editor User 3',
      email: 'editor3@fineaccess.com',
      passwordHash: hashPassword('pass123'),
      role: 'editor' as const,
      loginMethod: 'local',
    },
    {
      openId: 'viewer1',
      name: 'Viewer User 1',
      email: 'viewer1@fineaccess.com',
      passwordHash: hashPassword('pass123'),
      role: 'viewer' as const,
      loginMethod: 'local',
    },
    {
      openId: 'viewer2',
      name: 'Viewer User 2',
      email: 'viewer2@fineaccess.com',
      passwordHash: hashPassword('pass123'),
      role: 'viewer' as const,
      loginMethod: 'local',
    },
  ];

  for (const user of sampleUsers) {
    await db.insert(users).values(user);
    console.log(`  ✓ Created ${user.role}: ${user.name} (${user.email})`);
  }

  console.log('\n[Seed] ✅ Sample users created successfully!');
  console.log('\n📋 Login Credentials (All passwords: pass123):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👤 ADMINS:');
  console.log('   Username: admin   | Password: pass123');
  console.log('   Username: admin2  | Password: pass123');
  console.log('');
  console.log('✏️  EDITORS:');
  console.log('   Username: editor1 | Password: pass123');
  console.log('   Username: editor2 | Password: pass123');
  console.log('   Username: editor3 | Password: pass123');
  console.log('');
  console.log('👁️  VIEWERS:');
  console.log('   Username: viewer1 | Password: pass123');
  console.log('   Username: viewer2 | Password: pass123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  process.exit(0);
}

main().catch(err => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});
