import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const userAuth = async () => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return {
        error: true,
        response: NextResponse.json(
          { message: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return {
        error: true,
        response: NextResponse.json(
          { message: "Invalid or expired token" },
          { status: 401 }
        ),
      };
    }

    // ✅ use userId from JWT
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return {
        error: true,
        response: NextResponse.json(
          { message: "User not found" },
          { status: 404 }
        ),
      };
    }

    return {
      error: false,
      user,
    };
  } catch (error) {
    console.error("Authentication Error:", error.message);
    return {
      error: true,
      response: NextResponse.json(
        { message: "Authentication failed" },
        { status: 500 }
      ),
    };
  }
};
