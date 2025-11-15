import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { posts, users } from '../drizzle/schema';
async function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const u = new URL(url);
  const pool = mysql.createPool({
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\
  });
  return drizzle(pool);
}
async function main() {
  const db = await getDb();
  console.log('[Seed] Creating sample posts...');
  const { eq } = await import('drizzle-orm');
  const adminUsers = await db.select().from(users).where(eq(users.openId, 'admin'));
  const adminUser = adminUsers[0];
  const editor1Users = await db.select().from(users).where(eq(users.openId, 'editor1'));
  const editor1User = editor1Users[0];
  if (!adminUser) {
    console.error('Admin user not found. Run seed script first.');
    process.exit(1);
  }
  const samplePosts = [
    {
      title: 'Welcome to FineAccess RBAC System',
      content: 'This is a comprehensive Role-Based Access Control system with 14 major features including user management, post versioning, comments, sharing, and notifications.',
      authorId: adminUser.id,
      status: 'published' as const,
      visibility: 'public' as const,
      tags: 'welcome, rbac, security',
    },
    {
      title: 'Understanding Role-Based Access Control',
      content: 'RBAC is a method of regulating access to resources based on the roles of individual users. Our system supports Admin, Editor, and Viewer roles with custom permissions.',
      authorId: adminUser.id,
      status: 'published' as const,
      visibility: 'public' as const,
      tags: 'rbac, security, tutorial',
    },
    {
      title: 'New Features: Comments and Sharing',
      content: 'We have added powerful collaboration features including real-time comments, post sharing with granular permissions, and version history tracking.',
      authorId: adminUser.id,
      status: 'published' as const,
      visibility: 'internal' as const,
      tags: 'features, collaboration, updates',
    },
    {
      title: 'Security Best Practices',
      content: 'Our system implements bcrypt password hashing, JWT authentication, session management, and comprehensive audit logging for maximum security.',
      authorId: adminUser.id,
      status: 'published' as const,
      visibility: 'public' as const,
      tags: 'security, best-practices, authentication',
    },
    {
      title: 'Draft: Upcoming Features',
      content: 'Planning to add email notifications, advanced search, and bulk operations in the next release.',
      authorId: adminUser.id,
      status: 'draft' as const,
      visibility: 'private' as const,
      tags: 'draft, roadmap, planning',
    },
  ];
  if (editor1User) {
    samplePosts.push(
      {
        title: 'My First Editor Post',
        content: 'This is a post created by editor1. I can edit and delete this post since I own it.',
        authorId: editor1User.id,
        status: 'published' as const,
        visibility: 'public' as const,
        tags: 'editor, test, demo',
      },
      {
        title: 'Editor Draft Post',
        content: 'This is a draft post by editor1. Only I can see and edit this.',
        authorId: editor1User.id,
        status: 'draft' as const,
        visibility: 'private' as const,
        tags: 'draft, editor',
      }
    );
  }
  for (const post of samplePosts) {
    await db.insert(posts).values(post);
    console.log(`  ✓ Created post: ${post.title}`);
  }
  console.log('\n[Seed] ✅ Sample posts created successfully!');
  console.log(`\nCreated ${samplePosts.length} posts for testing.`);
  process.exit(0);
}
main().catch(err => {
  console.error('[Seed] Failed:', err);
  process.exit(1);
});

