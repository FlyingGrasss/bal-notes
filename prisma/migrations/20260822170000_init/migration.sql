-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "balnotes";

-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM ('PREP', 'NINE', 'TEN', 'ELEVEN', 'TWELVE');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BANNED');

-- CreateTable
CREATE TABLE "balnotes_profile_info" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "banReason" TEXT,
    "bannedAt" TIMESTAMP(3),
    "bannedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "balnotes_profile_info_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "oauth_attempts" (
    "stateHash" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "nextPath" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "oauth_attempts_pkey" PRIMARY KEY ("stateHash")
);

CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "gradeLevel" "GradeLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "gradeLevel" "GradeLevel" NOT NULL,
    "subjectId" TEXT,
    "customSubject" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "isRecommended" BOOLEAN NOT NULL DEFAULT false,
    "recommendedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "note_assets" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "note_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "note_votes" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "note_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teacher_quotes" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "context" TEXT,
    "gradeLevel" "GradeLevel",
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "teacher_quotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "balnotes_profile_info_email_key" ON "balnotes_profile_info"("email");
CREATE INDEX "balnotes_profile_info_status_idx" ON "balnotes_profile_info"("status");
CREATE INDEX "oauth_attempts_expiresAt_idx" ON "oauth_attempts"("expiresAt");
CREATE INDEX "subjects_gradeLevel_isActive_sortOrder_idx" ON "subjects"("gradeLevel", "isActive", "sortOrder");
CREATE UNIQUE INDEX "subjects_gradeLevel_slug_key" ON "subjects"("gradeLevel", "slug");
CREATE INDEX "notes_status_publishedAt_idx" ON "notes"("status", "publishedAt");
CREATE INDEX "notes_status_isRecommended_recommendedAt_idx" ON "notes"("status", "isRecommended", "recommendedAt");
CREATE INDEX "notes_gradeLevel_status_publishedAt_idx" ON "notes"("gradeLevel", "status", "publishedAt");
CREATE INDEX "notes_subjectId_status_publishedAt_idx" ON "notes"("subjectId", "status", "publishedAt");
CREATE INDEX "notes_authorId_status_updatedAt_idx" ON "notes"("authorId", "status", "updatedAt");
CREATE UNIQUE INDEX "note_assets_pathname_key" ON "note_assets"("pathname");
CREATE INDEX "note_assets_noteId_sortOrder_idx" ON "note_assets"("noteId", "sortOrder");
CREATE INDEX "note_votes_userId_idx" ON "note_votes"("userId");
CREATE UNIQUE INDEX "note_votes_noteId_userId_key" ON "note_votes"("noteId", "userId");
CREATE INDEX "teacher_quotes_status_publishedAt_idx" ON "teacher_quotes"("status", "publishedAt");
CREATE INDEX "teacher_quotes_authorId_status_updatedAt_idx" ON "teacher_quotes"("authorId", "status", "updatedAt");

ALTER TABLE "notes" ADD CONSTRAINT "notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "balnotes_profile_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notes" ADD CONSTRAINT "notes_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "note_assets" ADD CONSTRAINT "note_assets_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "note_votes" ADD CONSTRAINT "note_votes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "note_votes" ADD CONSTRAINT "note_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "balnotes_profile_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "teacher_quotes" ADD CONSTRAINT "teacher_quotes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "balnotes_profile_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
