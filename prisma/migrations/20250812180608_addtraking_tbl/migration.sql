/*
  Warnings:

  - You are about to drop the `Traking` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Traking" DROP CONSTRAINT "Traking_userId_fkey";

-- DropTable
DROP TABLE "public"."Traking";

-- CreateTable
CREATE TABLE "public"."ExerciseTracking" (
    "id" TEXT NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ExerciseTracking_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ExerciseTracking" ADD CONSTRAINT "ExerciseTracking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
