import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing to index behind a login, and /auth is a redirect target.
      disallow: ["/new", "/login", "/auth/"],
    },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
