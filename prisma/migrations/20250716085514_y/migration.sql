/*
  Warnings:

  - You are about to drop the column `name` on the `Reception` table. All the data in the column will be lost.
  - Added the required column `alignment` to the `Reception` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Reception` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reception" DROP COLUMN "name",
ADD COLUMN     "alignment" BOOLEAN NOT NULL,
ADD COLUMN     "number" INTEGER NOT NULL;
