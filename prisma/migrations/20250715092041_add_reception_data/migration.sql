-- CreateTable
CREATE TABLE "ReceptionData" (
    "id" SERIAL NOT NULL,
    "start" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "checker" BOOLEAN NOT NULL,
    "alignment" BOOLEAN NOT NULL,

    CONSTRAINT "ReceptionData_pkey" PRIMARY KEY ("id")
);
