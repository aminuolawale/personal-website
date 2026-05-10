import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";
import { fetchVercelActivity } from "@/lib/vercel-activity";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";

/**
 * Manually triggers a sync from GitHub and Vercel.
 * Admin-only.
 */
export async function POST() {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const externalItems = await fetchVercelActivity();

    // 2. Sync to DB (upsert)
    await syncActivitiesToDb(externalItems);

    return NextResponse.json({ success: true, count: externalItems.length });
  } catch (err) {
    console.error(err);
    return serverError();
  }
}
