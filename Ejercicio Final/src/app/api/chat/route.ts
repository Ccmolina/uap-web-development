
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { rateLimitCheck } from "../../../lib/rate-limit";
import { sanitizeUserText, isEmptyMessage } from "../../../lib/sanitizer";
import { OPENROUTER_BASE_URL, DEFAULT_MODEL } from "../../../lib/openrouter";

export const runtime = "edge";

function jsonError(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  return new Response(
    JSON.stringify({
      ok: true,
      endpoint: "/api/chat",
      usage: "POST con { messages: [...]} al estilo Vercel AI SDK",
    }),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return jsonError("Falta OPENROUTER_API_KEY en .env.local", 500);


  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { allowed, remaining } = rateLimitCheck(ip || "unknown");
  if (!allowed) {
    return jsonError("Rate limit excedido. Probá de nuevo en un momento.", 429);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];

    if (!messages.length) return jsonError("Faltan messages", 400);

    
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      const clean = sanitizeUserText(last.content);
      if (isEmptyMessage(clean)) {
        return jsonError("Mensaje vacío luego de sanitizar", 400);
      }
      last.content = clean;
    }

    const openrouter = createOpenAI({
      baseURL: OPENROUTER_BASE_URL,
      apiKey,
      headers: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Ejercicio 13 Chatbot",
      },
    });

    const systemMessage = {
      role: "system",
      content:
        "Eres un asistente útil y amable. Responde claro y breve en español neutro.",
    };

    const result = await streamText({
      model: openrouter(DEFAULT_MODEL),
      messages: [systemMessage as any, ...messages],
      temperature: 0.7,
    });

    return result.toTextStreamResponse({
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-remaining-requests": String(remaining),
      },
    });
  } catch (err: unknown) {
    console.error("POST /api/chat error:", err);
    return jsonError("Error interno del servidor", 500);
  }
}
