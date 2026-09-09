import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sajivo-app.vercel.app").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/dashboard/", "/v2/admin/", "/v2/client/", "/v2/professional/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
