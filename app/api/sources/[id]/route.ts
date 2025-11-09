import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserRole } from '@/lib/auth';
import { updateSource, deleteSource, getSourceById } from '@/lib/prisma-sources';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sourceId = id;
    const body = await request.json();

    const source = await getSourceById(sourceId);
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const userRole = await getUserRole();
    const canUpdate =
      source.createdByUserId === userId ||
      (source.isGlobal && userRole === 'admin');

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: {
      name?: string;
      url?: string;
      description?: string;
      avatarUrl?: string;
      isActive?: boolean;
      isGlobal?: boolean;
    } = {
      name: body.name,
      url: body.url,
      description: body.description,
      avatarUrl: body.avatarUrl,
      isActive: body.isActive,
    };

    if (userRole === 'admin' && body.isGlobal !== undefined) {
      updates.isGlobal = body.isGlobal;
    }

    const updatedSource = await updateSource(sourceId, updates);

    return NextResponse.json({ source: updatedSource });
  } catch (error) {
    console.error('Error updating source:', error);
    return NextResponse.json(
      { error: 'Failed to update source' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sourceId = id;

    const source = await getSourceById(sourceId);
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const userRole = await getUserRole();
    const canDelete =
      source.createdByUserId === userId ||
      (source.isGlobal && userRole === 'admin');

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deleteSource(sourceId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
