import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { userAuth } from "../../../middle-ware/userAuth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const auth = await userAuth(req);
    if (auth.error) return new Response("Unauthorized", { status: 401 });

    const userId = auth.user.id;
    const { chatId } = await req.json();

    if (!chatId) return new Response("chatId is required", { status: 400 });

    const chatSession = await prisma.chatSession.findFirst({ where: { id: chatId, userId } });
    if (!chatSession) return new Response("Forbidden", { status: 403 });

    // Delete the last AI message
    const lastAiMessage = await prisma.message.findFirst({
      where: { chatId, role: "ai" },
      orderBy: { createdAt: "desc" },
    });

    if (lastAiMessage) {
      await prisma.message.delete({ where: { id: lastAiMessage.id } });
    }

    // Get last 100 messages (50 user + 50 AI) after deletion
    const recent = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { role: true, content: true },
    });
    const remaining = recent.reverse();

    if (remaining.length === 0) return new Response("No messages to regenerate from", { status: 400 });

    const lastUserMsg = remaining[remaining.length - 1];
    if (lastUserMsg.role !== "user") return new Response("Cannot regenerate", { status: 400 });

    // History is everything except the last user message
    const history = remaining.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(lastUserMsg.content);

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            controller.enqueue(new TextEncoder().encode(text));
          }
          await prisma.message.create({
            data: { role: "ai", content: fullResponse, chatId },
          });
        } catch (err) {
          console.error("Regenerate stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
