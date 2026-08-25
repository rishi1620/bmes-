import fs from "fs";
import path from "path";

export interface SitemapRoute {
  path: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: string;
  lastmod?: string;
}

const DEFAULT_BASE_URL = process.env.APP_URL || "https://cuetbmes.vercel.app";

/**
 * Extracts public routes automatically from src/App.tsx
 */
export function extractRoutesFromAppTsx(appTsxContent?: string): string[] {
  let content = appTsxContent;
  if (!content) {
    const appTsxPath = path.resolve(process.cwd(), "src/App.tsx");
    if (fs.existsSync(appTsxPath)) {
      content = fs.readFileSync(appTsxPath, "utf-8");
    } else {
      content = "";
    }
  }

  const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["'][^>]*>/g;
  const routes: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = routeRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const routePath = match[1];

    // Filter out redirects (<Navigate ...>)
    if (fullTag.includes("<Navigate") || fullTag.includes("Navigate to=")) {
      continue;
    }

    // Filter out catch-all and protected admin routes
    if (routePath === "*" || routePath.startsWith("/admin")) {
      continue;
    }

    // Filter out parameterized routes (they'll be handled dynamically)
    if (routePath.includes(":")) {
      continue;
    }

    if (!routes.includes(routePath)) {
      routes.push(routePath);
    }
  }

  // Ensure root is present
  if (!routes.includes("/")) {
    routes.unshift("/");
  }

  return routes;
}

/**
 * Maps a route path to its SEO metadata (priority & changefreq)
 */
export function getRouteMetadata(routePath: string): { changefreq: SitemapRoute["changefreq"]; priority: string } {
  if (routePath === "/") {
    return { changefreq: "daily", priority: "1.0" };
  }
  if (["/events", "/notices", "/blog", "/portal"].includes(routePath)) {
    return { changefreq: "daily", priority: "0.9" };
  }
  if (["/research", "/projects", "/academics", "/about", "/people", "/activities", "/achievements", "/alumni"].includes(routePath)) {
    return { changefreq: "weekly", priority: "0.8" };
  }
  if (["/contact", "/auth"].includes(routePath)) {
    return { changefreq: "monthly", priority: "0.6" };
  }
  return { changefreq: "weekly", priority: "0.7" };
}

/**
 * Builds standard XML sitemap string
 */
export function buildSitemapXml(routes: SitemapRoute[], baseUrl: string = DEFAULT_BASE_URL): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const today = new Date().toISOString().split("T")[0];

  const xmlEntries = routes
    .map((route) => {
      const loc = `${cleanBaseUrl}${route.path === "/" ? "" : route.path}`;
      const lastmod = route.lastmod || today;
      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${xmlEntries}
</urlset>
`;
}

/**
 * Generates the full sitemap routes list based on App.tsx and dynamic content
 */
export async function generateSitemapRoutes(appTsxContent?: string, extraSlugs: { blog?: string[] } = {}): Promise<SitemapRoute[]> {
  const staticPaths = extractRoutesFromAppTsx(appTsxContent);
  const today = new Date().toISOString().split("T")[0];

  const routes: SitemapRoute[] = staticPaths.map((p) => {
    const meta = getRouteMetadata(p);
    return {
      path: p,
      changefreq: meta.changefreq,
      priority: meta.priority,
      lastmod: today,
    };
  });

  // Append dynamic blog post routes
  if (extraSlugs.blog && extraSlugs.blog.length > 0) {
    for (const slug of extraSlugs.blog) {
      if (slug) {
        routes.push({
          path: `/blog/${slug}`,
          changefreq: "monthly",
          priority: "0.7",
          lastmod: today,
        });
      }
    }
  }

  return routes;
}
