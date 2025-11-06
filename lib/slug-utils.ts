import { Source } from '@prisma/client';
import { prisma } from './prisma';

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function getSourceBySlug(slug: string): Promise<Source | null> {
  const sources = await prisma.source.findMany({
    where: { isActive: true },
  });

  const source = sources.find(
    (s) => generateSlug(s.name) === slug
  );

  return source || null;
}

export async function getSourceBySlugOrId(slugOrId: string): Promise<Source | null> {
  const bySlug = await getSourceBySlug(slugOrId);
  if (bySlug) return bySlug;

  const byId = await prisma.source.findUnique({
    where: { id: slugOrId },
  });

  return byId;
}
