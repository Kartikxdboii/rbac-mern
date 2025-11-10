# Login Information

## Current Login Credentials

The application uses **local authentication** mode. Use these credentials to log in:

- **Username:** `admin`
- **Password:** `pass123`

These credentials are configured in the `.env` file:
- `OWNER_OPEN_ID=admin`
- `OWNER_PASSWORD=pass123`

## How Authentication Works

1. **Local Auth Mode**: The app uses environment variable-based authentication
2. **Single Admin User**: Only one user can log in (configured in .env)
3. **OpenID System**: After login, the user gets openId `admin` with admin role

## Seeded Users vs Login Users

The seed script creates demo users in the database:
- admin@example.com (openId: admin-demo-001)
- editor@example.com (openId: editor-demo-001)
- viewer@example.com (openId: viewer-demo-001)

**Important:** These seeded users are for database structure only. They don't have passwords and cannot log in through the login page. The login page only accepts the credentials from `.env`.

## To Change Login Credentials

Edit the `.env` file:
```env
OWNER_OPEN_ID=your-username
OWNER_PASSWORD=your-password
OWNER_NAME=Your Display Name
```

Or use a bcrypt hash:
```env
OWNER_PASSWORD_HASH=$2b$10$your-bcrypt-hash
```
