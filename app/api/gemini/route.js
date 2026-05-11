import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";
import { userAuth } from "../../middle-ware/userAuth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// In-memory rate limiter: 20 requests per minute per user
const rateLimitMap = new Map();

function isRateLimited(userId) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = 20;
  const entry = rateLimitMap.get(userId) ?? { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }
  entry.count++;
  rateLimitMap.set(userId, entry);
  return entry.count > limit;
}

export async function POST(req) {
  try {
    const auth = await userAuth(req);
    if (auth.error) return new Response("Unauthorized", { status: 401 });

    const userId = auth.user.id;

    if (isRateLimited(userId)) {
      return new Response("Too many requests. Please slow down.", { status: 429 });
    }

    const { message, chatId } = await req.json();

    if (!message?.trim()) return new Response("Message is required", { status: 400 });
    if (message.length > 4000) return new Response("Message too long (max 4000 chars)", { status: 400 });

    let sessionId = chatId;

    if (!sessionId) {
      const title = message.trim().length < 10 ? "New Chat" : message.trim().slice(0, 40);
      const chat = await prisma.chatSession.create({ data: { userId, title } });
      sessionId = chat.id;
    } else {
      const chat = await prisma.chatSession.findFirst({ where: { id: sessionId, userId } });
      if (!chat) return new Response("Forbidden", { status: 403 });
    }

    // Save user message
    await prisma.message.create({
      data: { role: "user", content: message.trim(), chatId: sessionId },
    });

    // Fetch last 100 messages (50 user + 50 AI) for conversation history
    const recentMessages = await prisma.message.findMany({
      where: { chatId: sessionId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { role: true, content: true },
    });

    // Reverse to chronological order, then exclude the last user message we just saved
    const allMessages = recentMessages.reverse();

    // Build Gemini history — everything except the last user message we just saved
    const history = allMessages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const model = genAI.getGenerativeModel({ model: "models/gemini-2.5-flash" });
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(message.trim());

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
            data: { role: "ai", content: fullResponse, chatId: sessionId },
          });
        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Chat-Id": sessionId,
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
