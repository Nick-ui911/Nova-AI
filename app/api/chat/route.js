import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { verifyJwt } from "../../../lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    const payload = verifyJwt(token);
    if (!payload) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = payload.userId;

    const chats = await prisma.chatSession.findMany({
      where: { userId },
      select: { id: true, title: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return Response.json(chats);
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
