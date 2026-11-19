// Lays out a word's meaning for the projector. Pure functions.

const COLUMN_MARK = "‖"; // a line holding only this separates the Yoruba and English columns on the projector

export interface Meaning {
  term?: string;
  partOfSpeech?: string;
  english?: string;
  example?: string;
  yoruba?: string;
  yorubaExample?: string;
}

const one = (s?: string) => (s ?? "").replace(/\s+/g, " ").trim();

export function meaningTitle(term: string): string {
  const t = one(term);
  return `Meaning: ${t.charAt(0).toUpperCase()}${t.slice(1)}`;
}

export function formatMeaning(m: Meaning, language: "english" | "yoruba" | "both"): string {
  const pos = one(m.partOfSpeech);
  const english = `${pos ? `(${pos}) ` : ""}${one(m.english)}`.trim();
  const englishExample = one(m.example) ? `Example: ${one(m.example)}` : "";
  const yoruba = one(m.yoruba);
  const yorubaExample = one(m.yorubaExample) ? `Àpẹẹrẹ: ${one(m.yorubaExample)}` : "";

  if (language === "both" && yoruba) {
    const rows = [`${yoruba}\n${COLUMN_MARK}\n${english}`];
    if (englishExample || yorubaExample) rows.push(`${yorubaExample || "—"}\n${COLUMN_MARK}\n${englishExample || "—"}`);
    return rows.join("\n\n");
  }
  if (language === "yoruba" && yoruba) return [yoruba, yorubaExample].filter(Boolean).join("\n\n");
  return [english, englishExample].filter(Boolean).join("\n\n");
}
