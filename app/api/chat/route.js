

import { prisma } from "@/lib/prisma";
import { userAuth } from "../../middle-ware/userAuth";
export async function GET(req) {
  try {
    const auth = await userAuth(req);

    if (auth.error) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const userId = auth.user.id;

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
