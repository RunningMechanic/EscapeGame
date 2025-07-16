/*
  Warnings:

  - You are about to drop the `ReceptionData` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ReceptionData";

-- CreateTable
CREATE TABLE "Reception" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "room" INTEGER NOT NULL,

    CONSTRAINT "Reception_pkey" PRIMARY KEY ("id")
);
