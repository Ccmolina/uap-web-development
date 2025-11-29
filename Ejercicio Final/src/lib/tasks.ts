
import { prisma } from "./db";


export async function createTaskDb({
  sessionId,
  title,
  priority,
  dueDate,
  category,
}: {
  sessionId: string;
  title: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  category?: "work" | "personal" | "shopping" | "health" | "other";
}) {
  const parsedDue = dueDate ? new Date(dueDate) : null;

  return prisma.task.create({
    data: {
      sessionId,
      title,
      priority: priority ?? "medium",
      dueDate: parsedDue,
      category: category ?? "other",
      completed: false,
    },
  });
}

export async function updateTaskDb({
  sessionId,
  taskId,
  title,
  completed,
  priority,
  dueDate,
  category,
}: {
  sessionId: string;
  taskId: string;
  title?: string;
  completed?: boolean;
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  category?: "work" | "personal" | "shopping" | "health" | "other";
}) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, sessionId, deletedAt: null },
  });

  if (!existing) {
    throw new Error(`La tarea no existe o no pertenece a esta sesión`);
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      title: title ?? existing.title,
      completed: completed ?? existing.completed,
      priority: priority ?? existing.priority,
      dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
      category: category ?? existing.category,
    },
  });
}

export async function softDeleteTaskDb({
  sessionId,
  taskId,
}: {
  sessionId: string;
  taskId: string;
}) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, sessionId, deletedAt: null },
  });

  if (!existing) {
    throw new Error("La tarea no existe o ya fue eliminada");
  }

  return prisma.task.update({
    where: { id: taskId },
    data: { deletedAt: new Date() },
  });
}
