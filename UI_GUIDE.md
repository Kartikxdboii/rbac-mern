# 🎨 UI Guide - Where to Find Everything

## 🏠 After Login

### Navbar (Top)
```
[Logo] Posts | Admin | 🔔(3) | 👤 | Sign Out
```

- **Posts** → Enhanced posts page
- **Admin** → Admin dashboard
- **🔔** → Notifications (shows unread count)
- **👤** → Your profile
- **Sign Out** → Logout

---

## 📝 Posts Page (`/posts`)

### Post Card Features
Each post shows:
```
┌─────────────────────────────────────┐
│ Post Title                [Draft] [Private] │
│ By You • Jan 10, 2025                      │
├─────────────────────────────────────┤
│ Post content here...                       │
│ #react #typescript #tutorial               │
├─────────────────────────────────────┤
│ [Edit] [Delete] [Comments] [Share] [History] │
└─────────────────────────────────────┘
```

**Buttons:**
- **Edit** → Edit post (opens dialog)
- **Delete** → Delete post (with confirmation)
- **Comments** → View/add comments
- **Share** → Share with other users
- **History** → View version history

### Create Post
Click **"+ Create Post"** button (top right)

Form includes:
- Title
- Content
- Tags (comma-separated)
- Status (Draft/Published)
- Visibility (Private/Internal/Public)

---

## 💬 Comments Dialog

Click **"Comments"** on any post:

```
┌─────────────────────────────────────┐
│ Comments                        [X] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Great post!                     │ │
│ │ User 2 • 2 hours ago            │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Thanks for sharing!             │ │
│ │ User 3 • 1 hour ago             │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Add a comment...        ] [Send]  │
└─────────────────────────────────────┘
```

---

## 🔔 Notifications

Click bell icon in navbar:

```
┌─────────────────────────────────────┐
│ Notifications      [Mark all read]  │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ New comment on your post    [✓] │ │
│ │ John commented on "My Post"     │ │
│ │ 5 minutes ago                   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Post shared with you            │ │
│ │ Admin shared "Tutorial" with you│ │
│ │ 1 hour ago                      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Features:**
- Unread notifications highlighted
- Click ✓ to mark individual as read
- "Mark all read" button at top
- Auto-refreshes every 10 seconds

---

## 👤 Profile Page (`/profile`)

### Three Tabs:

#### 1. Profile Tab
```
┌─────────────────────────────────────┐
│ Profile Information                 │
├─────────────────────────────────────┤
│ Name:    [John Doe              ]   │
│ Email:   [john@example.com      ]   │
│ Role:    [admin                 ]   │
│          (disabled)                 │
│                                     │
│ [Update Profile]                    │
└─────────────────────────────────────┘
```

#### 2. Password Tab
```
┌─────────────────────────────────────┐
│ Change Password                     │
├─────────────────────────────────────┤
│ Current Password: [••••••••]        │
│ New Password:     [••••••••]        │
│ Confirm Password: [••••••••]        │
│                                     │
│ [Change Password]                   │
└─────────────────────────────────────┘
```

#### 3. Sessions Tab
```
┌─────────────────────────────────────┐
│ Active Sessions                     │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Chrome on Windows          [Revoke] │
│ │ 192.168.1.100                   │ │
│ │ Expires: Jan 17, 2025           │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Firefox on Mac             [Revoke] │
│ │ 192.168.1.101                   │ │
│ │ Expires: Jan 18, 2025           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎛️ Admin Dashboard (`/admin`)

### Quick Actions Section
```
┌─────────────────────────────────────┐
│ Quick Actions                       │
├─────────────────────────────────────┤
│ [👁️  View Posts              >]     │
│ [➕ Create Post              >]     │
│ [👥 Register User            >]  ← NEW
│ [⚙️  Manage Users            >]     │
└─────────────────────────────────────┘
```

---

## ➕ Register User (`/admin/register`)

**Admin Only**

```
┌─────────────────────────────────────┐
│ 👥 Register New User                │
│ Create a new user account           │
├─────────────────────────────────────┤
│ Name:     [John Doe              ]  │
│ Email:    [john@example.com      ]  │
│ Password: [••••••••              ]  │
│           (Minimum 6 characters)    │
│ Role:     [Editor ▼              ]  │
│           • Admin - Full access     │
│           • Editor - Create posts   │
│           • Viewer - Read only      │
│                                     │
│ [Register User]                     │
└─────────────────────────────────────┘
```

---

## 🔄 Share Post Dialog

Click **"Share"** on your post:

```
┌─────────────────────────────────────┐
│ Share Post                      [X] │
├─────────────────────────────────────┤
│ Select user:                        │
│ [Select user ▼                   ]  │
│   • John Doe (john@example.com)     │
│   • Jane Smith (jane@example.com)   │
│   • Bob Wilson (bob@example.com)    │
│                                     │
│ [Share]                             │
└─────────────────────────────────────┘
```

---

## 📜 Version History Dialog

Click **"History"** on your post:

```
┌─────────────────────────────────────┐
│ Version History                 [X] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ [Version 3]  Jan 10, 2025 3:00PM│ │
│ │ Updated Post Title              │ │
│ │ Updated content with more info  │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Version 2]  Jan 10, 2025 2:00PM│ │
│ │ My Post Title                   │ │
│ │ Added more details              │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Version 1]  Jan 10, 2025 1:00PM│ │
│ │ My Post Title                   │ │
│ │ Initial content                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## 🎨 Color Coding

### Badges
- **Published** → Blue background
- **Draft** → Gray background
- **Private** → Outlined
- **Internal** → Outlined
- **Public** → Outlined

### Buttons
- **Primary Actions** → Blue (Create, Update)
- **Destructive** → Red (Delete)
- **Secondary** → Gray outline (Edit, View)

### Notifications
- **Unread** → Light gray background
- **Read** → White background

---

## 📱 Mobile View

All pages are responsive:
- Navbar collapses to hamburger menu
- Cards stack vertically
- Dialogs are full-screen on mobile
- Touch-friendly button sizes

---

## ⌨️ Keyboard Shortcuts

- **Tab** → Navigate between fields
- **Enter** → Submit forms
- **Esc** → Close dialogs
- **Space** → Toggle checkboxes

---

## 🎯 Quick Demo Path

1. **Login** → See dashboard
2. **Click Bell** → View notifications
3. **Go to Posts** → See enhanced features
4. **Create Post** → Add tags
5. **Add Comment** → Test comments
6. **Share Post** → Share with user
7. **View History** → See versions
8. **Click Profile** → Manage account
9. **Register User** (Admin) → Create new user

---

## 💡 Tips

- **Hover** over buttons to see tooltips
- **Click** notification bell to see updates
- **Use tags** to organize posts (comma-separated)
- **Check version history** before major edits
- **Revoke sessions** if you see suspicious activity

---

**Everything is intuitive and user-friendly!** 🎉
