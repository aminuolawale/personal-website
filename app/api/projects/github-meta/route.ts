import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unauthorized, badRequest, notFound, serverError } from "@/lib/api";

export async function GET(req: NextRequest) {
  if (!(await getSession())) return unauthorized();

  const url = new URL(req.url).searchParams.get("url") || "";
  const match = url.match(/github\.com\/([^/]+)\/([^/#?]+)/);
  if (!match) return badRequest("Invalid GitHub URL");

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
    if (!res.ok) return notFound("Repo not found");
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
    return serverError("GitHub fetch failed");
  }
}
