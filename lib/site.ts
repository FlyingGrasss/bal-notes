export type SiteMode = "notes" | "homework";

export function getSiteMode(host?: string | null): SiteMode {
  const configured = process.env.SITE_MODE;
  if (configured === "homework" || configured === "notes") return configured;

  return host?.split(":")[0].toLowerCase() === "odevler.balogrenci.org"
    ? "homework"
    : "notes";
}
