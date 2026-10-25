// patch-presentation.mjs — adds the Yoruba / English / Both choice for hymns and keeps line breaks on the projector.
// Edits exactly three of your files by exact-text replacement. If ANY expected text is not found exactly once, NOTHING is changed.
// Saves a copy of each original next to it as <file>.bak-before-language.   Run from the repo root:  node scripts/hymns/patch-presentation.mjs
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const CONTROL = 'app/presentation/control/page.tsx', DISPLAY = 'app/presentation/page.tsx', LOOKUP = 'app/api/presentation/lookup/route.ts';
const edits = [
  { file: CONTROL, find: '  const [hymnNumber, setHymnNumber] = useState("");',
    add: '  const [hymnNumber, setHymnNumber] = useState("");\n  const [hymnLanguage, setHymnLanguage] = useState<"both" | "yoruba" | "english">("both");' },
  { file: CONTROL, find: 'body: JSON.stringify({ type: "hymn", number: hymnNumber }),',
    add: 'body: JSON.stringify({ type: "hymn", number: hymnNumber, language: hymnLanguage }),' },
  { file: CONTROL, find: '                    onChange={(e) => setHymnNumber(e.target.value)}\n                  />\n                </div>\n',
    add: '                    onChange={(e) => setHymnNumber(e.target.value)}\n                  />\n                </div>\n' +
      '                <div>\n                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70">\n                    Show\n                  </label>\n                  <div className="flex gap-2">\n' +
      '                    {(["both", "yoruba", "english"] as const).map((opt) => (\n                      <button\n                        key={opt}\n                        onClick={() => setHymnLanguage(opt)}\n' +
      '                        className={`rounded-lg px-3 py-2 text-sm ${\n                          hymnLanguage === opt ? "bg-navy text-gold" : "bg-gray-100 text-navy"\n                        }`}\n                      >\n' +
      '                        {opt === "both" ? "Both" : opt === "yoruba" ? "Yorùbá" : "English"}\n                      </button>\n                    ))}\n                  </div>\n                </div>\n' },
  { file: CONTROL, find: 'className={`${fontSizeClass(fontSize)} ${lineSpacingClass(lineSpacing)} text-white`}',
    add: 'className={`${fontSizeClass(fontSize)} ${lineSpacingClass(lineSpacing)} whitespace-pre-line text-white`}' },
  { file: DISPLAY, find: 'className={`${fontSize} ${lineSpacing} text-white`}',
    add: 'className={`${fontSize} ${lineSpacing} whitespace-pre-line text-white`}' },
  { file: LOOKUP, find: '.select("content, reference")', add: '.select("content, reference, metadata")' },
  { file: LOOKUP, find: '      content_type: "hymn",\n      title: data.reference,\n      body_text: data.content,\n      reference: data.reference,\n      language: null,\n',
    add: '      content_type: "hymn",\n      title: data.reference,\n      body_text: hymnText.text,\n      reference: data.reference,\n      language: hymnText.label,\n' },
  { file: LOOKUP, find: '    return NextResponse.json({\n      content_type: "hymn",',
    add: '    // Yoruba / English / both. Rows without separate fields are split only when they clearly hold two blocks.\n' +
      '    const meta = (data.metadata ?? {}) as { yoruba?: string; english?: string };\n    let yo = typeof meta.yoruba === "string" ? meta.yoruba : null;\n    let en = typeof meta.english === "string" ? meta.english : null;\n' +
      '    if (!yo || !en) {\n      const parts = String(data.content).trim().split(/\\n\\s*\\n/);\n      if (parts.length === 2) {\n        yo = parts[0].trim();\n        en = parts[1].trim();\n      }\n    }\n' +
      '    const choice = body.language === "yoruba" || body.language === "english" ? body.language : "both";\n    const hymnText: { text: string; label: string | null } = { text: data.content, label: null };\n' +
      '    if (yo && en) {\n      if (choice === "yoruba") {\n        hymnText.text = yo;\n        hymnText.label = "Yorùbá";\n      } else if (choice === "english") {\n        hymnText.text = en;\n        hymnText.label = "English";\n      } else {\n        hymnText.text = `${yo}\\n\\n${en}`;\n      }\n    }\n\n    return NextResponse.json({\n      content_type: "hymn",' },
];
const files = {};
for (const f of new Set(edits.map((e) => e.file))) {
  if (!existsSync(f)) { console.error(`Not found: ${f}. Run this from the repo root. Nothing changed.`); process.exit(1); }
  const raw = readFileSync(f, 'utf8'); files[f] = { raw, crlf: raw.includes('\r\n'), text: raw.replace(/\r\n/g, '\n') };
}
// the lookup edits must be applied in order: the 2nd 'find' text still exists after the 3rd edit's text is inserted, so check on the originals first
for (const e of edits) {
  const n = files[e.file].text.split(e.find).length - 1;
  if (n !== 1) { console.error(`Cannot patch ${e.file}: expected text found ${n} times (needs exactly 1):\n---\n${e.find.slice(0, 120)}\n---\nYour file differs from the one I was given. NOTHING was changed.`); process.exit(1); }
}
for (const e of edits) files[e.file].text = files[e.file].text.replace(e.find, () => e.add);
for (const [f, o] of Object.entries(files)) {
  writeFileSync(`${f}.bak-before-language`, o.raw);
  writeFileSync(f, o.crlf ? o.text.replace(/\n/g, '\r\n') : o.text);
  console.log(`patched ${f}${o.crlf ? ' (CRLF kept)' : ''}`);
}
console.log('Done. Originals saved as *.bak-before-language. Next: npm run dev and test /presentation/control.');
