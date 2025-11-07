import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sources = await prisma.source.findMany({
      orderBy: { createdAt: "desc" },
    });

    const users = await prisma.user.findMany({
      select: { id: true, clerkId: true, email: true },
    });

    const follows = await prisma.userFollow.findMany();

    return NextResponse.json({
      sourcesCount: sources.length,
      sources: sources,
      usersCount: users.length,
      users: users,
      followsCount: follows.length,
      follows: follows,
    });
  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
