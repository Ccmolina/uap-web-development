/*
  Warnings:

  - You are about to drop the column `contenido` on the `Tarea` table. All the data in the column will be lost.
  - Added the required column `titulo` to the `Tarea` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Tarea" DROP COLUMN "contenido",
ADD COLUMN     "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "titulo" TEXT NOT NULL;
