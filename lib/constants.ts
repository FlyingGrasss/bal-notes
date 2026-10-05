import type { GradeLevel } from "@prisma/client";

export const GRADE_OPTIONS: Array<{ value: GradeLevel; label: string; short: string }> = [
  { value: "PREP", label: "Hazırlık", short: "H" },
  { value: "NINE", label: "9. Sınıf", short: "9" },
  { value: "TEN", label: "10. Sınıf", short: "10" },
  { value: "ELEVEN", label: "11. Sınıf", short: "11" },
  { value: "TWELVE", label: "12. Sınıf", short: "12" },
];

export const GRADE_LABELS = Object.fromEntries(
  GRADE_OPTIONS.map((grade) => [grade.value, grade.label]),
) as Record<GradeLevel, string>;

export const ALLOWED_UPLOAD_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_FILE_SIZE = 15 * 1024 * 1024;
export const MAX_NOTE_SIZE = 60 * 1024 * 1024;
export const MAX_NOTE_FILES = 10;
export const MAX_PENDING_SUBMISSIONS = 5;
export const OAUTH_STATE_COOKIE = "bal_notes_oauth_state";

export const STATUS_LABELS = {
  DRAFT: "Taslak",
  PENDING: "İncelemede",
  APPROVED: "Onaylandı",
  REJECTED: "Reddedildi",
} as const;
