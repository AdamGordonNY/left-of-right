import { Source } from "@prisma/client";
import { prisma } from "./prisma";

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function getSourceBySlug(
  slug: string,
  userId?: string
): Promise<Source | null> {
  const where = userId
    ? {
        isActive: true,
        OR: [{ createdByUserId: userId }, { isGlobal: true }],
      }
    : { isActive: true, isGlobal: true };

  console.log(
    "[getSourceBySlug] Looking for slug:",
    slug,
    "userId:",
    userId,
    "where:",
    JSON.stringify(where)
  );

  const sources = await prisma.source.findMany({
    where,
  });

  console.log("[getSourceBySlug] Found sources:", sources.length, "sources");
  sources.forEach((s) =>
    console.log("  -", s.name, "=> slug:", generateSlug(s.name))
  );

  const source = sources.find((s) => generateSlug(s.name) === slug);

  console.log("[getSourceBySlug] Matched source:", source?.name || "null");

  return source || null;
}

export async function getSourceBySlugOrId(
  slugOrId: string,
  userId?: string
): Promise<Source | null> {
  const bySlug = await getSourceBySlug(slugOrId, userId);
  if (bySlug) return bySlug;

  const where = userId
    ? {
        id: slugOrId,
        OR: [{ createdByUserId: userId }, { isGlobal: true }],
      }
    : { id: slugOrId, isGlobal: true };

  const byId = await prisma.source.findUnique({
    where: { id: slugOrId },
  });

  // Check if user has access
  if (byId) {
    if (!userId && !byId.isGlobal) {
      return null;
    }
    if (userId && !byId.isGlobal && byId.createdByUserId !== userId) {
      return null;
    }
  }

  return byId;
}
