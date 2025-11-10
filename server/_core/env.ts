export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  localAuthEnabled: process.env.LOCAL_AUTH_ENABLED === "true",
  ownerName: process.env.OWNER_NAME ?? "",
  ownerPassword: process.env.OWNER_PASSWORD ?? "",
  ownerPasswordHash: process.env.OWNER_PASSWORD_HASH ?? "",
};
