import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { generateSitemapRoutes, buildSitemapXml } from "../src/lib/sitemapGenerator.ts";

dotenv.config();

async function run() {
  console.log("⚡ [Sitemap Generator] Generating dynamic sitemap from src/App.tsx...");

  const appTsxPath = path.resolve(process.cwd(), "src/App.tsx");
  if (!fs.existsSync(appTsxPath)) {
    console.error("❌ App.tsx not found at", appTsxPath);
    process.exit(1);
  }

  const appTsxContent = fs.readFileSync(appTsxPath, "utf-8");

  // Optional: Attempt to fetch published blog slugs from Supabase if credentials are present
  const blogSlugs: string[] = [];
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey && !supabaseUrl.includes("placeholder-project")) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data } = await supabase
        .from("blog_posts")
        .select("slug")
        .eq("status", "published");

      if (data && Array.isArray(data)) {
        data.forEach((item: { slug: string }) => {
          if (item.slug) blogSlugs.push(item.slug);
        });
      }
    } catch {
      // ignore in offline/local environments
    }
  }

  const routes = await generateSitemapRoutes(appTsxContent, { blog: blogSlugs });
  const baseUrl = process.env.APP_URL || "https://cuetbmes.vercel.app";
  const sitemapXml = buildSitemapXml(routes, baseUrl);

  // Write to public/sitemap.xml
  const publicDir = path.resolve(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const publicSitemapPath = path.join(publicDir, "sitemap.xml");
  fs.writeFileSync(publicSitemapPath, sitemapXml, "utf-8");
  console.log(`✅ Generated ${publicSitemapPath} (${routes.length} routes)`);

  // If dist directory exists, write to dist/sitemap.xml as well
  const distDir = path.resolve(process.cwd(), "dist");
  if (fs.existsSync(distDir)) {
    const distSitemapPath = path.join(distDir, "sitemap.xml");
    fs.writeFileSync(distSitemapPath, sitemapXml, "utf-8");
    console.log(`✅ Updated ${distSitemapPath}`);
  }

  console.log("Indexed Routes:");
  routes.forEach((r) => {
    console.log(`  - ${r.path.padEnd(20)} [Priority: ${r.priority}, Changefreq: ${r.changefreq}]`);
  });
}

run().catch((err) => {
  console.error("❌ Error generating sitemap:", err);
  process.exit(1);
});
