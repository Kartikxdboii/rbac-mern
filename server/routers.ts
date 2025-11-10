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
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
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
        const creds = await verifyOwnerCredentials(input.username, input.password);
        if (!creds) {
          console.warn('[Auth] Invalid credentials for', input.username);
          throw new Error("Invalid username or password");
        }
        // best effort: upsert user (ignored if no DB)
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

  // RBAC routers
  posts: postsRouter,
  admin: adminRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
