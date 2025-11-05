import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";
import { createSource } from "@/lib/prisma-sources";
import { ensureUserExists } from "@/lib/user-sync";

export async function POST(request: NextRequest) {
  try {
    const dbUserId = await ensureUserExists();
    if (!dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, type, url, description, avatarUrl, isGlobal } = body;

    if (!name || !type || !url) {
      return NextResponse.json(
        { error: "Missing required fields: name, type, url" },
        { status: 400 }
      );
    }

    if (type !== "youtube" && type !== "substack") {
      return NextResponse.json(
        { error: "Invalid type. Must be youtube or substack" },
        { status: 400 }
      );
    }

    const userRole = await getUserRole();
    const shouldBeGlobal = isGlobal && userRole === "admin";

    const source = await createSource({
      name,
      type,
      url,
      description,
      avatarUrl,
      createdByUserId: dbUserId,
      isGlobal: shouldBeGlobal,
      isActive: true,
    });

    return NextResponse.json({ source }, { status: 201 });
  } catch (error) {
    console.error("Error creating source:", error);
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    );
  }
}
