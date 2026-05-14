import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/schema";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { unauthorized, withDb, PUBLIC_CACHE } from "@/lib/api";
import { withAuth } from "@/lib/with-auth";
import { createUpdate } from "@/lib/updates";

export async function GET(req: NextRequest) {
  const adminMode = new URL(req.url).searchParams.get("admin") === "true";

  if (adminMode && !(await getSession())) return unauthorized();

  return withDb(async (db) => {
    const rows = await db
      .select()
      .from(projects)
      .where(adminMode ? undefined : eq(projects.published, true))
      .orderBy(asc(projects.position));

    const res = NextResponse.json(rows);
    if (!adminMode) res.headers.set("Cache-Control", PUBLIC_CACHE);
    return res;
  });
}

export const POST = withAuth(async (req: NextRequest) => {
  const { publishAsUpdate, ...projectData } = await req.json();
  const [project] = await getDb().insert(projects).values(projectData).returning();
  if (publishAsUpdate) {
    await createUpdate({
      text: `Aminu added a new project — ${project.title} — to SWE`,
      linkUrl: project.websiteUrl ?? project.githubUrl ?? "/swe?tab=projects",
    });
  }
  return NextResponse.json(project, { status: 201 });
});
