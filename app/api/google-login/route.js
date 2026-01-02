import { adminAuth } from "@/lib/firebaseAdmin";
import { signJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { idToken } = await req.json();

    // 🔐 Verify Google token
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    const email = decodedToken.email;
    const name = decodedToken.name || null;

    if (!email) {
      return NextResponse.json(
        { message: "Invalid token" },
        { status: 400 }
      );
    }

    // 🔎 Find user
    let user = await prisma.user.findUnique({
      where: { email },
    });

    // 🆕 Create user if not exists
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          password: null, // Google users don’t need password
        },
      });
    }

    // 🎟️ Generate app JWT
    const token = signJwt({ userId: user.id });

    // 🍪 Set cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "token",
      value: token,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });

    return NextResponse.json(
      { user, token },
      { status: 200 }
    );
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
