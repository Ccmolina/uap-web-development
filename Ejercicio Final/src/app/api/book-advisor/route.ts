import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { rateLimitCheck } from "../../../lib/rate-limit";
import { sanitizeUserText, isEmptyMessage } from "../../../lib/sanitizer";
import { OPENROUTER_BASE_URL, DEFAULT_MODEL } from "../../../lib/openrouter";
import { prisma } from "../../../lib/db";
import { searchBooksApi, getBookDetailsApi } from "../../../lib/books";

function jsonError(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return jsonError("Falta OPENROUTER_API_KEY", 500);

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { allowed } = rateLimitCheck(ip || "unknown");
  if (!allowed) return jsonError("Rate limit excedido", 429);

  try {
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body?.messages) ? body.messages : [];
    const sessionId = String(body?.sessionId || "anon");

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
    });

    const result = await streamText({
      model: openrouter(DEFAULT_MODEL),
      messages: [
        {
          role: "system",
          content:
            "Eres un asistente de recomendación de libros. Siempre que el usuario pida recomendaciones, detalles de libros, gestionar listas o estadísticas de lectura, usa las tools disponibles. Responde en español y explica brevemente lo que haces.",
        } as any,
        ...messages,
      ],
      temperature: 0.7,
      tools: {
        searchBooks: {
          description:
            "Buscar libros en Google Books por título, autor, tema o palabras clave.",
          parameters: z.object({
            query: z.string(),
            maxResults: z.number().optional(),
            orderBy: z.string().optional(),
          }),
          execute: async ({ query, maxResults, orderBy }) => {
            const data = await searchBooksApi({
              query,
              maxResults,
              orderBy,
            });
            return data;
          },
        },
        getBookDetails: {
          description:
            "Obtener información detallada de un libro por su ID de Google Books.",
          parameters: z.object({
            bookId: z.string(),
          }),
          execute: async ({ bookId }) => {
            const data = await getBookDetailsApi(bookId);
            return data;
          },
        },
        addToReadingList: {
          description: "Agregar un libro a la lista 'Quiero leer' del usuario.",
          parameters: z.object({
            bookId: z.string(),
            priority: z.enum(["high", "medium", "low"]).optional(),
            notes: z.string().optional(),
          }),
          execute: async ({ bookId, priority, notes }) => {
            const item = await prisma.readingListItem.upsert({
              where: {
                sessionId_bookId: {
                  sessionId,
                  bookId,
                },
              },
              create: {
                sessionId,
                bookId,
                priority: priority ?? "medium",
                notes: notes ?? "",
                status: "to-read",
              },
              update: {
                priority: priority ?? "medium",
                notes: notes ?? "",
                status: "to-read",
              },
            });
            return { ok: true, item };
          },
        },
        getReadingList: {
          description: "Obtener la lista de libros pendientes por leer.",
          parameters: z.object({
            limit: z.number().optional(),
          }),
          execute: async ({ limit }) => {
            const items = await prisma.readingListItem.findMany({
              where: { sessionId, status: "to-read" },
              orderBy: { createdAt: "desc" },
              take: limit ?? 50,
            });
            return items;
          },
        },
        markAsRead: {
          description:
            "Marcar un libro como leído y opcionalmente agregar rating/review.",
          parameters: z.object({
            bookId: z.string(),
            rating: z.number().int().min(1).max(5).optional(),
            review: z.string().optional(),
            dateFinished: z.string().optional(),
          }),
          execute: async ({ bookId, rating, review, dateFinished }) => {
            const now = dateFinished ? new Date(dateFinished) : new Date();
            const item = await prisma.readingListItem.upsert({
              where: {
                sessionId_bookId: {
                  sessionId,
                  bookId,
                },
              },
              create: {
                sessionId,
                bookId,
                priority: "medium",
                status: "read",
                rating: rating ?? null,
                review: review ?? "",
                dateFinished: now,
              },
              update: {
                status: "read",
                rating: rating ?? null,
                review: review ?? "",
                dateFinished: now,
              },
            });
            return { ok: true, item };
          },
        },
        getReadingStats: {
          description:
            "Generar estadísticas de los hábitos de lectura del usuario.",
          parameters: z.object({
            period: z.enum(["all-time", "year", "month", "week"]).optional(),
          }),
          execute: async ({ period }) => {
            const now = new Date();
            let from: Date | undefined;
            if (period === "year") {
              from = new Date(now.getFullYear(), 0, 1);
            } else if (period === "month") {
              from = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (period === "week") {
              const day = now.getDay();
              const diff = (day + 6) % 7;
              from = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - diff
              );
            }

            const whereBase: any = {
              sessionId,
              status: "read",
            };
            if (from) whereBase.dateFinished = { gte: from };

            const readItems = await prisma.readingListItem.findMany({
              where: whereBase,
            });

            const totalBooks = readItems.length;

            const totalRatings = readItems
              .map((i: any) => i.rating)
              .filter((x: any): x is number => typeof x === "number");

            const avgRating =
              totalRatings.length > 0
                ? totalRatings.reduce(
                    (a: number, b: number) => a + b,
                    0
                  ) / totalRatings.length
                : null;

            return {
              totalBooks,
              avgRating,
            };
          },
        },
      },
      toolChoice: "auto",
    });

    return result.toTextStreamResponse({
      headers: {
        "content-type": "text/plain; charset=utf-8",
      },
    });
  } catch (err: unknown) {
    console.error("POST /api/book-advisor error:", err);
    return jsonError("Error interno del servidor", 500);
  }
}
