import { getUserId, getUserRole, isAdmin } from './auth';
import { prisma } from './prisma';

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export async function requireAuthUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) {
    throw new UnauthorizedError();
  }
  return userId;
}

export async function requireAdminAccess(): Promise<void> {
  const admin = await isAdmin();
  if (!admin) {
    throw new ForbiddenError('Admin access required');
  }
}

export async function canUserAccessSource(
  userId: string,
  sourceId: string
): Promise<boolean> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { isGlobal: true, createdByUserId: true },
  });

  if (!source) {
    return false;
  }

  return source.isGlobal || source.createdByUserId === userId;
}

export async function canUserModifySource(
  userId: string,
  sourceId: string
): Promise<boolean> {
  const source = await prisma.source.findUnique({
    where: { id: sourceId },
    select: { isGlobal: true, createdByUserId: true },
  });

  if (!source) {
    return false;
  }

  if (source.createdByUserId === userId) {
    return true;
  }

  if (source.isGlobal) {
    return await isAdmin();
  }

  return false;
}

export async function requireSourceAccess(
  userId: string,
  sourceId: string
): Promise<void> {
  const hasAccess = await canUserAccessSource(userId, sourceId);
  if (!hasAccess) {
    throw new ForbiddenError('You do not have access to this source');
  }
}

export async function requireSourceModification(
  userId: string,
  sourceId: string
): Promise<void> {
  const canModify = await canUserModifySource(userId, sourceId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to modify this source');
  }
}

export async function canUserModifyPlaylist(
  userId: string,
  playlistId: string
): Promise<boolean> {
  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
    select: {
      source: {
        select: { isGlobal: true, createdByUserId: true },
      },
    },
  });

  if (!playlist) {
    return false;
  }

  if (playlist.source.createdByUserId === userId) {
    return true;
  }

  if (playlist.source.isGlobal) {
    return await isAdmin();
  }

  return false;
}

export async function requirePlaylistModification(
  userId: string,
  playlistId: string
): Promise<void> {
  const canModify = await canUserModifyPlaylist(userId, playlistId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to modify this playlist');
  }
}

export async function canUserModifyContentItem(
  userId: string,
  contentItemId: string
): Promise<boolean> {
  const contentItem = await prisma.contentItem.findUnique({
    where: { id: contentItemId },
    select: {
      source: {
        select: { isGlobal: true, createdByUserId: true },
      },
    },
  });

  if (!contentItem) {
    return false;
  }

  if (contentItem.source.createdByUserId === userId) {
    return true;
  }

  if (contentItem.source.isGlobal) {
    return await isAdmin();
  }

  return false;
}

export async function requireContentItemModification(
  userId: string,
  contentItemId: string
): Promise<void> {
  const canModify = await canUserModifyContentItem(userId, contentItemId);
  if (!canModify) {
    throw new ForbiddenError('You do not have permission to modify this content item');
  }
}

export interface AuthorizationContext {
  userId: string;
  isAdmin: boolean;
}

export async function getAuthorizationContext(): Promise<AuthorizationContext | null> {
  const userId = await getUserId();
  if (!userId) {
    return null;
  }

  const adminStatus = await isAdmin();
  return {
    userId,
    isAdmin: adminStatus,
  };
}

export function getAccessibleSourcesFilter(userId: string, includeGlobal = true) {
  return {
    OR: [
      { createdByUserId: userId },
      ...(includeGlobal ? [{ isGlobal: true }] : []),
    ],
  };
}
