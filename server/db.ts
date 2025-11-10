import { eq, and, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, posts, auditLogs, rolePermissions, Post, AuditLog, RolePermission, customRoles, customRolePermissions } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: any | null = null;
let _pool: mysql.Pool | null = null;

function initPool(url: string) {
  try {
    const u = new URL(url);
    if (!u.protocol.startsWith('mysql')) {
      throw new Error(`Unsupported DATABASE_URL protocol: ${u.protocol}`);
    }
    _pool = mysql.createPool({
      host: u.hostname,
      port: u.port ? Number(u.port) : 3306,
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
      waitForConnections: true,
      connectionLimit: 5,
    });
  } catch (err) {
    console.warn('[Database] Invalid DATABASE_URL:', err);
    _pool = null;
  }
}

// Lazily create the drizzle instance
export async function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) return null; // DB optional if not configured
  if (!_pool) initPool(url);
  if (_pool && !_db) {
    try {
      _db = drizzle(_pool as unknown as any);
    } catch (error) {
      console.warn('[Database] Failed to init drizzle:', error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    if (process.env.DEV_ALLOW_NO_DB === 'true' || process.env.NODE_ENV === 'development') {
      console.warn('[Database] Continuing without persistence (dev fallback)');
      return;
    }
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function setUserPassword(openId: string, passwordHash: string) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(users).set({ passwordHash: passwordHash, updatedAt: new Date() }).where(eq(users.openId, openId));
    return true;
  } catch (e) {
    console.error('[Database] Failed to set password', e);
    return false;
  }
}

export async function getUserWithPassword(openId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users);
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(userId: number, role: 'admin' | 'editor' | 'viewer') {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, userId));
  return getUserById(userId);
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.delete(users).where(eq(users.id, userId));
    return result;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Get posts visible to a user based on their role and ownership
 * Viewers see only published public posts
 * Editors see their own posts + published internal/public posts
 * Admins see all posts
 */
export async function getPostsForUser(userId: number, userRole: string) {
  const db = await getDb();
  if (!db) return [];

  if (userRole === 'admin') {
    // Admins see all posts
    return db.select().from(posts);
  }

  if (userRole === 'editor') {
    // Editors see their own posts + published internal/public posts
    return db.select().from(posts).where(
      or(
        eq(posts.authorId, userId),
        and(
          eq(posts.status, 'published'),
          or(
            eq(posts.visibility, 'internal'),
            eq(posts.visibility, 'public')
          )
        )
      )
    );
  }

  // Viewers see only published public posts
  return db.select().from(posts).where(
    and(
      eq(posts.status, 'published'),
      eq(posts.visibility, 'public')
    )
  );
}

/**
 * Get a single post with ownership check
 */
export async function getPostById(postId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Create a new post
 */
export async function createPost(data: { title: string; content: string; authorId: number; status: 'draft' | 'published'; visibility: 'private' | 'internal' | 'public' }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(posts).values(data);
  // Get the last inserted post for this author
  const result = await db.select().from(posts).where(eq(posts.authorId, data.authorId)).orderBy(() => posts.createdAt).limit(1);
  return result.length > 0 ? result[0] : null;
}

/**
 * Update a post
 */
export async function updatePost(postId: number, data: Partial<{ title: string; content: string; status: 'draft' | 'published'; visibility: 'private' | 'internal' | 'public' }>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(posts).set({ ...data, updatedAt: new Date() }).where(eq(posts.id, postId));
  return getPostById(postId);
}

/**
 * Delete a post
 */
export async function deletePost(postId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(posts).where(eq(posts.id, postId));
  return true;
}

/**
 * Log an authorization event
 */
export async function logAuditEvent(data: Omit<AuditLog, 'id' | 'createdAt'>) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(auditLogs).values(data);
  return result;
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(limit: number = 100, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(() => auditLogs.createdAt).limit(limit).offset(offset);
}

/**
 * Get role permissions
 */
export async function getRolePermissions(role: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rolePermissions).where(eq(rolePermissions.role, role as any));
}

/**
 * Get all role permissions (for admin panel)
 */
export async function getAllRolePermissions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rolePermissions);
}

/**
 * Seed role permissions
 */
export async function seedRolePermissions() {
  const db = await getDb();
  if (!db) return;

  const permissions: Omit<RolePermission, 'id' | 'createdAt'>[] = [
    // Admin permissions
    { role: 'admin', permission: 'posts:create', description: 'Create posts' },
    { role: 'admin', permission: 'posts:read', description: 'Read all posts' },
    { role: 'admin', permission: 'posts:update', description: 'Update any post' },
    { role: 'admin', permission: 'posts:delete', description: 'Delete any post' },
    { role: 'admin', permission: 'users:manage', description: 'Manage users and roles' },
    { role: 'admin', permission: 'audit:read', description: 'Read audit logs' },
    { role: 'admin', permission: 'permissions:manage', description: 'Manage permissions' },

    // Editor permissions
    { role: 'editor', permission: 'posts:create', description: 'Create posts' },
    { role: 'editor', permission: 'posts:read', description: 'Read published posts' },
    { role: 'editor', permission: 'posts:update_own', description: 'Update own posts' },
    { role: 'editor', permission: 'posts:delete_own', description: 'Delete own posts' },

    // Viewer permissions
    { role: 'viewer', permission: 'posts:read', description: 'Read published public posts' },
  ];

  // Clear existing permissions
  await db.delete(rolePermissions);

  // Insert new permissions
  for (const perm of permissions) {
    await db.insert(rolePermissions).values(perm);
  }
}

/**
 * Add a permission to a role
 */
export async function addRolePermission(role: string, permission: string, description?: string) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.insert(rolePermissions).values({
      role: role as any,
      permission,
      description: description || null,
      createdAt: new Date(),
    });
    return result;
  } catch (error) {
    console.error("Error adding permission:", error);
    throw error;
  }
}

/**
 * Remove a permission from a role
 */
export async function removeRolePermission(permissionId: number) {
  const db = await getDb();
  if (!db) return null;
  
  try {
    const result = await db.delete(rolePermissions).where(eq(rolePermissions.id, permissionId));
    return result;
  } catch (error) {
    console.error("Error removing permission:", error);
    throw error;
  }
}

/**
 * Get available permissions (all possible permissions)
 */
export async function getAvailablePermissions() {
  return [
    { id: 'posts:create', label: 'Create posts' },
    { id: 'posts:read', label: 'Read all posts' },
    { id: 'posts:update', label: 'Update any post' },
    { id: 'posts:delete', label: 'Delete any post' },
    { id: 'posts:update_own', label: 'Update own posts' },
    { id: 'posts:delete_own', label: 'Delete own posts' },
    { id: 'users:read', label: 'Read users' },
    { id: 'users:create', label: 'Create users' },
    { id: 'users:update', label: 'Update users' },
    { id: 'users:delete', label: 'Delete users' },
    { id: 'users:manage', label: 'Manage users and roles' },
    { id: 'roles:manage', label: 'Manage roles' },
    { id: 'permissions:manage', label: 'Manage permissions' },
    { id: 'audit:read', label: 'Read audit logs' },
  ];
}

// ===== Custom Roles API =====

export async function listCustomRoles() {
  const db = await getDb();
  if (!db) return [];
  const roles = await db.select().from(customRoles);
  return roles;
}

export async function createCustomRole(name: string, description?: string | null) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(customRoles).values({ name, description: description ?? null });
  const rows = await db.select().from(customRoles).where((c: any) => c.name.eq(name)).limit(1);
  return rows[0] ?? null;
}

export async function deleteCustomRole(roleId: number) {
  const db = await getDb();
  if (!db) return false;
  // delete role and its permissions (FK cascade recommended; do manual cleanup)
  await db.delete(customRolePermissions).where((t: any) => t.customRoleId.eq(roleId));
  await db.delete(customRoles).where((t: any) => t.id.eq(roleId));
  // clear custom role assignment from users
  await db.update(users).set({ customRoleId: null, updatedAt: new Date() }).where((t: any) => t.customRoleId.eq(roleId));
  return true;
}

export async function listCustomRolePermissions(roleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customRolePermissions).where((t: any) => t.customRoleId.eq(roleId));
}

export async function addCustomRolePermission(roleId: number, permission: string, description?: string | null) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(customRolePermissions).values({ customRoleId: roleId, permission, description: description ?? null });
  const rows = await db.select().from(customRolePermissions).where((t: any) => t.customRoleId.eq(roleId)).orderBy(() => customRolePermissions.createdAt);
  return rows[rows.length - 1] ?? null;
}

export async function removeCustomRolePermission(permissionId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(customRolePermissions).where((t: any) => t.id.eq(permissionId));
  return true;
}

export async function assignUserCustomRole(userId: number, roleId: number | null) {
  const db = await getDb();
  if (!db) return null;
  await db.update(users).set({ customRoleId: roleId, updatedAt: new Date() }).where((t: any) => t.id.eq(userId));
  return getUserById(userId);
}

export async function getAllCustomRolePermissions() {
  const db = await getDb();
  if (!db) return [] as { customRoleId: number; permission: string }[];
  const rows = await db.select({ customRoleId: customRolePermissions.customRoleId, permission: customRolePermissions.permission }).from(customRolePermissions);
  return rows as { customRoleId: number; permission: string }[];
}

// ===== User Registration & Password Management =====
import { hashPassword } from './_core/localAuth';
import { passwordResets, userSessions, notifications, postVersions, postComments, postShares, postCategories, postCategoryMappings, temporaryRoleAssignments } from '../drizzle/schema';
import { nanoid } from 'nanoid';

export async function registerUser(data: { name: string; email: string; password: string; role?: 'admin' | 'editor' | 'viewer' }) {
  const db = await getDb();
  if (!db) return null;
  const openId = `user-${nanoid(12)}`;
  const passwordHash = hashPassword(data.password);
  await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash,
    role: data.role || 'viewer',
    loginMethod: 'local',
  });
  return getUserByOpenId(openId);
}

export async function createPasswordResetToken(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  await db.insert(passwordResets).values({ userId, token, expiresAt });
  return token;
}

export async function verifyPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(passwordResets).where(and(eq(passwordResets.token, token), eq(passwordResets.used, false)));
  if (result.length === 0) return null;
  const reset = result[0];
  if (reset.expiresAt < new Date()) return null;
  return reset;
}

export async function markPasswordResetUsed(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResets).set({ used: true }).where(eq(passwordResets.token, token));
}

export async function resetUserPassword(userId: number, newPassword: string) {
  const db = await getDb();
  if (!db) return false;
  const passwordHash = hashPassword(newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
  return true;
}

// ===== Session Management =====

export async function createSession(userId: number, token: string, ipAddress?: string, userAgent?: string) {
  const db = await getDb();
  if (!db) return null;
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600000); // 7 days
  await db.insert(userSessions).values({ userId, token, ipAddress, userAgent, expiresAt });
  return token;
}

export async function getUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(userSessions).where(eq(userSessions.userId, userId));
}

export async function revokeSession(sessionId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(userSessions).where(eq(userSessions.id, sessionId));
  return true;
}

export async function revokeAllUserSessions(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
  return true;
}

// ===== Notifications =====

export async function createNotification(data: { userId: number; type: string; title: string; message: string; relatedResourceType?: string; relatedResourceId?: number }) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(notifications).values(data);
  return true;
}

export async function getUserNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (unreadOnly) {
    return db.select().from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.read, false))).orderBy(() => notifications.createdAt);
  }
  return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(() => notifications.createdAt);
}

export async function markNotificationRead(notificationId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId));
  return true;
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  return true;
}

// ===== Post Versions =====

export async function createPostVersion(postId: number, title: string, content: string, editedBy: number, versionNumber: number) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(postVersions).values({ postId, title, content, editedBy, versionNumber });
  return true;
}

export async function getPostVersions(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postVersions).where(eq(postVersions.postId, postId)).orderBy(() => postVersions.versionNumber);
}

// ===== Post Comments =====

export async function createComment(postId: number, userId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(postComments).values({ postId, userId, content });
  const result = await db.select().from(postComments).where(and(eq(postComments.postId, postId), eq(postComments.userId, userId))).orderBy(() => postComments.createdAt);
  return result[result.length - 1] || null;
}

export async function getPostComments(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postComments).where(eq(postComments.postId, postId)).orderBy(() => postComments.createdAt);
}

export async function updateComment(commentId: number, content: string) {
  const db = await getDb();
  if (!db) return null;
  await db.update(postComments).set({ content, updatedAt: new Date() }).where(eq(postComments.id, commentId));
  return true;
}

export async function deleteComment(commentId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(postComments).where(eq(postComments.id, commentId));
  return true;
}

// ===== Post Shares =====

export async function sharePost(postId: number, sharedWithUserId: number, sharedByUserId: number, canEdit = false) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(postShares).values({ postId, sharedWithUserId, sharedByUserId, canEdit });
  return true;
}

export async function getPostShares(postId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postShares).where(eq(postShares.postId, postId));
}

export async function getSharedWithMePosts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postShares).where(eq(postShares.sharedWithUserId, userId));
}

export async function revokePostShare(shareId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(postShares).where(eq(postShares.id, shareId));
  return true;
}

// ===== Post Categories =====

export async function createCategory(name: string, description?: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(postCategories).values({ name, description });
  const result = await db.select().from(postCategories).where(eq(postCategories.name, name));
  return result[0] || null;
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(postCategories);
}

export async function addPostToCategory(postId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(postCategoryMappings).values({ postId, categoryId });
  return true;
}

export async function removePostFromCategory(postId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(postCategoryMappings).where(and(eq(postCategoryMappings.postId, postId), eq(postCategoryMappings.categoryId, categoryId)));
  return true;
}

export async function getPostCategories(postId: number) {
  const db = await getDb();
  if (!db) return [];
  const mappings = await db.select().from(postCategoryMappings).where(eq(postCategoryMappings.postId, postId));
  const categoryIds = mappings.map(m => m.categoryId);
  if (categoryIds.length === 0) return [];
  return db.select().from(postCategories).where(or(...categoryIds.map(id => eq(postCategories.id, id))));
}

// ===== Temporary Role Assignments =====

export async function assignTemporaryRole(userId: number, temporaryRole: 'admin' | 'editor' | 'viewer', expiresAt: Date, grantedBy: number, reason?: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(temporaryRoleAssignments).values({ userId, temporaryRole, expiresAt, grantedBy, reason });
  return true;
}

export async function getActiveTemporaryRole(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(temporaryRoleAssignments).where(and(eq(temporaryRoleAssignments.userId, userId), (t: any) => t.expiresAt.gt(new Date()))).orderBy(() => temporaryRoleAssignments.expiresAt);
  return result[0] || null;
}

export async function revokeTemporaryRole(assignmentId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.delete(temporaryRoleAssignments).where(eq(temporaryRoleAssignments.id, assignmentId));
  return true;
}

export async function getUserTemporaryRoles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(temporaryRoleAssignments).where(eq(temporaryRoleAssignments.userId, userId)).orderBy(() => temporaryRoleAssignments.createdAt);
}
