-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tablero" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "propietarioId" INTEGER NOT NULL,

    CONSTRAINT "Tablero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" SERIAL NOT NULL,
    "contenido" TEXT NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "tableroId" INTEGER NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Miembro" (
    "id" SERIAL NOT NULL,
    "tableroId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "rol" TEXT NOT NULL,

    CONSTRAINT "Miembro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- AddForeignKey
ALTER TABLE "Tablero" ADD CONSTRAINT "Tablero_propietarioId_fkey" FOREIGN KEY ("propietarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_tableroId_fkey" FOREIGN KEY ("tableroId") REFERENCES "Tablero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_tableroId_fkey" FOREIGN KEY ("tableroId") REFERENCES "Tablero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Miembro" ADD CONSTRAINT "Miembro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
