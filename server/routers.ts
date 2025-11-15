import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { postsRouter } from "./routers/posts";
import { adminRouter } from "./routers/admin";
import { userRouter } from "./routers/user";
import { z } from "zod";
import { ENV } from "./_core/env";
import { verifyOwnerCredentials } from "./_core/localAuth";
import { sdk } from "./_core/sdk";
import * as db from "./db";
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    login: publicProcedure
      .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        if (!ENV.localAuthEnabled) {
          throw new Error("Local auth is disabled");
        }
        console.log('[Auth] Login attempt', { username: input.username });
        const { getUserWithPassword } = await import('./db');
        const { verifyPassword } = await import('./_core/localAuth');
        const dbUser = await getUserWithPassword(input.username);
        if (dbUser && dbUser.passwordHash) {
          const valid = await verifyPassword(input.password, dbUser.passwordHash);
          if (valid) {
            const creds = { openId: dbUser.openId, name: dbUser.name || 'User' };
            await db.upsertUser({
              openId: creds.openId,
              name: creds.name,
              email: dbUser.email,
              loginMethod: 'local',
              lastSignedIn: new Date(),
            });
            const cookieOptions = getSessionCookieOptions(ctx.req);
            const token = await sdk.createSessionToken(creds.openId, { name: creds.name });
            console.log('[Auth] Database user login successful', { openId: creds.openId });
            ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions });
            return { success: true } as const;
          }
        }
        const creds = await verifyOwnerCredentials(input.username, input.password);
        if (!creds) {
          console.warn('[Auth] Invalid credentials for', input.username);
          throw new Error("Invalid username or password");
        }
        try {
          await db.upsertUser({
            openId: creds.openId,
            name: creds.name,
            email: null,
            loginMethod: 'local',
            lastSignedIn: new Date(),
          });
        } catch {}
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const token = await sdk.createSessionToken(creds.openId, { name: creds.name });
        console.log('[Auth] Issuing session cookie', { openId: creds.openId, cookieOptions });
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions });
        return { success: true } as const;
      }),
  }),
  posts: postsRouter,
  admin: adminRouter,
  user: userRouter,
});
export type AppRouter = typeof appRouter;

