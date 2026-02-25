import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ["/", "/tienda", "/tienda/"], disallow: ["/admin", "/api"] },
    ],
    sitemap: `${baseUrl()}/sitemap.xml`,
    host: baseUrl(),
  };
}
