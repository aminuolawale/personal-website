import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects, siteUpdates } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(projects)
      .where(adminMode ? undefined : eq(projects.published, true))
      .orderBy(asc(projects.position));

    const res = NextResponse.json(rows);
    if (!adminMode) {
      res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    }
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publishAsUpdate, ...projectData } = await req.json();
    const db = getDb();
    const [project] = await db.insert(projects).values(projectData).returning();
    if (publishAsUpdate) {
      await db.insert(siteUpdates).values({
        text: `Aminu added a new project — ${project.title} — to SWE`,
        linkUrl: project.websiteUrl ?? project.githubUrl ?? "/swe?tab=projects",
      });
    }
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
