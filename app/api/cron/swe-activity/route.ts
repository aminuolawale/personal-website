import { NextRequest, NextResponse } from "next/server";
import { fetchVercelActivity } from "@/lib/vercel-activity";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Missing CRON_SECRET" }, { status: 500 });
  }

  const externalItems = await fetchVercelActivity();
  const stats = await syncActivitiesToDb(externalItems);
  return NextResponse.json({ success: true, stats });
}
