import { FreshContext, Handler, Handlers, PageProps } from "$fresh/server.ts";
import * as http from "@std/http";
import { Cookie, setCookie } from "@std/http/cookie";
import diff from "https://deno.land/x/microdiff@v1.2.0/index.ts";
import { log } from "../lib/logger.ts";

const SECRET_KEY = Deno.env.get("COOKIE_SECRET") || "super_secret_key";

export interface SessionData {
  user_id?: string;
  access_token?: string;
  nickname?: string;
  name?: string;
  picture?: string;
  display_name?: string;
  streakDays?: number;
  [key: string]: any;
}

/**
 * same as Fresh's PageProps type but with state modified
 * by the app's middleware. It has the session object in it
 */
export interface AppProps extends PageProps {
  state: {
    session?: SessionData;
  };
}

export type AppHandler = Handler<any, { session?: SessionData }>;
export type AppHandlers = Handlers<any, { session?: SessionData }>;

// Helper function to generate HMAC signature using crypto.subtle
async function sign(data: string, key: string = SECRET_KEY): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: { name: "SHA-256" } },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    keyMaterial,
    encoder.encode(data),
  );

  return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

// Helper function to verify signature
async function verify(
  data: string,
  signature: string,
  key: string = SECRET_KEY,
): Promise<boolean> {
  const expectedSignature = await sign(data, key);

  return expectedSignature === signature;
}

/**
 * session middleware
 */
const sessionMiddleware: Handler = async function handler(
  req: Request,
  ctx: FreshContext,
) {
  let sessionData: Partial<SessionData> | undefined = undefined;
  const cookies = http.getCookies(req.headers);
  // Hydrate session
  if (Object.keys(cookies).length > 0) {
    const data = cookies["test_question_app_data"];
    const signature = cookies["test_question_app_signature"];

    if (data && signature) {
      const verified = await verify(data, signature);
      if (verified) {
        try {
          sessionData = JSON.parse(decodeURIComponent(data));
        } catch (error) {
          console.warn("Failed to parse session data:", error);
          sessionData = undefined;
        }
      } else {
        console.warn("Invalid or tampered session data detected.");
      }
    }
  }

  // copy the object if it's not undefined
  ctx.state.session = sessionData === undefined
    ? undefined
    : JSON.parse(JSON.stringify(sessionData));

  // Run the handlers
  const resp = await ctx.next();

  // Delete the cookies if session is missing
  if (!ctx.state.session || Object.keys(ctx.state.session).length === 0) {
    const appDataCookie: Cookie = {
      name: "test_question_app_data",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 0,
    };
    const signatureCookie: Cookie = {
      name: "test_question_app_signature",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 0,
    };
    setCookie(resp.headers, appDataCookie);
    setCookie(resp.headers, signatureCookie);

    return resp;
  }

  // Only set cookies if the session has changed
  if (diff(ctx.state.session, sessionData ?? {}).length === 0) {
    return resp;
  }

  const serialized = JSON.stringify(ctx.state.session);
  const payload = encodeURIComponent(serialized);
  const signature = await sign(payload);

  // TODO: use secure true conditionally based on whether the server is running https or not
  // TODO: set the max age and make in configurable
  const appDataCookie: Cookie = {
    name: "test_question_app_data",
    value: payload,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  };

  const signatureCookie: Cookie = {
    name: "test_question_app_signature",
    value: signature,
    path: "/",
    httpOnly: true,
    sameSite: "Lax",
  };
  http.setCookie(resp.headers, appDataCookie);
  http.setCookie(resp.headers, signatureCookie);
  return resp;
};

const logMiddleware: AppHandler = async function (req, ctx) {
  const start = Date.now();
  log.debug("request started", req.url);
  const res = await ctx.next();
  const end = Date.now();
  log.info(req.method, req.url, {
    user_id: ctx.state.session?.user_id,
    name: ctx.state.session?.name,
    status: res.status,
    responseTime: end - start,
  });
  return res;
};

export const handler: AppHandler[] = [
  logMiddleware,
  sessionMiddleware,
];
