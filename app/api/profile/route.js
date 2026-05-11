import { NextResponse } from "next/server";
import { userAuth } from "../../middle-ware/userAuth";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const auth = await userAuth(req);

    if (auth.error) {
      return NextResponse.json({ message: "Unauthorized", data: null }, { status: 401 });
    }

    const userId = auth.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found", data: null }, { status: 404 });
    }

    const chatCount = await prisma.chatSession.count({ where: { userId } });

    const messageCount = await prisma.message.count({
      where: { chat: { userId } },
    });

    return NextResponse.json({
      message: "OK",
      data: { ...user, chatCount, messageCount },
    });
  } catch (error) {
    console.error("Profile error:", error.message);
    return NextResponse.json({ message: "Internal server error", data: null }, { status: 500 });
  }
}
