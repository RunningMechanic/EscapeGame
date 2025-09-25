-- AlterTable
ALTER TABLE "public"."Reception" ADD COLUMN     "cancelled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ended" BOOLEAN NOT NULL DEFAULT false;
