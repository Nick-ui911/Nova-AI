import { prisma } from "@/lib/prisma";
import { userAuth } from "../../middleware/userAuth";
export async function GET(req) {
  try {
    const user = await userAuth(req);
    const userId = user.id;

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
