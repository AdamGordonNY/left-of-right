import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserRole } from '@/lib/auth';
import { createSource } from '@/lib/sources';
import { InsertSource } from '@/lib/database.types';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, url, description, avatar_url, is_global } = body;

    if (!name || !type || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, url' },
        { status: 400 }
      );
    }

    if (type !== 'youtube' && type !== 'substack') {
      return NextResponse.json(
        { error: 'Invalid type. Must be youtube or substack' },
        { status: 400 }
      );
    }

    const userRole = await getUserRole();
    const shouldBeGlobal = is_global && userRole === 'admin';

    const sourceData: InsertSource = {
      name,
      type,
      url,
      description,
      avatar_url,
      created_by_user_id: userId,
      is_global: shouldBeGlobal,
      is_active: true,
    };

    const source = await createSource(sourceData);

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}
