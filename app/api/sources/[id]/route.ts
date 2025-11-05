import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserRole } from '@/lib/auth';
import { updateSource, deleteSource, getSourceById } from '@/lib/sources';
import { UpdateSource } from '@/lib/database.types';

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
      source.created_by_user_id === userId ||
      (source.is_global && userRole === 'admin');

    if (!canUpdate) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: UpdateSource = {
      name: body.name,
      description: body.description,
      avatar_url: body.avatar_url,
      is_active: body.is_active,
    };

    if (userRole === 'admin' && body.is_global !== undefined) {
      updates.is_global = body.is_global;
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
      source.created_by_user_id === userId ||
      (source.is_global && userRole === 'admin');

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
