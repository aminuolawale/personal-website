import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url).searchParams.get("url") || "";
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) {
    return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
  }

  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, "");

  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${cleanRepo}`,
      {
        headers: { Accept: "application/vnd.github.v3+json" },
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Repo not found" }, { status: 404 });
    }
    const data = await res.json();
    return NextResponse.json({
      title: data.name ?? "",
      description: data.description ?? "",
      websiteUrl: data.homepage || null,
      tags: Array.isArray(data.topics) && data.topics.length
        ? data.topics.join(", ")
        : data.language ?? "",
    });
  } catch {
    return NextResponse.json({ error: "GitHub fetch failed" }, { status: 500 });
  }
}
