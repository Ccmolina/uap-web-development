import { NextRequest } from "next/server";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { rateLimitCheck } from "../../../lib/rate-limit";
import { sanitizeUserText, isEmptyMessage } from "../../../lib/sanitizer";
import { OPENROUTER_BASE_URL, DEFAULT_MODEL } from "../../../lib/openrouter";
import { prisma } from "../../../lib/db";
import { createTaskDb, updateTaskDb, softDeleteTaskDb } from "../../../lib/tasks";

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
            "Eres un gestor de tareas conversacional. Usa las tools para crear, actualizar, borrar, buscar tareas y obtener estadísticas. Siempre explica brevemente qué hiciste. No inventes datos, usa la base de datos.",
        } as any,
        ...messages,
      ],
      temperature: 0.7,
      tools: {
        createTask: {
          description: "Crear una nueva tarea.",
          parameters: z.object({
            title: z.string(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            dueDate: z.string().optional(),
            category: z
              .enum(["work", "personal", "shopping", "health", "other"])
              .optional(),
          }),
          execute: async ({ title, priority, dueDate, category }) => {
            if (!title.trim()) throw new Error("El título no puede estar vacío");
            if (dueDate) {
              const d = new Date(dueDate);
              if (Number.isNaN(d.getTime()) || d < new Date()) {
                throw new Error("La fecha límite debe ser futura");
              }
            }
            const task = await createTaskDb({
              sessionId,
              title,
              priority,
              dueDate,
              category,
            });
            return task;
          },
        },
        updateTask: {
          description: "Modificar una tarea existente.",
          parameters: z.object({
            taskId: z.string(),
            title: z.string().optional(),
            completed: z.boolean().optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            dueDate: z.string().optional(),
            category: z
              .enum(["work", "personal", "shopping", "health", "other"])
              .optional(),
          }),
          execute: async ({
            taskId,
            title,
            completed,
            priority,
            dueDate,
            category,
          }) => {
            const task = await updateTaskDb({
              sessionId,
              taskId,
              title,
              completed,
              priority,
              dueDate,
              category,
            });
            return task;
          },
        },
        deleteTask: {
          description: "Eliminar permanentemente una tarea.",
          parameters: z.object({
            taskId: z.string(),
          }),
          execute: async ({ taskId }) => {
            const deleted = await softDeleteTaskDb({ sessionId, taskId });
            return { ok: true, deletedId: deleted.id, title: deleted.title };
          },
        },
        searchTasks: {
          description: "Buscar, filtrar y listar tareas.",
          parameters: z.object({
            query: z.string().optional(),
            completed: z.boolean().optional(),
            priority: z.enum(["low", "medium", "high"]).optional(),
            category: z
              .enum(["work", "personal", "shopping", "health", "other"])
              .optional(),
            limit: z.number().optional(),
          }),
          execute: async ({ query, completed, priority, category, limit }) => {
            const where: any = {
              sessionId,
              deletedAt: null,
            };
            if (typeof completed === "boolean") where.completed = completed;
            if (priority) where.priority = priority;
            if (category) where.category = category;
            if (query) {
              where.title = { contains: query, mode: "insensitive" };
            }

            const tasks = await prisma.task.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: limit ?? 50,
            });
            return tasks;
          },
        },
        getTaskStats: {
          description:
            "Generar estadísticas y analytics de productividad del usuario.",
          parameters: z.object({
            period: z
              .enum(["today", "week", "month", "year", "all-time"])
              .optional(),
          }),
          execute: async ({ period }) => {
            const now = new Date();
            let from: Date | undefined;
            if (period === "today") {
              from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (period === "week") {
              const day = now.getDay();
              const diff = (day + 6) % 7;
              from = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() - diff
              );
            } else if (period === "month") {
              from = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (period === "year") {
              from = new Date(now.getFullYear(), 0, 1);
            }

            const whereBase: any = { sessionId, deletedAt: null };
            if (from) whereBase.createdAt = { gte: from };

            const tasks = await prisma.task.findMany({ where: whereBase });

            const summary = {
              totalTasks: tasks.length,
              completedTasks: tasks.filter((t: any) => t.completed).length,
              pendingTasks: tasks.filter((t: any) => !t.completed).length,
              overdueTasks: tasks.filter(
                (t: any) => !t.completed && t.dueDate && t.dueDate < now
              ).length,
            };
            const completionRate =
              summary.totalTasks > 0
                ? summary.completedTasks / summary.totalTasks
                : 0;

            return {
              summary: { ...summary, completionRate },
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
    console.error("POST /api/todo-manager error:", err);
    return jsonError("Error interno del servidor", 500);
  }
}
