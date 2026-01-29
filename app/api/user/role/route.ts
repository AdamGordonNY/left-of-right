import { NextResponse } from "next/server";
import { getUserRole } from "@/lib/auth";

/**
 * GET /api/user/role
 * @description Retrieves the current user's role (admin or member)
 * @access Public (returns 'member' for unauthenticated users)
 * @returns {Promise<NextResponse>} JSON with role field
 */
export async function GET() {
  try {
    const role = await getUserRole();
    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    return NextResponse.json({ role: "member" }, { status: 200 });
  }
}
