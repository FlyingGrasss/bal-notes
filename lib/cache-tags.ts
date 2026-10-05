export const CACHE_TAGS = {
  notes: "bal-notes:notes",
  note: (id: string) => `bal-notes:note:${id}`,
  quotes: "bal-notes:quotes",
  subjects: "bal-notes:subjects",
} as const;
