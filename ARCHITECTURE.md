# 🏗️ System Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React + TypeScript)              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Login   │  │  Posts   │  │  Admin   │  │  Profile │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         │              │              │              │       │
│         └──────────────┴──────────────┴──────────────┘       │
│                          │                                    │
│                    tRPC Client                                │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    HTTP/JSON (Type-Safe)
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    tRPC Server                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Routers (Express)                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          │   │
│  │  │   Auth   │  │  Posts   │  │  Admin   │  User    │   │
│  │  └──────────┘  └──────────┘  └──────────┘          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           RBAC & Permission Layer                     │   │
│  │  • Role Verification                                  │   │
│  │  • Permission Checks                                  │   │
│  │  • Ownership Validation                               │   │
│  │  • Audit Logging                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Database Layer (Drizzle ORM)                │   │
│  │  • User Management                                    │   │
│  │  • Post Operations                                    │   │
│  │  • Audit Logging                                      │   │
│  │  • Session Management                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────┼──────────────────────────────────┘
                           │
                      SQL Queries
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    MySQL Database                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  users   │  │  posts   │  │ comments │  │  shares  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ sessions │  │ notifs   │  │ versions │  │categories│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐                                 │
│  │auditLogs │  │tempRoles │                                 │
│  └──────────┘  └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

## Request Flow

### Example: Create Post with Comment

```
1. User Action
   └─> Click "Create Post" button

2. Frontend (React)
   └─> trpc.posts.create.mutate({ title, content, ... })

3. tRPC Client
   └─> POST /api/trpc/posts.create
       Headers: { Authorization: "Bearer <JWT>" }
       Body: { title, content, status, visibility }

4. tRPC Server
   └─> Validate JWT token
   └─> Extract user from token
   └─> Call posts.create procedure

5. RBAC Layer
   └─> Check: hasPermission(user, "posts:create")
   └─> Generate correlation ID
   └─> Log audit event (attempt)

6. Database Layer
   └─> db.insert(posts).values({ ... })
   └─> Create post version
   └─> Log audit event (success)

7. Response
   └─> Return created post
   └─> Frontend updates UI
   └─> Show success notification

8. Notification Flow (if shared)
   └─> Create notification for shared users
   └─> Store in notifications table
   └─> Frontend polls/receives notification
```

## Database Schema

### Core Tables

```
users
├── id (PK)
├── openId (unique)
├── name
├── email
├── passwordHash
├── role (admin/editor/viewer)
├── customRoleId (FK)
└── timestamps

posts
├── id (PK)
├── title
├── content
├── authorId (FK -> users)
├── status (draft/published)
├── visibility (private/internal/public)
├── tags
├── version
└── timestamps

auditLogs
├── id (PK)
├── userId (FK -> users)
├── action
├── resourceType
├── resourceId
├── allowed
├── denialReason
├── correlationId
├── metadata
└── createdAt
```

### New Feature Tables

```
userSessions
├── id (PK)
├── userId (FK -> users)
├── token
├── ipAddress
├── userAgent
├── expiresAt
└── createdAt

notifications
├── id (PK)
├── userId (FK -> users)
├── type
├── title
├── message
├── read
├── relatedResourceType
├── relatedResourceId
└── createdAt

postVersions
├── id (PK)
├── postId (FK -> posts)
├── title
├── content
├── versionNumber
├── editedBy (FK -> users)
└── createdAt

postComments
├── id (PK)
├── postId (FK -> posts)
├── userId (FK -> users)
├── content
└── timestamps

postShares
├── id (PK)
├── postId (FK -> posts)
├── sharedWithUserId (FK -> users)
├── sharedByUserId (FK -> users)
├── canEdit
└── createdAt

postCategories
├── id (PK)
├── name (unique)
├── description
└── createdAt

temporaryRoleAssignments
├── id (PK)
├── userId (FK -> users)
├── temporaryRole
├── expiresAt
├── grantedBy (FK -> users)
├── reason
└── createdAt
```

## Security Layers

```
┌─────────────────────────────────────────┐
│         Layer 1: Authentication          │
│  • JWT Token Validation                  │
│  • Session Verification                  │
│  • Password Hashing (bcrypt)             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Layer 2: Authorization           │
│  • Role-Based Permissions                │
│  • Custom Role Support                   │
│  • Temporary Role Checks                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Layer 3: Ownership               │
│  • Resource Ownership Verification       │
│  • Row-Level Security                    │
│  • Share Permission Checks               │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Layer 4: Audit Logging           │
│  • All Actions Logged                    │
│  • Correlation IDs                       │
│  • Success/Failure Tracking              │
└─────────────────────────────────────────┘
```

## Permission Matrix

```
┌──────────────┬───────┬────────┬────────┐
│ Permission   │ Admin │ Editor │ Viewer │
├──────────────┼───────┼────────┼────────┤
│ posts:create │   ✓   │   ✓    │   ✗    │
│ posts:read   │   ✓   │   ✓    │   ✓    │
│ posts:update │   ✓   │  own   │   ✗    │
│ posts:delete │   ✓   │  own   │   ✗    │
│ users:manage │   ✓   │   ✗    │   ✗    │
│ audit:read   │   ✓   │   ✗    │   ✗    │
└──────────────┴───────┴────────┴────────┘

Legend:
✓ = Full access
own = Own resources only
✗ = No access
```

## Feature Integration Map

```
User Registration
    ↓
Password Hashing (bcrypt)
    ↓
User Created in DB
    ↓
Session Created
    ↓
JWT Token Issued
    ↓
User Logged In
    ↓
┌─────────────────────────────────┐
│     Available Features          │
├─────────────────────────────────┤
│ • Create Posts                  │
│ • Add Comments                  │
│ • Share Posts                   │
│ • Receive Notifications         │
│ • View Version History          │
│ • Manage Profile                │
│ • View Sessions                 │
└─────────────────────────────────┘
    ↓
All Actions Logged in Audit Trail
```

## Technology Stack

```
Frontend
├── React 19
├── TypeScript
├── TailwindCSS
├── shadcn/ui
└── tRPC Client

Backend
├── Node.js
├── Express 4
├── tRPC 11
├── TypeScript
└── Zod (validation)

Database
├── MySQL 8
├── Drizzle ORM
└── Docker

Authentication
├── JWT (jose)
├── bcrypt
└── Session Management

Development
├── Vite
├── tsx
└── pnpm
```

## Deployment Architecture (Future)

```
┌─────────────────────────────────────────┐
│            Load Balancer                 │
└─────────────────────────────────────────┘
                    ↓
    ┌───────────────┴───────────────┐
    ↓                               ↓
┌─────────┐                   ┌─────────┐
│ Server 1│                   │ Server 2│
└─────────┘                   └─────────┘
    ↓                               ↓
    └───────────────┬───────────────┘
                    ↓
        ┌───────────────────────┐
        │   MySQL Cluster       │
        │  (Primary + Replica)  │
        └───────────────────────┘
                    ↓
        ┌───────────────────────┐
        │   Redis Cache         │
        │  (Session Store)      │
        └───────────────────────┘
```

## Scalability Considerations

### Database Optimization
- Indexed columns for fast queries
- Connection pooling
- Query optimization
- Pagination support

### Caching Strategy
- Permission matrix caching
- Session caching
- User role caching
- Query result caching

### Performance
- Lazy loading
- Pagination
- Efficient queries
- Minimal data transfer

## Monitoring & Logging

```
Application Logs
    ↓
┌─────────────────────────────────┐
│     Structured Logging          │
│  • Correlation IDs              │
│  • Timestamps                   │
│  • User Context                 │
│  • Action Details               │
└─────────────────────────────────┘
    ↓
Audit Database
    ↓
┌─────────────────────────────────┐
│     Analytics & Reports         │
│  • User Activity                │
│  • Permission Denials           │
│  • System Health                │
│  • Security Events              │
└─────────────────────────────────┘
```

## Error Handling Flow

```
Error Occurs
    ↓
┌─────────────────────────────────┐
│     Error Classification        │
│  • Validation Error             │
│  • Permission Denied            │
│  • Database Error               │
│  • System Error                 │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│     Error Logging               │
│  • Log to audit trail           │
│  • Include correlation ID       │
│  • Store error details          │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│     User Response               │
│  • Friendly error message       │
│  • Appropriate HTTP status      │
│  • Actionable feedback          │
└─────────────────────────────────┘
```

---

This architecture supports:
- ✅ High scalability
- ✅ Security best practices
- ✅ Comprehensive auditing
- ✅ Easy maintenance
- ✅ Future enhancements
