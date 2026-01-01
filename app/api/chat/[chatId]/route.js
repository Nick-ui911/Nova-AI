

import { prisma } from "@/lib/prisma";
import { userAuth } from "../../../middle-ware/userAuth";

export async function GET(req, { params }) {
  try {
    // ✅ Auth handled by middleware
    const auth = await userAuth(req);

    if (auth.error) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const userId = auth.user.id;

    const { chatId } = await params;

    const chat = await prisma.chatSession.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      return new Response("Forbidden", { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return Response.json(messages);
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}

// 🔹 DELETE chat
export async function DELETE(req, { params }) {
  try {
    const auth = await userAuth(req);

    if (auth.error) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const userId = auth.user.id;

    const { chatId } = await params;

    const chat = await prisma.chatSession.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) return new Response("Forbidden", { status: 403 });

    await prisma.message.deleteMany({ where: { chatId } });
    await prisma.chatSession.delete({ where: { id: chatId } });

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
