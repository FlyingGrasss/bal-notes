-- DropIndex
DROP INDEX "homework_dueDate_subject_idx";

-- AlterTable
ALTER TABLE "homework" ADD COLUMN     "isPast" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "homework_isPast_dueDate_subject_idx" ON "homework"("isPast", "dueDate", "subject");
