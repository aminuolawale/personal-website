import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { readerProfiles } from "@/lib/schema";
import { sendNewReaderAdminEmail } from "@/lib/email";

type ReaderProfileInput = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export async function ensureReaderProfile(user: ReaderProfileInput) {
  if (!user.email) return;

  const db = getDb();
  const [existing] = await db
    .select()
    .from(readerProfiles)
    .where(eq(readerProfiles.email, user.email))
    .limit(1);

  if (existing) {
    await db
      .update(readerProfiles)
      .set({
        name: user.name ?? existing.name,
        image: user.image ?? existing.image,
        lastSeenAt: new Date(),
      })
      .where(eq(readerProfiles.email, user.email));
    return;
  }

  await db.insert(readerProfiles).values({
    email: user.email,
    name: user.name ?? null,
    image: user.image ?? null,
  });

  try {
    await sendNewReaderAdminEmail({ email: user.email, name: user.name ?? null });
  } catch (err) {
    console.error(err);
  }
}
