import { NextResponse } from "next/server";
import { withAuth } from "@/lib/with-auth";
import { fetchVercelActivity } from "@/lib/vercel-activity";
import { syncActivitiesToDb } from "@/lib/swe-activity-sync";

export const POST = withAuth(async () => {
  const externalItems = await fetchVercelActivity();
  const stats = await syncActivitiesToDb(externalItems);
  return NextResponse.json({ success: true, stats });
});
