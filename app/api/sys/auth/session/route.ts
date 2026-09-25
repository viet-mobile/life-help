import { NextRequest, NextResponse } from "next/server";
import {
  SYS_SESSION_COOKIE,
  verifySysSessionToken,
} from "@/lib/auth/sysSession";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SYS_SESSION_COOKIE)?.value;
    const session = await verifySysSessionToken(token);

    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      id: session.id,
      role: session.role,
    });
  } catch (error) {
    console.error("SYS session error:", error);

    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }
}
