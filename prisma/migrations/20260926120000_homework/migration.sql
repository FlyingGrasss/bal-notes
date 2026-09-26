-- CreateEnum
CREATE TYPE "HomeworkSubject" AS ENUM ('EDEBIYAT', 'MATEMATIK', 'FIZIK', 'KIMYA', 'BIYOLOJI', 'FELSEFE', 'TARIH');

-- CreateEnum
CREATE TYPE "HomeworkWriterKind" AS ENUM ('TEACHER', 'SMART_BOARD');

-- CreateTable
CREATE TABLE "homework_writers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "HomeworkWriterKind" NOT NULL,
    "fixedSubject" "HomeworkSubject",
    "keyHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "homework_writers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_writer_sessions" (
    "id" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    CONSTRAINT "homework_writer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework" (
    "id" TEXT NOT NULL,
    "writerId" TEXT NOT NULL,
    "subject" "HomeworkSubject" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "homework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homework_login_rate_limits" (
    "bucketKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "homework_login_rate_limits_pkey" PRIMARY KEY ("bucketKey")
);

-- CreateIndex
CREATE UNIQUE INDEX "homework_writers_keyHash_key" ON "homework_writers"("keyHash");
CREATE INDEX "homework_writers_kind_fixedSubject_idx" ON "homework_writers"("kind", "fixedSubject");
CREATE UNIQUE INDEX "homework_writer_sessions_tokenHash_key" ON "homework_writer_sessions"("tokenHash");
CREATE INDEX "homework_writer_sessions_writerId_expiresAt_idx" ON "homework_writer_sessions"("writerId", "expiresAt");
CREATE INDEX "homework_writer_sessions_expiresAt_idx" ON "homework_writer_sessions"("expiresAt");
CREATE INDEX "homework_dueDate_subject_idx" ON "homework"("dueDate", "subject");
CREATE INDEX "homework_writerId_updatedAt_idx" ON "homework"("writerId", "updatedAt");
CREATE INDEX "homework_login_rate_limits_windowStart_idx" ON "homework_login_rate_limits"("windowStart");

-- AddForeignKey
ALTER TABLE "homework_writer_sessions" ADD CONSTRAINT "homework_writer_sessions_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "homework_writers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "homework" ADD CONSTRAINT "homework_writerId_fkey" FOREIGN KEY ("writerId") REFERENCES "homework_writers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
