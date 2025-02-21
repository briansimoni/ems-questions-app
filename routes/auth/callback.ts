import * as oauth from "npm:oauth4webapi";
import { AppHandlers } from "../_middleware.ts";
import { UserStore } from "../../lib/user_store.ts";
import { getCookies, setCookie } from "@std/http/cookie";
import { log } from "../../lib/logger.ts";

const client_id = Deno.env.get("CLIENT_ID");
const client_secret = Deno.env.get("CLIENT_SECRET");

export const handler: AppHandlers = {
  async GET(req, ctx) {
    if (!client_id || !client_secret) {
      throw new Error("Missing environment variables");
    }

    // https://dev-1m7qee3nty5n5ck1.us.auth0.com/.well-known/openid-configuration
    const issuer = new URL("https://dev-1m7qee3nty5n5ck1.us.auth0.com");
    const discoverResponse = await oauth.discoveryRequest(issuer);
    const as = await oauth.processDiscoveryResponse(issuer, discoverResponse);

    const client: oauth.Client = {
      client_id,
      client_secret,
    };

    const currentUrl: URL = new URL(req.url);
    const params = oauth.validateAuthResponse(as, client, currentUrl);
    const clientAuth = oauth.ClientSecretPost(client_secret);

    const cookies = getCookies(req.headers);
    const code_verifier = cookies["code_verifier"];

    const redirect_uri = `${currentUrl.origin}/auth/callback`;
    const authorizationCodeResponse = await oauth.authorizationCodeGrantRequest(
      as,
      client,
      clientAuth,
      params,
      redirect_uri,
      code_verifier,
    );

    const result = await oauth.processAuthorizationCodeResponse(
      as,
      client,
      authorizationCodeResponse,
      {
        requireIdToken: true,
      },
    );

    const { access_token } = result;
    const claims = oauth.getValidatedIdTokenClaims(result)!;
    const { sub } = claims;

    const r = await oauth.userInfoRequest(as, client, access_token);

    const userinfo = await oauth.processUserInfoResponse(
      as,
      client,
      sub,
      r,
    );

    ctx.state.session = {
      access_token,
      user_id: sub,
      ...claims,
      ...userinfo,
    };

    log.info("logged in", userinfo);

    const userStore = await UserStore.make();
    const user = await userStore.getUser(sub);
    if (!user) {
      await userStore.createUser({
        user_id: sub,
        display_name: sub, // they can change display_name later
        created_at: new Date().toISOString(),
        stats: {
          questions_answered: 0,
          questions_correct: 0,
          streak: {
            days: 0,
          },
        },
      });
    }

    const response = new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });

    // remove code verifier cookie
    setCookie(response.headers, {
      name: "code_verifier",
      value: "",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      maxAge: 0,
    });

    return response;
  },
};

export default function () {
  return null;
}
