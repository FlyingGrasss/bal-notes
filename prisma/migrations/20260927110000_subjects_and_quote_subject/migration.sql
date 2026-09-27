ALTER TYPE "HomeworkSubject" ADD VALUE IF NOT EXISTS 'COGRAFYA';
ALTER TYPE "HomeworkSubject" ADD VALUE IF NOT EXISTS 'DIN_KULTURU';

ALTER TABLE "teacher_quotes" ADD COLUMN "subjectId" TEXT;

CREATE INDEX "teacher_quotes_subjectId_status_publishedAt_idx"
ON "teacher_quotes"("subjectId", "status", "publishedAt");

ALTER TABLE "teacher_quotes"
ADD CONSTRAINT "teacher_quotes_subjectId_fkey"
FOREIGN KEY ("subjectId") REFERENCES "subjects"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "subjects" ("id", "gradeLevel", "name", "slug", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT defaults."id", defaults."gradeLevel"::"GradeLevel", defaults."name", defaults."slug", true, defaults."sortOrder", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM (VALUES
  ('default-prep-matematik', 'PREP', 'Matematik', 'matematik', 10),
  ('default-prep-edebiyat', 'PREP', 'Edebiyat', 'edebiyat', 20),
  ('default-prep-fizik', 'PREP', 'Fizik', 'fizik', 30),
  ('default-prep-biyoloji', 'PREP', 'Biyoloji', 'biyoloji', 40),
  ('default-prep-kimya', 'PREP', 'Kimya', 'kimya', 50),
  ('default-prep-tarih', 'PREP', 'Tarih', 'tarih', 60),
  ('default-prep-cografya', 'PREP', 'Coğrafya', 'cografya', 70),
  ('default-prep-felsefe', 'PREP', 'Felsefe', 'felsefe', 80),
  ('default-prep-din-kulturu', 'PREP', 'Din Kültürü', 'din-kulturu', 90),
  ('default-nine-matematik', 'NINE', 'Matematik', 'matematik', 10),
  ('default-nine-edebiyat', 'NINE', 'Edebiyat', 'edebiyat', 20),
  ('default-nine-fizik', 'NINE', 'Fizik', 'fizik', 30),
  ('default-nine-biyoloji', 'NINE', 'Biyoloji', 'biyoloji', 40),
  ('default-nine-kimya', 'NINE', 'Kimya', 'kimya', 50),
  ('default-nine-tarih', 'NINE', 'Tarih', 'tarih', 60),
  ('default-nine-cografya', 'NINE', 'Coğrafya', 'cografya', 70),
  ('default-nine-felsefe', 'NINE', 'Felsefe', 'felsefe', 80),
  ('default-nine-din-kulturu', 'NINE', 'Din Kültürü', 'din-kulturu', 90),
  ('default-ten-matematik', 'TEN', 'Matematik', 'matematik', 10),
  ('default-ten-edebiyat', 'TEN', 'Edebiyat', 'edebiyat', 20),
  ('default-ten-fizik', 'TEN', 'Fizik', 'fizik', 30),
  ('default-ten-biyoloji', 'TEN', 'Biyoloji', 'biyoloji', 40),
  ('default-ten-kimya', 'TEN', 'Kimya', 'kimya', 50),
  ('default-ten-tarih', 'TEN', 'Tarih', 'tarih', 60),
  ('default-ten-cografya', 'TEN', 'Coğrafya', 'cografya', 70),
  ('default-ten-felsefe', 'TEN', 'Felsefe', 'felsefe', 80),
  ('default-ten-din-kulturu', 'TEN', 'Din Kültürü', 'din-kulturu', 90),
  ('default-eleven-matematik', 'ELEVEN', 'Matematik', 'matematik', 10),
  ('default-eleven-edebiyat', 'ELEVEN', 'Edebiyat', 'edebiyat', 20),
  ('default-eleven-fizik', 'ELEVEN', 'Fizik', 'fizik', 30),
  ('default-eleven-biyoloji', 'ELEVEN', 'Biyoloji', 'biyoloji', 40),
  ('default-eleven-kimya', 'ELEVEN', 'Kimya', 'kimya', 50),
  ('default-eleven-tarih', 'ELEVEN', 'Tarih', 'tarih', 60),
  ('default-eleven-cografya', 'ELEVEN', 'Coğrafya', 'cografya', 70),
  ('default-eleven-felsefe', 'ELEVEN', 'Felsefe', 'felsefe', 80),
  ('default-eleven-din-kulturu', 'ELEVEN', 'Din Kültürü', 'din-kulturu', 90),
  ('default-twelve-matematik', 'TWELVE', 'Matematik', 'matematik', 10),
  ('default-twelve-edebiyat', 'TWELVE', 'Edebiyat', 'edebiyat', 20),
  ('default-twelve-fizik', 'TWELVE', 'Fizik', 'fizik', 30),
  ('default-twelve-biyoloji', 'TWELVE', 'Biyoloji', 'biyoloji', 40),
  ('default-twelve-kimya', 'TWELVE', 'Kimya', 'kimya', 50),
  ('default-twelve-tarih', 'TWELVE', 'Tarih', 'tarih', 60),
  ('default-twelve-cografya', 'TWELVE', 'Coğrafya', 'cografya', 70),
  ('default-twelve-felsefe', 'TWELVE', 'Felsefe', 'felsefe', 80),
  ('default-twelve-din-kulturu', 'TWELVE', 'Din Kültürü', 'din-kulturu', 90)
) AS defaults("id", "gradeLevel", "name", "slug", "sortOrder")
WHERE NOT EXISTS (
  SELECT 1 FROM "subjects" existing
  WHERE existing."gradeLevel" = defaults."gradeLevel"::"GradeLevel"
    AND existing."slug" = defaults."slug"
);
