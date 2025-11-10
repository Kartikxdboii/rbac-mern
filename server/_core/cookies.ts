import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  // const hostname = req.hostname;
  // const shouldSetDomain =
  //   hostname &&
  //   !LOCAL_HOSTS.has(hostname) &&
  //   !isIpAddress(hostname) &&
  //   hostname !== "127.0.0.1" &&
  //   hostname !== "::1";

  // const domain =
  //   shouldSetDomain && !hostname.startsWith(".")
  //     ? `.${hostname}`
  //     : shouldSetDomain
  //       ? hostname
  //       : undefined;

  const host = req.hostname || "";
  const secure = isSecureRequest(req);
  const isLocal = !secure || LOCAL_HOSTS.has(host) || isIpAddress(host);

  // On localhost/http, browsers reject SameSite=None unless Secure=true.
  // Use Lax for local dev to ensure the cookie is accepted.
  if (isLocal) {
    return {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: false,
    };
  }

  // In production/https, allow cross-site iframes/redirects with SameSite=None + Secure
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: true,
  };
}
