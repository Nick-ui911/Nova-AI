
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { userAuth } from "../../middle-ware/userAuth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    // ✅ read token cookie
    // ✅ Auth handled by middleware
    const auth = await userAuth(req);

    if (auth.error) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    const userId = auth.user.id;

    const { message, chatId } = await req.json();
    let sessionId = chatId;

    // 1️⃣ Create new chat if first message
    if (!sessionId) {
      const title =
        message.trim().length < 10 ? "New Chat" : message.trim().slice(0, 40);

      const chat = await prisma.chatSession.create({
        data: {
          userId,
          title,
        },
      });

      sessionId = chat.id;
    } else {
      // 2️⃣ Validate ownership
      const chat = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
      if (!chat) {
        return new Response("Forbidden", { status: 403 });
      }
    }

    // 3️⃣ Save user message
    await prisma.message.create({
      data: {
        role: "user",
        content: message,
        chatId: sessionId,
      },
    });

    // 4️⃣ Ask Gemini
    const model = genAI.getGenerativeModel({
      model: "models/gemini-2.5-flash",
    });

    const result = await model.generateContent(message);
    const aiReply = result.response.text();

    // 5️⃣ Save AI reply
    await prisma.message.create({
      data: {
        role: "ai",
        content: aiReply,
        chatId: sessionId,
      },
    });

    return Response.json({
      chatId: sessionId,
      reply: aiReply,
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
