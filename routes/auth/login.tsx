import * as oauth from "npm:oauth4webapi";
import { AppHandlers } from "../_middleware.ts";
import { Cookie, setCookie } from "@std/http/cookie";

const client_id = Deno.env.get("CLIENT_ID");
const client_secret = Deno.env.get("CLIENT_SECRET");
const redirect_uri = Deno.env.get("REDIRECT_URI");

export const handler: AppHandlers = {
  async GET(_req, _ctx) {
    if (!client_id || !client_secret || !redirect_uri) {
      throw new Error("Missing environment variables");
    }
    const issuer = new URL("https://dev-1m7qee3nty5n5ck1.us.auth0.com");
    const discoveryResponse = await oauth.discoveryRequest(issuer);
    const as = await oauth.processDiscoveryResponse(issuer, discoveryResponse);
    const code_verifier = oauth.generateRandomCodeVerifier();
    const code_challenge = await oauth.calculatePKCECodeChallenge(
      code_verifier,
    );

    const authorizationUrl = new URL(as.authorization_endpoint!);
    authorizationUrl.searchParams.set("client_id", client_id);
    authorizationUrl.searchParams.set("redirect_uri", redirect_uri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("scope", "openid profile");
    authorizationUrl.searchParams.set("code_challenge", code_challenge);
    authorizationUrl.searchParams.set("code_challenge_method", "S256");

    const response = new Response(null, {
      status: 302,
      headers: {
        location: authorizationUrl.toString(),
      },
    });

    const code_verifier_cookie: Cookie = {
      name: "code_verifier",
      value: code_verifier,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    };
    setCookie(response.headers, code_verifier_cookie);

    return response;
  },
};

export default function () {
  return null;
}
