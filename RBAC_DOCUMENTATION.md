# Fine-Grained RBAC MERN Application Documentation

## 🎓 College Assignment - Enhanced Version

**📢 NEW**: This project has been significantly enhanced with **14 major features** for college assignment presentation!

**Quick Links:**
- 📋 [Features Summary](./FEATURES_SUMMARY.md) - Quick overview of all features
- 📚 [New Features Documentation](./NEW_FEATURES.md) - Detailed feature documentation
- 🔗 [API Reference](./API_REFERENCE.md) - Complete API documentation
- 🎤 [Presentation Guide](./PRESENTATION_GUIDE.md) - Presentation script and tips
- 🔑 [Login Information](./LOGIN_INFO.md) - Login credentials

---

## Overview

This is a comprehensive implementation of Role-Based Access Control (RBAC) in a MERN stack application. The system demonstrates enterprise-grade permission management with three distinct roles: **Admin**, **Editor**, and **Viewer**.

**Enhanced Features Include:**
- ✅ Multi-user registration with password management
- ✅ Session management and tracking
- ✅ In-app notifications system
- ✅ Post versioning and history
- ✅ Comments and collaboration
- ✅ Post sharing with permissions
- ✅ Categories and tags
- ✅ Temporary role assignments
- ✅ Comprehensive audit logging
- ✅ And much more!

## Architecture

### Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Express 4, Node.js, tRPC 11
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth with JWT tokens
- **Validation**: Zod for input validation

### Core Components

#### Backend

1. **RBAC Module** (`server/rbac.ts`)
   - Permission matrix definition
   - Permission checking functions
   - Role-based middleware
   - Ownership verification

2. **Database Layer** (`server/db.ts`)
   - User management queries
   - Post CRUD operations
   - Audit logging
   - Role permissions management

3. **API Routers**
   - **Posts Router** (`server/routers/posts.ts`): CRUD operations with role-based filtering
   - **Admin Router** (`server/routers/admin.ts`): User management and system statistics

4. **Security & Logging**
   - Input validation and sanitization
   - Structured logging with correlation IDs
   - Audit trail for authorization events

#### Frontend

1. **Permission Hooks** (`client/src/hooks/usePermissions.ts`)
   - Permission checking utilities
   - Role verification functions

2. **Access Control Components**
   - `PermissionGate`: Conditional rendering based on permissions
   - `PermissionGateWrapper`: Disable UI elements without hiding
   - `ProtectedRoute`: Route-level access control

3. **Pages**
   - **Home**: Dashboard with role information
   - **Posts**: Content management with RBAC
   - **Admin**: User and role management (admin only)

### Database Schema

#### Users Table
```sql
- id: Primary key
- openId: OAuth identifier
- name: User name
- email: Email address
- role: admin | editor | viewer
- createdAt, updatedAt, lastSignedIn: Timestamps
```

#### Posts Table
```sql
- id: Primary key
- title: Post title
- content: Post content
- authorId: Foreign key to users
- status: draft | published
- visibility: private | internal | public
- createdAt, updatedAt: Timestamps
```

#### Audit Logs Table
```sql
- id: Primary key
- userId: User who performed action
- action: Type of action (create, read, update, delete)
- resourceType: Type of resource (post, user)
- resourceId: ID of affected resource
- allowed: Whether action was permitted
- denialReason: Reason for denial if not allowed
- correlationId: Request tracing ID
- metadata: Additional context
- createdAt: Timestamp
```

#### Role Permissions Table
```sql
- id: Primary key
- role: admin | editor | viewer
- permission: Permission identifier (e.g., posts:create)
- description: Human-readable description
- createdAt: Timestamp
```

## Role Definitions

### Admin
**Full system access with user management capabilities**

**Permissions:**
- `posts:create` - Create posts
- `posts:read` - Read all posts
- `posts:update` - Update any post
- `posts:delete` - Delete any post
- `users:read` - View user list
- `users:create` - Create users
- `users:update` - Update users
- `users:delete` - Delete users
- `users:manage` - Manage users and roles
- `roles:manage` - Manage role definitions
- `permissions:manage` - Manage permissions
- `audit:read` - View audit logs

**UI Access:**
- Full admin dashboard
- User management interface
- Permission matrix viewer
- Audit log viewer
- System statistics

### Editor
**Content creation and management with ownership controls**

**Permissions:**
- `posts:create` - Create new posts
- `posts:read` - Read published posts
- `posts:update_own` - Update own posts only
- `posts:delete_own` - Delete own posts only

**UI Access:**
- Create and edit own posts
- View published posts from other editors
- Cannot access admin features

### Viewer
**Read-only access to published public content**

**Permissions:**
- `posts:read` - Read published public posts only

**UI Access:**
- View published public posts
- Cannot create, edit, or delete content
- No access to admin features

## API Endpoints

### Posts API

#### List Posts
```
POST /api/trpc/posts.list
Input: { limit: number, offset: number }
Response: { posts: Post[], total: number, limit: number, offset: number }
```

#### Get Post
```
POST /api/trpc/posts.get
Input: { id: number }
Response: Post
```

#### Create Post
```
POST /api/trpc/posts.create
Input: { title: string, content: string, status: string, visibility: string }
Response: Post
```

#### Update Post
```
POST /api/trpc/posts.update
Input: { id: number, title?: string, content?: string, status?: string, visibility?: string }
Response: Post
```

#### Delete Post
```
POST /api/trpc/posts.delete
Input: { id: number }
Response: { success: boolean }
```

### Admin API

#### List Users
```
POST /api/trpc/admin.users
Input: { limit: number, offset: number }
Response: { users: User[], total: number, limit: number, offset: number }
```

#### Update User Role
```
POST /api/trpc/admin.updateUserRole
Input: { userId: number, role: "admin" | "editor" | "viewer" }
Response: User
```

#### Get Audit Logs
```
POST /api/trpc/admin.auditLogs
Input: { limit: number, offset: number }
Response: AuditLog[]
```

#### Get Role Permissions
```
POST /api/trpc/admin.rolePermissions
Response: RolePermission[]
```

#### Get Statistics
```
POST /api/trpc/admin.stats
Response: { totalUsers: number, roleStats: {...}, recentDenials: {...} }
```

## Security Features

### Input Validation
- String length validation
- Email format validation
- Enum validation for roles and statuses
- XSS prevention through sanitization

### Access Control
- JWT-based authentication
- Role-based authorization
- Ownership verification for row-level security
- Deny-by-default authorization model

### Audit Logging
- All authorization events logged
- Correlation IDs for request tracing
- Structured logging with context
- Denial reasons tracked

### Data Protection
- Secure password handling (via OAuth)
- httpOnly cookies for session management
- CORS configuration
- SQL injection prevention (via ORM)

## Development Guide

### Setting Up the Project

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Configure environment**
   - Database connection string
   - OAuth credentials
   - JWT secret

3. **Run migrations**
   ```bash
   pnpm db:push
   ```

4. **Seed demo data**
   ```bash
   node server/seed.mjs
   ```

5. **Start development server**
   ```bash
   pnpm dev
   ```

### Adding New Permissions

1. **Define permission in RBAC matrix** (`server/rbac.ts`)
   ```typescript
   export const ROLE_PERMISSIONS: Record<string, string[]> = {
     admin: [..., "new:permission"],
     // ...
   };
   ```

2. **Add to database** (via seed or migration)
   ```typescript
   await db.insert(rolePermissions).values({
     role: "admin",
     permission: "new:permission",
     description: "Description of permission",
   });
   ```

3. **Use in procedures** (`server/routers/posts.ts`)
   ```typescript
   if (!hasPermission(ctx.user, "new:permission")) {
     throwPermissionDenied();
   }
   ```

4. **Update frontend** (`client/src/hooks/usePermissions.ts`)
   ```typescript
   export const ROLE_PERMISSIONS: Record<string, string[]> = {
     admin: [..., "new:permission"],
     // ...
   };
   ```

### Adding New Roles

1. **Update database schema** (`drizzle/schema.ts`)
   ```typescript
   role: mysqlEnum("role", ["admin", "editor", "viewer", "newrole"])
   ```

2. **Run migration**
   ```bash
   pnpm db:push
   ```

3. **Define permissions** in RBAC matrix

4. **Update frontend** role types and permission matrix

### Testing Authorization

Use the demo users created by the seed script:
- **Admin**: openId `admin-demo-001`
- **Editor**: openId `editor-demo-001`
- **Viewer**: openId `viewer-demo-001`

### Monitoring Authorization

1. **View audit logs** in Admin Dashboard
2. **Check statistics** for denial patterns
3. **Review correlation IDs** for request tracing

## Best Practices

### Backend
- Always check permissions before database operations
- Log all authorization events
- Use correlation IDs for request tracing
- Validate and sanitize all inputs
- Implement ownership checks for row-level security

### Frontend
- Use `usePermissions` hook for permission checks
- Wrap protected routes with `ProtectedRoute`
- Use `PermissionGate` for conditional rendering
- Show helpful error messages for permission denials
- Disable UI elements instead of hiding them when appropriate

### General
- Keep permission matrix in sync between frontend and backend
- Document all permissions clearly
- Test with different roles regularly
- Monitor audit logs for suspicious patterns
- Keep audit logs for compliance

## Troubleshooting

### User Can't Access Feature
1. Check user role in admin panel
2. Verify permission is assigned to role
3. Check audit logs for denial reason
4. Verify ownership if row-level security applies

### Permission Denied Errors
1. Check correlation ID in audit logs
2. Verify user has required permission
3. Check ownership for row-level operations
4. Validate input data format

### Audit Logs Not Appearing
1. Verify database connection
2. Check logging configuration
3. Review error logs for failures
4. Ensure correlation IDs are being generated

## Performance Considerations

### Database Indexes
- Role index on users table
- Author ID index on posts table
- Status and visibility indexes on posts
- User ID and action indexes on audit logs

### Query Optimization
- Use role-based filtering to limit result sets
- Implement pagination for large datasets
- Cache permission matrices when possible
- Use database indexes for common filters

### Caching
- Cache role permissions in memory
- Invalidate cache on permission changes
- Consider caching user roles

## Compliance & Security

### GDPR Compliance
- Audit logs track data access
- User data can be exported
- Deletion requests can be logged

### Security Audit Trail
- All authorization events logged
- Correlation IDs enable request tracing
- Denial reasons documented
- Timestamps for all events

### Access Control Testing
- Test each role's capabilities
- Verify ownership checks work
- Test permission denials
- Validate audit logging

## Future Enhancements

1. ~~**Dynamic Roles**: Allow custom role creation~~ ✅ **IMPLEMENTED**
2. **Attribute-Based Access Control (ABAC)**: Add attribute-based permissions
3. ~~**Time-Based Access**: Implement temporary access grants~~ ✅ **IMPLEMENTED**
4. **Delegation**: Allow users to delegate permissions
5. **Two-Factor Authentication**: Add 2FA support
6. **API Rate Limiting**: Implement per-role rate limits
7. ~~**Real-time Notifications**: Alert on suspicious activity~~ ✅ **IMPLEMENTED**
8. **Advanced Analytics**: Dashboard for access patterns
9. ~~**Post Versioning**: Track content changes~~ ✅ **IMPLEMENTED**
10. ~~**Collaboration Features**: Comments and sharing~~ ✅ **IMPLEMENTED**

## Support & Maintenance

### Regular Tasks
- Review audit logs weekly
- Monitor authorization denial patterns
- Update permissions as needed
- Test with all roles monthly

### Backup & Recovery
- Regular database backups
- Audit log retention policy
- Disaster recovery procedures

## License

This project is provided as-is for demonstration purposes.
