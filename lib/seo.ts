// SEO page helpers — reads the content/seo-pages.json manifest that
// SEOGeneratorAgent materialises at build time.
import fs from "fs/promises";
import path from "path";

export type SeoSection = { h2: string; body: string };
export type SeoFaq = { q: string; a: string };
export type SeoPage = {
  slug: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faq: SeoFaq[];
};

let _cache: SeoPage[] | null = null;

async function load(): Promise<SeoPage[]> {
  if (_cache) return _cache;
  const file = path.join(process.cwd(), "content", "seo-pages.json");
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    _cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    _cache = [];
  }
  return _cache!;
}

export async function listSeoPages(): Promise<SeoPage[]> {
  return load();
}

export async function getSeoPage(slug: string): Promise<SeoPage | null> {
  const pages = await load();
  return pages.find((p) => p.slug === slug) || null;
}
