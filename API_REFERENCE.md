# API Reference - New Features

Quick reference guide for all new API endpoints.

## 🔐 Authentication & User Management

### Register User (Admin Only)
```typescript
trpc.admin.registerUser.mutate({
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'editor' | 'viewer'
})
```

### Request Password Reset (Admin Only)
```typescript
trpc.admin.requestPasswordReset.mutate({
  userId: number
})
// Returns: { token: string }
```

### Reset Password
```typescript
trpc.admin.resetPassword.mutate({
  token: string,
  newPassword: string
})
```

### Get User Profile
```typescript
trpc.user.profile.query()
```

### Update Profile
```typescript
trpc.user.updateProfile.mutate({
  name?: string,
  email?: string
})
```

### Change Password
```typescript
trpc.user.changePassword.mutate({
  currentPassword: string,
  newPassword: string
})
```

## 🎭 Session Management

### Get User Sessions
```typescript
trpc.user.sessions.query()
```

### Revoke Session
```typescript
trpc.user.revokeSession.mutate({
  sessionId: number
})
```

### Revoke All Sessions (Admin Only)
```typescript
trpc.admin.revokeAllSessions.mutate({
  userId: number
})
```

## 🔔 Notifications

### Get Notifications
```typescript
trpc.user.notifications.query({
  unreadOnly: boolean // default: false
})
```

### Mark Notification as Read
```typescript
trpc.user.markNotificationRead.mutate({
  notificationId: number
})
```

### Mark All Notifications as Read
```typescript
trpc.user.markAllNotificationsRead.mutate()
```

## 📝 Post Features

### Get Post Versions
```typescript
trpc.posts.versions.query({
  postId: number
})
```

### Get Post Comments
```typescript
trpc.posts.comments.query({
  postId: number
})
```

### Add Comment
```typescript
trpc.posts.addComment.mutate({
  postId: number,
  content: string
})
```

### Update Comment
```typescript
trpc.posts.updateComment.mutate({
  commentId: number,
  content: string
})
```

### Delete Comment
```typescript
trpc.posts.deleteComment.mutate({
  commentId: number
})
```

## 🤝 Post Sharing

### Share Post
```typescript
trpc.posts.sharePost.mutate({
  postId: number,
  userId: number,
  canEdit: boolean // default: false
})
```

### Get Post Shares
```typescript
trpc.posts.shares.query({
  postId: number
})
```

### Get Posts Shared With Me
```typescript
trpc.posts.sharedWithMe.query()
```

### Revoke Share
```typescript
trpc.posts.revokeShare.mutate({
  shareId: number
})
```

## 🏷️ Categories

### Get All Categories
```typescript
trpc.posts.categories.query()
```

### Create Category (Admin Only)
```typescript
trpc.posts.createCategory.mutate({
  name: string,
  description?: string
})
```

### Add Post to Category
```typescript
trpc.posts.addToCategory.mutate({
  postId: number,
  categoryId: number
})
```

### Remove Post from Category
```typescript
trpc.posts.removeFromCategory.mutate({
  postId: number,
  categoryId: number
})
```

### Get Post Categories
```typescript
trpc.posts.postCategories.query({
  postId: number
})
```

## ⏰ Temporary Roles (Admin Only)

### Assign Temporary Role
```typescript
trpc.admin.assignTemporaryRole.mutate({
  userId: number,
  role: 'admin' | 'editor' | 'viewer',
  durationHours: number, // 1-720
  reason?: string
})
```

### Get User Temporary Roles
```typescript
trpc.admin.temporaryRoles.query({
  userId: number
})
```

### Revoke Temporary Role
```typescript
trpc.admin.revokeTemporaryRole.mutate({
  assignmentId: number
})
```

## 📊 Response Types

### User
```typescript
{
  id: number
  openId: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'viewer'
  customRoleId: number | null
  createdAt: Date
  updatedAt: Date
  lastSignedIn: Date
}
```

### Notification
```typescript
{
  id: number
  userId: number
  type: string
  title: string
  message: string
  read: boolean
  relatedResourceType?: string
  relatedResourceId?: number
  createdAt: Date
}
```

### Post Version
```typescript
{
  id: number
  postId: number
  title: string
  content: string
  versionNumber: number
  editedBy: number
  createdAt: Date
}
```

### Comment
```typescript
{
  id: number
  postId: number
  userId: number
  content: string
  createdAt: Date
  updatedAt: Date
}
```

### Post Share
```typescript
{
  id: number
  postId: number
  sharedWithUserId: number
  sharedByUserId: number
  canEdit: boolean
  createdAt: Date
}
```

### Category
```typescript
{
  id: number
  name: string
  description: string
  createdAt: Date
}
```

### Session
```typescript
{
  id: number
  userId: number
  token: string
  ipAddress?: string
  userAgent?: string
  expiresAt: Date
  createdAt: Date
}
```

### Temporary Role Assignment
```typescript
{
  id: number
  userId: number
  temporaryRole: 'admin' | 'editor' | 'viewer'
  expiresAt: Date
  grantedBy: number
  reason?: string
  createdAt: Date
}
```

## 🔒 Permission Requirements

| Endpoint | Required Role | Notes |
|----------|--------------|-------|
| `admin.registerUser` | Admin | Create new users |
| `admin.requestPasswordReset` | Admin | Generate reset tokens |
| `admin.resetPassword` | Any | With valid token |
| `user.*` | Authenticated | Own profile only |
| `posts.createCategory` | Admin | Category management |
| `posts.sharePost` | Owner/Admin | Share own posts |
| `posts.addComment` | Authenticated | Comment on visible posts |
| `admin.assignTemporaryRole` | Admin | Grant temporary access |

## 🚀 Usage Examples

### Complete User Registration Flow
```typescript
// 1. Admin registers user
const user = await trpc.admin.registerUser.mutate({
  name: "Jane Doe",
  email: "jane@example.com",
  password: "secure123",
  role: "editor"
});

// 2. User logs in (existing auth flow)
// 3. User updates profile
await trpc.user.updateProfile.mutate({
  name: "Jane Smith"
});

// 4. User changes password
await trpc.user.changePassword.mutate({
  currentPassword: "secure123",
  newPassword: "newsecure456"
});
```

### Post Collaboration Flow
```typescript
// 1. Create post
const post = await trpc.posts.create.mutate({
  title: "Team Project",
  content: "Project details...",
  status: "draft",
  visibility: "private"
});

// 2. Share with team member
await trpc.posts.sharePost.mutate({
  postId: post.id,
  userId: teamMemberId,
  canEdit: true
});

// 3. Team member adds comment
await trpc.posts.addComment.mutate({
  postId: post.id,
  content: "Looks good!"
});

// 4. Add to category
await trpc.posts.addToCategory.mutate({
  postId: post.id,
  categoryId: projectCategoryId
});
```

### Temporary Access Flow
```typescript
// 1. Grant temporary admin access
await trpc.admin.assignTemporaryRole.mutate({
  userId: contractorId,
  role: "admin",
  durationHours: 48,
  reason: "Weekend deployment support"
});

// 2. User receives notification
const notifications = await trpc.user.notifications.query({
  unreadOnly: true
});

// 3. After 48 hours, role automatically expires
// 4. Or manually revoke
await trpc.admin.revokeTemporaryRole.mutate({
  assignmentId: tempRoleId
});
```
