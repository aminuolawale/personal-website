// Helper for creating a site update entry.
//
// Call this whenever content is published with "Publish as Update" enabled.
// It writes a row to site_updates, which surfaces on the homepage and /updates page.
//
// Usage in an API route:
//   if (publishAsUpdate) {
//     await createUpdate({ text: "Aminu added ...", linkUrl: "/astrophotography?tab=gear" });
//   }

import { getDb } from "@/lib/db";
import { siteUpdates } from "@/lib/schema";

interface UpdateParams {
  text: string;
  linkUrl?: string | null;
  thumbnailUrl?: string | null;
}

export async function createUpdate(params: UpdateParams): Promise<void> {
  const db = getDb();
  await db.insert(siteUpdates).values({
    text: params.text,
    linkUrl: params.linkUrl ?? null,
    thumbnailUrl: params.thumbnailUrl ?? null,
  });
}
