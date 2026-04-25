import type { Metadata } from "next";
import { getDb } from "@/lib/db";
import { articles } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { SITE } from "@/lib/site";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const db = getDb();
    const [article] = await db
      .select({ title: articles.title, summary: articles.summary })
      .from(articles)
      .where(and(eq(articles.slug, slug), eq(articles.type, "swe"), eq(articles.published, true)));

    if (!article) return {};

    const title = article.title;
    const description = article.summary || `${title} — ${SITE.name}`;
    const url = `${SITE.url}/swe/${slug}`;

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        url,
        siteName: SITE.name,
        images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
      },
      twitter: { card: "summary_large_image", title, description },
      alternates: { canonical: url },
    };
  } catch {
    return {};
  }
}

export default function SweArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
