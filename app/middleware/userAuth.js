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

    let userData;
    try {
      userData = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.error("JWT Verification Error:", jwtError.message);

      if (jwtError.name === "TokenExpiredError") {
        return {
          error: true,
          response: NextResponse.json(
            { message: "Session expired. Please login again" },
            { status: 401 }
          ),
        };
      }

      return {
        error: true,
        response: NextResponse.json(
          { message: "Invalid authentication token" },
          { status: 401 }
        ),
      };
    }

    const user = await prisma.user.findUnique({
      where: { email: userData.email },
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
