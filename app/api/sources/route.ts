import { NextRequest, NextResponse } from 'next/server';
import { getUserId, getUserRole } from '@/lib/auth';
import { createSource } from '@/lib/prisma-sources';

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, url, description, avatarUrl, isGlobal } = body;

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
    const shouldBeGlobal = isGlobal && userRole === 'admin';

    const source = await createSource({
      name,
      type,
      url,
      description,
      avatarUrl,
      createdByUserId: userId,
      isGlobal: shouldBeGlobal,
      isActive: true,
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Error creating source:', error);
    return NextResponse.json(
      { error: 'Failed to create source' },
      { status: 500 }
    );
  }
}
