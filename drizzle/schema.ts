import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with RBAC role field to support Admin, Editor, and Viewer roles.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  // Enhanced role field: admin, editor, viewer (replaces previous user/admin enum)
  role: mysqlEnum("role", ["admin", "editor", "viewer"]).default("viewer").notNull(),
  // Optional custom role reference for fine-grained permissions (null = none)
  customRoleId: int("customRoleId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  roleIdx: index("role_idx").on(table.role),
  passwordIdx: index("password_idx").on(table.passwordHash),
  customRoleIdx: index("customRole_idx").on(table.customRoleId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Posts/Content table with ownership tracking for row-level access control.
 * Editors can create and edit their own posts; Admins can edit any post.
 */
export const posts = mysqlTable("posts", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  // Author (owner) of the post - used for ownership checks
  authorId: int("authorId").notNull(),
  // Published status: draft or published
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(),
  // Visibility: private (owner only), internal (authenticated users), public
  visibility: mysqlEnum("visibility", ["private", "internal", "public"]).default("private").notNull(),
  // Tags as comma-separated string
  tags: text("tags"),
  // Version number for tracking changes
  version: int("version").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdIdx: index("authorId_idx").on(table.authorId),
  statusIdx: index("status_idx").on(table.status),
  visibilityIdx: index("visibility_idx").on(table.visibility),
}));

export type Post = typeof posts.$inferSelect;
export type InsertPost = typeof posts.$inferInsert;

/**
 * Audit log table for tracking authorization events and sensitive operations.
 * Includes correlation IDs for request tracing.
 */
export const auditLogs = mysqlTable("auditLogs", {
  id: int("id").autoincrement().primaryKey(),
  // User who performed the action
  userId: int("userId").notNull(),
  // Type of action: create, read, update, delete, admin_action
  action: varchar("action", { length: 64 }).notNull(),
  // Resource type: post, user, role, etc.
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  // Resource ID (e.g., post ID, user ID)
  resourceId: int("resourceId"),
  // Whether the action was allowed (true) or denied (false)
  allowed: boolean("allowed").default(true).notNull(),
  // Reason for denial if action was not allowed
  denialReason: varchar("denialReason", { length: 255 }),
  // Correlation ID for request tracing
  correlationId: varchar("correlationId", { length: 64 }),
  // Additional metadata as JSON
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  actionIdx: index("action_idx").on(table.action),
  resourceTypeIdx: index("resourceType_idx").on(table.resourceType),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Role definitions and permissions matrix.
 * Stores the capabilities each role has (e.g., can create posts, can delete users).
 */
export const rolePermissions = mysqlTable("rolePermissions", {
  id: int("id").autoincrement().primaryKey(),
  // Role name: admin, editor, viewer
  role: mysqlEnum("role", ["admin", "editor", "viewer"]).notNull(),
  // Permission/capability: posts:create, posts:update, posts:delete, users:manage, etc.
  permission: varchar("permission", { length: 128 }).notNull(),
  // Description of what this permission allows
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  rolePermissionIdx: index("role_permission_idx").on(table.role, table.permission),
}));

export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = typeof rolePermissions.$inferInsert;

/**
 * Custom roles created by admin for bespoke permission sets.
 */
export const customRoles = mysqlTable("customRoles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  nameIdx: index("customRole_name_idx").on(table.name),
}));

export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomRole = typeof customRoles.$inferInsert;

/**
 * Permissions attached to a custom role.
 */
export const customRolePermissions = mysqlTable("customRolePermissions", {
  id: int("id").autoincrement().primaryKey(),
  customRoleId: int("customRoleId").notNull(),
  permission: varchar("permission", { length: 128 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  customRolePermIdx: index("customRole_perm_idx").on(table.customRoleId, table.permission),
}));

export type CustomRolePermission = typeof customRolePermissions.$inferSelect;
export type InsertCustomRolePermission = typeof customRolePermissions.$inferInsert;

/**
 * User sessions for tracking active logins
 */
export const userSessions = mysqlTable("userSessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("session_userId_idx").on(table.userId),
  tokenIdx: index("session_token_idx").on(table.token),
}));

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

/**
 * Password reset tokens
 */
export const passwordResets = mysqlTable("passwordResets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tokenIdx: index("reset_token_idx").on(table.token),
  userIdIdx: index("reset_userId_idx").on(table.userId),
}));

export type PasswordReset = typeof passwordResets.$inferSelect;
export type InsertPasswordReset = typeof passwordResets.$inferInsert;

/**
 * Notifications for users
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  relatedResourceType: varchar("relatedResourceType", { length: 64 }),
  relatedResourceId: int("relatedResourceId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("notification_userId_idx").on(table.userId),
  readIdx: index("notification_read_idx").on(table.read),
}));

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Post versions for tracking changes
 */
export const postVersions = mysqlTable("postVersions", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  versionNumber: int("versionNumber").notNull(),
  editedBy: int("editedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("version_postId_idx").on(table.postId),
}));

export type PostVersion = typeof postVersions.$inferSelect;
export type InsertPostVersion = typeof postVersions.$inferInsert;

/**
 * Post comments
 */
export const postComments = mysqlTable("postComments", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  postIdIdx: index("comment_postId_idx").on(table.postId),
  userIdIdx: index("comment_userId_idx").on(table.userId),
}));

export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

/**
 * Post shares - track who has access to specific posts
 */
export const postShares = mysqlTable("postShares", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  sharedWithUserId: int("sharedWithUserId").notNull(),
  sharedByUserId: int("sharedByUserId").notNull(),
  canEdit: boolean("canEdit").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("share_postId_idx").on(table.postId),
  sharedWithIdx: index("share_sharedWith_idx").on(table.sharedWithUserId),
}));

export type PostShare = typeof postShares.$inferSelect;
export type InsertPostShare = typeof postShares.$inferInsert;

/**
 * Post categories/tags
 */
export const postCategories = mysqlTable("postCategories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PostCategory = typeof postCategories.$inferSelect;
export type InsertPostCategory = typeof postCategories.$inferInsert;

/**
 * Post to category mapping
 */
export const postCategoryMappings = mysqlTable("postCategoryMappings", {
  id: int("id").autoincrement().primaryKey(),
  postId: int("postId").notNull(),
  categoryId: int("categoryId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  postIdIdx: index("mapping_postId_idx").on(table.postId),
  categoryIdIdx: index("mapping_categoryId_idx").on(table.categoryId),
}));

export type PostCategoryMapping = typeof postCategoryMappings.$inferSelect;
export type InsertPostCategoryMapping = typeof postCategoryMappings.$inferInsert;

/**
 * Temporary role assignments
 */
export const temporaryRoleAssignments = mysqlTable("temporaryRoleAssignments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  temporaryRole: mysqlEnum("temporaryRole", ["admin", "editor", "viewer"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  grantedBy: int("grantedBy").notNull(),
  reason: text("reason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("tempRole_userId_idx").on(table.userId),
  expiresAtIdx: index("tempRole_expiresAt_idx").on(table.expiresAt),
}));

export type TemporaryRoleAssignment = typeof temporaryRoleAssignments.$inferSelect;
export type InsertTemporaryRoleAssignment = typeof temporaryRoleAssignments.$inferInsert;