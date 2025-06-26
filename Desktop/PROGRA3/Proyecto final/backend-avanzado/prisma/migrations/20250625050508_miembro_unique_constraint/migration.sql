/*
  Warnings:

  - A unique constraint covering the columns `[usuarioId,tableroId]` on the table `Miembro` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Miembro_usuarioId_tableroId_key" ON "Miembro"("usuarioId", "tableroId");
