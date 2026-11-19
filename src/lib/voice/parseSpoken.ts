// Turns what the preacher says into a screen command. Pure functions, no browser needed.

export type SpokenCommand =
  | { type: "verse"; book: string; chapter: string; verseStart: string; verseEnd: string; language?: "english" | "yoruba"; label: string }
  | { type: "hymn"; number: string; language?: "english" | "yoruba"; label: string }
  | { type: "next" | "previous" | "blank" | "pause" | "resume"; label: string }
  | { type: "goto"; verse: number; label: string }
  | { type: "announcement"; label: string }
  | { type: "define"; term: string; language?: "english" | "yoruba" | "both"; label: string }
  | { type: "scroll"; where: "down" | "up" | "top" | "bottom"; amount: "small" | "normal" | "large"; label: string }
  | { type: "language"; language: "english" | "yoruba"; label: string };

const BOOKS: { name: string; aliases: string[] }[] = [
  { name: "Genesis", aliases: ["genesis"] },
  { name: "Exodus", aliases: ["exodus"] },
  { name: "Leviticus", aliases: ["leviticus"] },
  { name: "Numbers", aliases: ["numbers"] },
  { name: "Deuteronomy", aliases: ["deuteronomy"] },
  { name: "Joshua", aliases: ["joshua"] },
  { name: "Judges", aliases: ["judges"] },
  { name: "Ruth", aliases: ["ruth"] },
  { name: "1 Samuel", aliases: ["1 samuel", "1 sam"] },
  { name: "2 Samuel", aliases: ["2 samuel", "2 sam"] },
  { name: "1 Kings", aliases: ["1 kings"] },
  { name: "2 Kings", aliases: ["2 kings"] },
  { name: "1 Chronicles", aliases: ["1 chronicles"] },
  { name: "2 Chronicles", aliases: ["2 chronicles"] },
  { name: "Ezra", aliases: ["ezra"] },
  { name: "Nehemiah", aliases: ["nehemiah"] },
  { name: "Esther", aliases: ["esther"] },
  { name: "Job", aliases: ["job"] },
  // "psalm" is often heard as "sam", "salm" and similar.
  { name: "Psalm", aliases: ["psalm", "psalms", "sam", "salm", "sarm", "psalam", "saam", "psam", "psalmn", "sulm", "saum"] },
  { name: "Proverbs", aliases: ["proverbs", "proverb"] },
  { name: "Ecclesiastes", aliases: ["ecclesiastes"] },
  { name: "Song of Solomon", aliases: ["song of solomon", "song of songs", "songs of solomon"] },
  { name: "Isaiah", aliases: ["isaiah"] },
  { name: "Jeremiah", aliases: ["jeremiah"] },
  { name: "Lamentations", aliases: ["lamentations"] },
  { name: "Ezekiel", aliases: ["ezekiel"] },
  { name: "Daniel", aliases: ["daniel"] },
  { name: "Hosea", aliases: ["hosea"] },
  { name: "Joel", aliases: ["joel"] },
  { name: "Amos", aliases: ["amos"] },
  { name: "Obadiah", aliases: ["obadiah"] },
  { name: "Jonah", aliases: ["jonah"] },
  { name: "Micah", aliases: ["micah"] },
  { name: "Nahum", aliases: ["nahum"] },
  { name: "Habakkuk", aliases: ["habakkuk"] },
  { name: "Zephaniah", aliases: ["zephaniah"] },
  { name: "Haggai", aliases: ["haggai"] },
  { name: "Zechariah", aliases: ["zechariah"] },
  { name: "Malachi", aliases: ["malachi"] },
  { name: "Matthew", aliases: ["matthew"] },
  { name: "Mark", aliases: ["mark"] },
  { name: "Luke", aliases: ["luke"] },
  { name: "John", aliases: ["john"] },
  { name: "Acts", aliases: ["acts", "acts of the apostles"] },
  { name: "Romans", aliases: ["romans"] },
  { name: "1 Corinthians", aliases: ["1 corinthians"] },
  { name: "2 Corinthians", aliases: ["2 corinthians"] },
  { name: "Galatians", aliases: ["galatians"] },
  { name: "Ephesians", aliases: ["ephesians"] },
  { name: "Philippians", aliases: ["philippians"] },
  { name: "Colossians", aliases: ["colossians"] },
  { name: "1 Thessalonians", aliases: ["1 thessalonians"] },
  { name: "2 Thessalonians", aliases: ["2 thessalonians"] },
  { name: "1 Timothy", aliases: ["1 timothy"] },
  { name: "2 Timothy", aliases: ["2 timothy"] },
  { name: "Titus", aliases: ["titus"] },
  { name: "Philemon", aliases: ["philemon"] },
  { name: "Hebrews", aliases: ["hebrews"] },
  { name: "James", aliases: ["james"] },
  { name: "1 Peter", aliases: ["1 peter"] },
  { name: "2 Peter", aliases: ["2 peter"] },
  { name: "1 John", aliases: ["1 john"] },
  { name: "2 John", aliases: ["2 john"] },
  { name: "3 John", aliases: ["3 john"] },
  { name: "Jude", aliases: ["jude"] },
  { name: "Revelation", aliases: ["revelation", "revelations"] },
];

// Yoruba Bible book names, written without accents (the reader strips accents from what it hears).
const YORUBA_BOOKS: { name: string; aliases: string[] }[] = [
  { name: "Genesis", aliases: ["jenesisi"] },
  { name: "Exodus", aliases: ["ekisodu"] },
  { name: "Leviticus", aliases: ["lefitiku"] },
  { name: "Numbers", aliases: ["numeri"] },
  { name: "Deuteronomy", aliases: ["diutaronomi"] },
  { name: "Joshua", aliases: ["josua", "joshua"] },
  { name: "Judges", aliases: ["onidajo"] },
  { name: "Ruth", aliases: ["ruutu"] },
  { name: "1 Samuel", aliases: ["1 samuel"] },
  { name: "2 Samuel", aliases: ["2 samuel"] },
  { name: "1 Kings", aliases: ["1 oba"] },
  { name: "2 Kings", aliases: ["2 oba"] },
  { name: "1 Chronicles", aliases: ["1 kironika"] },
  { name: "2 Chronicles", aliases: ["2 kironika"] },
  { name: "Ezra", aliases: ["esira"] },
  { name: "Nehemiah", aliases: ["nehemaya"] },
  { name: "Esther", aliases: ["esiteri"] },
  { name: "Job", aliases: ["joobu"] },
  { name: "Psalm", aliases: ["orin dafidi"] },
  { name: "Proverbs", aliases: ["owe"] },
  { name: "Ecclesiastes", aliases: ["oniwaasu"] },
  { name: "Song of Solomon", aliases: ["orin solomoni"] },
  { name: "Isaiah", aliases: ["aisaya"] },
  { name: "Jeremiah", aliases: ["jeremaya"] },
  { name: "Lamentations", aliases: ["ekun jeremaya"] },
  { name: "Ezekiel", aliases: ["isikieli"] },
  { name: "Daniel", aliases: ["danieli"] },
  { name: "Hosea", aliases: ["hosea"] },
  { name: "Joel", aliases: ["joeli"] },
  { name: "Amos", aliases: ["amosi"] },
  { name: "Obadiah", aliases: ["obadaya"] },
  { name: "Jonah", aliases: ["jona"] },
  { name: "Micah", aliases: ["mika"] },
  { name: "Nahum", aliases: ["nahumu"] },
  { name: "Habakkuk", aliases: ["habakuku"] },
  { name: "Zephaniah", aliases: ["sefanaya"] },
  { name: "Haggai", aliases: ["hagai"] },
  { name: "Zechariah", aliases: ["sekaraya"] },
  { name: "Malachi", aliases: ["malaki"] },
  { name: "Matthew", aliases: ["matiu", "mattiu", "matio"] },
  { name: "Mark", aliases: ["maaku", "maku", "maaku"] },
  { name: "Luke", aliases: ["luuku", "luku", "luuku"] },
  { name: "John", aliases: ["johanu", "yohanu", "johannu", "johanna"] },
  { name: "Acts", aliases: ["ise awon aposteli", "ise awon aposteli"] },
  { name: "Romans", aliases: ["roomu"] },
  { name: "1 Corinthians", aliases: ["1 korinti"] },
  { name: "2 Corinthians", aliases: ["2 korinti"] },
  { name: "Galatians", aliases: ["galatia"] },
  { name: "Ephesians", aliases: ["efesu"] },
  { name: "Philippians", aliases: ["filipi"] },
  { name: "Colossians", aliases: ["kolose"] },
  { name: "1 Thessalonians", aliases: ["1 tesalonika"] },
  { name: "2 Thessalonians", aliases: ["2 tesalonika"] },
  { name: "1 Timothy", aliases: ["1 timoti"] },
  { name: "2 Timothy", aliases: ["2 timoti"] },
  { name: "Titus", aliases: ["titu"] },
  { name: "Philemon", aliases: ["filemoni"] },
  { name: "Hebrews", aliases: ["heberu"] },
  { name: "James", aliases: ["jakobu"] },
  { name: "1 Peter", aliases: ["1 peteru"] },
  { name: "2 Peter", aliases: ["2 peteru"] },
  { name: "1 John", aliases: ["1 johanu"] },
  { name: "2 John", aliases: ["2 johanu"] },
  { name: "3 John", aliases: ["3 johanu"] },
  { name: "Jude", aliases: ["juuda"] },
  { name: "Revelation", aliases: ["ifihan"] },
];

type Lang = "english" | "yoruba";

// Ordinary English words that "psalm" is sometimes heard as: only counted in a short command or after "turn to", "read", "open"...
const WEAK_BOOKS: { name: string; aliases: string[] }[] = [{ name: "Psalm", aliases: ["some", "palm", "same"] }];
const BOOK_LEADS = new Set(["go", "turn", "open", "read", "let", "lets", "show", "take", "bring", "now", "please", "to"]);

const ALIASES = ([
  ...BOOKS.flatMap((b) => b.aliases.map((alias) => ({ alias, tokens: alias.split(" "), name: b.name, lang: "english" as Lang }))),
  ...YORUBA_BOOKS.flatMap((b) => b.aliases.map((alias) => ({ alias, tokens: alias.split(" "), name: b.name, lang: "yoruba" as Lang }))),
  ...WEAK_BOOKS.flatMap((b) => b.aliases.map((alias) => ({ alias, tokens: alias.split(" "), name: b.name, lang: "english" as Lang, weak: true }))),
] as { alias: string; tokens: string[]; name: string; lang: Lang; weak?: boolean }[]).sort((a, b) => b.tokens.length - a.tokens.length);

// Yoruba number words 1-20, accents removed. (Larger numbers are normally written as digits by the recogniser.)
const YORUBA_NUMBERS: Record<string, string> = {
  okan: "1", eji: "2", eta: "3", erin: "4", arun: "5", efa: "6", eje: "7", ejo: "8", esan: "9", ewa: "10",
  okanla: "11", ejila: "12", etala: "13", erinla: "14", edogun: "15", erindilogun: "16", etadilogun: "17",
  eejidilogun: "18", okandilogun: "19", ogun: "20",
};

const UNITS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const ORDINALS: Record<string, string> = { first: "1", "1st": "1", second: "2", "2nd": "2", third: "3", "3rd": "3" };

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

// "twenty one" -> 21, "one hundred and nineteen" -> 119, "three sixteen" -> 3 and 16 (two numbers).
export function wordsToDigits(tokens: string[]): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < tokens.length) {
    const t = tokens[i];
    const isNumberWord = t in UNITS || t in TENS || t === "hundred";

    if (!isNumberWord) {
      out.push(t);
      i++;
      continue;
    }

    let current: number | null = null;

    while (i < tokens.length) {
      const w = tokens[i];

      if (w === "and" && current !== null && current % 100 === 0 && (tokens[i + 1] in UNITS || tokens[i + 1] in TENS)) {
        i++;
        continue;
      }

      if (w === "hundred") {
        if (current === null) current = 100;
        else if (current >= 1 && current <= 9) current *= 100;
        else break;
      } else if (w in UNITS) {
        const v = UNITS[w];
        if (current === null) current = v;
        else if (current % 100 === 0 && current > 0 && v < 20) current += v;
        else if (current >= 20 && current % 10 === 0 && v < 10) current += v;
        else break;
      } else if (w in TENS) {
        const v = TENS[w];
        if (current === null) current = v;
        else if (current % 100 === 0 && current > 0) current += v;
        else break;
      } else {
        break;
      }
      i++;
    }

    if (current !== null) out.push(String(current));
  }

  return out;
}

export function tokenize(text: string): string[] {
  const cleaned = text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/(\d+)\s*[:.]\s*(\d+)/g, "$1 verse $2")
    .replace(/(\d+)\s*[-–—]\s*(\d+)/g, "$1 to $2")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];
  return yorubaNumbers(wordsToDigits(cleaned.split(" ").map((w) => ORDINALS[w] ?? w)));
}

// Yoruba number words become digits only right after a chapter, verse or hymn word, so ordinary words are left alone.
function yorubaNumbers(tokens: string[]): string[] {
  const triggers = new Set(["chapter", "ch", "ori", "verse", "verses", "vs", "v", "ese", "hymn", "hymns", "orin", "number", "nomba", "no", "to", "si", "through"]);
  return tokens.map((t, i) => (t in YORUBA_NUMBERS && i > 0 && (triggers.has(tokens[i - 1]) || /^\d+$/.test(tokens[i - 1])) ? YORUBA_NUMBERS[t] : t));
}

function isNum(t: string | undefined): boolean {
  return !!t && /^\d{1,3}$/.test(t);
}

function matchBookAt(tokens: string[], i: number): { name: string; length: number; lang: Lang; weak?: boolean } | null {
  for (const entry of ALIASES) {
    const slice = tokens.slice(i, i + entry.tokens.length);
    if (slice.length < entry.tokens.length) continue;
    const joined = slice.join(" ");
    if (joined === entry.alias) return { name: entry.name, length: entry.tokens.length, lang: entry.lang, weak: entry.weak };
    if (entry.tokens.length === 1 && joined !== "number" && !entry.weak) {
      const longEnough = entry.lang === "yoruba" ? entry.alias.length >= 5 : entry.alias.length >= 7;
      const allowed = entry.alias.length >= 8 ? 2 : 1;
      if (longEnough && Math.abs(joined.length - entry.alias.length) <= allowed && levenshtein(joined, entry.alias) <= allowed) {
        return { name: entry.name, length: 1, lang: entry.lang };
      }
    }
  }
  return null;
}

function findVerseCommand(tokens: string[]): SpokenCommand | null {
  let found: SpokenCommand | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const book = matchBookAt(tokens, i);
    if (!book) continue;
    // "some 23" / "palm 23": only when it is clearly a command, not a sentence that happens to contain "some" and a number.
    if (book.weak && !(tokens.length <= 2 || tokens.slice(Math.max(0, i - 3), i).some((t) => BOOK_LEADS.has(t)))) continue;

    let j = i + book.length;
    while (j < tokens.length && (tokens[j] === "chapter" || tokens[j] === "ch" || tokens[j] === "the" || tokens[j] === "ori")) j++;
    if (!isNum(tokens[j])) continue;

    const chapter = tokens[j];
    j++;

    let verseStart = "";
    let verseEnd = "";
    const sep = new Set(["verse", "verses", "vs", "v", "colon", "ese"]);
    let sawSep = false;
    while (j < tokens.length && sep.has(tokens[j])) {
      sawSep = true;
      j++;
    }

    if (isNum(tokens[j])) {
      verseStart = tokens[j];
      j++;
      if (["to", "through", "thru", "si"].includes(tokens[j]) && isNum(tokens[j + 1])) {
        verseEnd = tokens[j + 1];
      }
    } else if (sawSep) {
      continue;
    }

    const rest = tokens.slice(j);
    // The book name decides the language: said in Yoruba, shown in Yoruba. Saying "Yoruba" or "English" after it overrides.
    const language: Lang = rest.includes("yoruba") ? "yoruba" : rest.includes("english") || rest.includes("kjv") ? "english" : book.lang;
    const label = `${book.name} ${chapter}${verseStart ? ":" + verseStart : ""}${verseEnd ? "-" + verseEnd : ""}`;

    found = { type: "verse", book: book.name, chapter, verseStart, verseEnd, language, label };
    i = j - 1; // carry on after this reference, so "1 John 3" is not re-read as "John 3"
  }

  return found;
}

// "let's see the meaning of happiness", "what does it mean to be happy", "define grace", "what does mercy mean", "itumo ayo".
const DEFINE_LEAD = "(?:(?:let s see|lets see|let us see|show us|show me|show|tell us|tell me|give us|please|okay|ok|now) )*";

function findDefineCommand(tokens: string[]): SpokenCommand | null {
  if (tokens.length < 2 || tokens.length > 12 || tokens.some((t) => /\d/.test(t))) return null;
  let phrase = tokens.join(" ");

  let language: "english" | "yoruba" | "both" | undefined;
  const tail = /\s+in (yoruba|english|both languages|both)$/.exec(phrase);
  if (tail) {
    language = tail[1].startsWith("both") ? "both" : (tail[1] as "english" | "yoruba");
    phrase = phrase.slice(0, tail.index);
  }

  let term: string | null = null;
  let m: RegExpExecArray | null;

  if ((m = new RegExp(`^${DEFINE_LEAD}(?:what is |what s )?(?:the )?(?:meaning|definition)s? of (?:the )?(?:word )?(.+)$`).exec(phrase))) {
    // Without a lead-in ("show us...", "what is...") only a short phrase counts, so a sentence of preaching is not taken as a request.
    const bare = /^(?:the )?(?:meaning|definition)s? of /.test(phrase);
    if (!bare || phrase.split(" ").length <= 5) term = m[1];
  } else if ((m = /^what does it mean to (be )?(.+)$/.exec(phrase))) {
    term = `to ${m[1] ? "be " : ""}${m[2]}`;
  } else if ((m = /^what does (?:the word )?(.+?) mean$/.exec(phrase))) {
    term = m[1];
  } else if ((m = /^define (?:the word )?(.+)$/.exec(phrase))) {
    term = m[1];
  } else if ((m = /^(?:ki ni |what is the )?itumo (?:oro )?(.+)$/.exec(phrase))) {
    term = m[1];
  }

  if (!term) return null;
  term = term.replace(/^(?:a|an|the) /, "").replace(/ (?:please|for us|now)$/, "").trim();
  const count = term.split(" ").length;
  if (count < 1 || count > 5 || /\b(?:is|are|was|were|means|and|but|because|that|this|we|you|i)\b/.test(term)) return null;

  return { type: "define", term, language, label: `Meaning of ${term}` };
}

// "hymn" is often heard as "him" or "hem", so those count too, but only when the rest of the sentence makes a hymn clear.
const HYMN_STRONG = new Set(["hymn", "hymns", "hymnal", "hymnbook", "orin"]);
const HYMN_WEAK = new Set(["him", "hims", "hem", "hymm", "himn", "hymen", "hymnn", "in", "inn", "im", "ham", "hum"]);
// Very common words: only counted in a short command such as "in number 176".
const HYMN_AMBIGUOUS = new Set(["in", "inn", "im", "ham", "hum"]);
const HYMN_FILLER = new Set(["book", "number", "no", "num", "nomba", "numba", "namba", "nomber", "at", "is", "of", "the", "from", "our", "in", "a", "on", "to", "for"]);
// "numbers" with an S is the Bible book, so it is not a number word here.
// "numbers" with an S is the Bible book, so it is not a number word here.
const NUMBER_WORDS = new Set(["number", "no", "num", "nomba", "numba", "namba", "nomber"]);
const HYMN_LEADS = new Set(["go", "turn", "open", "show", "lets", "let", "take", "sing", "bring", "read", "now", "please"]);

function findHymnCommand(tokens: string[]): SpokenCommand | null {
  let found: SpokenCommand | null = null;

  for (let i = 0; i < tokens.length; i++) {
    const strong = HYMN_STRONG.has(tokens[i]);
    const weak = HYMN_WEAK.has(tokens[i]);
    if (!strong && !weak) continue;

    // "hymn number 5", "hymn book number 5", "hymn 5 from our hymn book"
    let j = i + 1;
    let sawNumberWord = false;
    while (j < tokens.length && j < i + 7 && HYMN_FILLER.has(tokens[j])) {
      if (NUMBER_WORDS.has(tokens[j])) sawNumberWord = true;
      j++;
    }
    let number: string | null = /^\d{1,4}$/.test(tokens[j] ?? "") ? tokens[j] : null;
    let end = j + 1;
    // "one seventy six" is heard as 1 and 76: in a hymn command that means 176.
    if (number && /^\d$/.test(number) && /^\d{2}$/.test(tokens[j + 1] ?? "")) {
      number = number + tokens[j + 1];
      end = j + 2;
    }

    // "number 5 in the hymn book"
    let backward = false;
    if (!number) {
      for (let k = i - 1; k >= 0 && i - k <= 6; k--) {
        if (/^\d{1,4}$/.test(tokens[k]) && k > 0 && NUMBER_WORDS.has(tokens[k - 1])) {
          number = tokens[k];
          backward = true;
          break;
        }
      }
    }
    if (!number) continue;

    // "hymn number 176" means the hymn book (the Bible book is always "Numbers", with an S). "him number 176" is how it often sounds.
    if (weak) {
      const lead = tokens.slice(0, i).some((t) => HYMN_LEADS.has(t));
      const ok = HYMN_AMBIGUOUS.has(tokens[i])
        ? ((sawNumberWord || backward) && tokens.length <= 4) || (lead && sawNumberWord)
        : sawNumberWord || backward || lead;
      if (!ok) continue;
    }

    const around = tokens.slice(Math.max(0, i - 6), end + 6);
    const language = around.includes("yoruba") ? "yoruba" : around.includes("english") ? "english" : tokens[i] === "orin" ? "yoruba" : undefined;
    found = { type: "hymn", number, language, label: `Hymn ${number}` };
  }

  return found;
}

const PAUSE = /^(?:(?:please|okay|ok) )?(?:wait|stop|pause|hold on|hold up|hold it|hang on|wait a (?:minute|moment|second)|one (?:moment|second)|just a (?:moment|minute|second)|stop there|stop scrolling|e duro|duro|duro die|duro na)$/;
const RESUME = /^(?:(?:please|okay|ok|you may|now) )?(?:continue|go on|carry on|keep going|proceed|resume|continue reading|go ahead|e tesiwaju|tesiwaju)$/;

// Pause and resume are checked on their own so they can act quickly, even on half-finished speech.
export function parseInstant(text: string): SpokenCommand | null {
  const tokens = tokenize(text);
  if (tokens.length === 0 || tokens.length > 4) return null;
  const phrase = tokens.join(" ");
  if (PAUSE.test(phrase)) return { type: "pause", label: "Pause" };
  if (RESUME.test(phrase)) return { type: "resume", label: "Continue" };
  return null;
}

const LEAD = "(?:(?:let s|lets|let us|please|okay|ok|now) )?";

// "scroll down", "scroll up a little", "scroll to the top". Plain "go down" only counts as a two-word command,
// so ordinary preaching ("go down to Egypt") does not move the screen.
function findScrollCommand(tokens: string[]): SpokenCommand | null {
  if (tokens.length === 0 || tokens.length > 8 || tokens.some((t) => /\d/.test(t))) return null;
  const text = tokens.join(" ");
  const explicit = /\b(scroll|scrolling|page|screen|text)\b/.test(text);
  const twoWord = /^(go|move) (down|up)$/.test(text) || /^(down|up) (a (little|bit)|more)$/.test(text);
  const amount: "small" | "normal" | "large" = /\b(little|bit|slightly|small)\b/.test(text) ? "small" : /\b(more|lot|far|much|big|fully)\b/.test(text) ? "large" : "normal";

  if (explicit && /\b(top|beginning|start)\b/.test(text)) return { type: "scroll", where: "top", amount, label: "Scroll to top" };
  if (explicit && /\b(bottom|end)\b/.test(text)) return { type: "scroll", where: "bottom", amount, label: "Scroll to bottom" };
  if ((explicit || twoWord) && /\bdown\b/.test(text)) return { type: "scroll", where: "down", amount, label: "Scroll down" };
  if ((explicit || twoWord) && /\bup\b/.test(text)) return { type: "scroll", where: "up", amount, label: "Scroll up" };
  return null;
}

function findGotoCommand(tokens: string[]): SpokenCommand | null {
  if (tokens.length === 0 || tokens.length > 9) return null;
  const phrase = tokens.join(" ");

  const verse = new RegExp(`^${LEAD}(?:go |come |turn |get |return )?(?:back )?to (?:the )?(?:verse|ese) (\\d{1,3})$`).exec(phrase);
  if (verse) return { type: "goto", verse: parseInt(verse[1], 10), label: `Verse ${verse[1]}` };

  const start = new RegExp(`^${LEAD}(?:go |come |turn |get |return )?back to (?:the )?(?:beginning|start|top)$`).exec(phrase);
  if (start) return { type: "goto", verse: 1, label: "Verse 1" };

  return null;
}

// "next", "next verse", "go to the next one", "move forward please"; "back", "go back", "previous verse", "last one".
const NAV_GO = "(?:(?:go|move|turn|show|take us|take me|bring|let s|lets|please|okay|ok|now) )*";
const NAV_TAIL = "(?: (?:one|1|verse|verses|slide|stanza|page|line|lines|please|now|again))*";
const NEXT_RE = new RegExp(`^${NAV_GO}(?:to )?(?:the )?(?:next|nex|nest|forward|onward|following)${NAV_TAIL}$`);
const PREVIOUS_RE = new RegExp(`^${NAV_GO}(?:to )?(?:the )?(?:previous|back|last|earlier)${NAV_TAIL}$`);
// "announcement", "show the announcements", "it is time for announcements", "ikede".
const ANNOUNCEMENT_RE = /^(?:(?:show|display|put up|bring up|bring out|let s see|lets see|we will have|now|please|okay|ok|time for|it is time for|let us have|give us) )*(?:the )?(?:church )?(?:announcements?|ikede)(?: please| now)?$/;

// Short stand-alone phrases only, so ordinary preaching ("the next verse says...") does not move the screen.
function findControlCommand(tokens: string[], allowNavigation: boolean): SpokenCommand | null {
  if (tokens.length === 0) return null;
  const text = tokens.join(" ");

  if (tokens.length <= 4) {
    if (PAUSE.test(text)) return { type: "pause", label: "Pause" };
    if (RESUME.test(text)) return { type: "resume", label: "Continue" };
  }

  const scroll = findScrollCommand(tokens);
  if (scroll) return scroll;

  if (!allowNavigation) return null;

  const goto = findGotoCommand(tokens);
  if (goto) return goto;

  if (tokens.length > 6) return null;

  if (NEXT_RE.test(text)) return { type: "next", label: "Next" };
  if (PREVIOUS_RE.test(text)) return { type: "previous", label: "Previous" };
  if (ANNOUNCEMENT_RE.test(text)) return { type: "announcement", label: "Announcement" };
  if (/^(blank|clear|hide|remove) (the )?(screen|slide|display)$/.test(text) || /^blank screen$/.test(text)) return { type: "blank", label: "Blank screen" };
  if (/^(in |show |switch to |read in )?yoruba$/.test(text)) return { type: "language", language: "yoruba", label: "Yoruba" };
  if (/^(in |show |switch to |read in )?english$/.test(text)) return { type: "language", language: "english", label: "English" };
  return null;
}

export function parseSpoken(text: string, options: { navigation: boolean } = { navigation: true }): SpokenCommand | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;

  return findControlCommand(tokens, options.navigation) ?? findDefineCommand(tokens) ?? findHymnCommand(tokens) ?? findVerseCommand(tokens);
}

export const BOOK_NAMES: string[] = BOOKS.map((b) => b.name);

// Turns the AI interpreter's answer into a command, after checking every field. Anything doubtful becomes null.
export function commandFromIntent(raw: any): SpokenCommand | null {
  if (!raw || typeof raw !== "object" || typeof raw.intent !== "string") return null;
  const lang = raw.language === "yoruba" ? "yoruba" : raw.language === "english" ? "english" : undefined;
  const digits = (v: unknown, max: number) => (typeof v === "string" || typeof v === "number") && new RegExp(`^\\d{1,${max}}$`).test(String(v)) ? String(parseInt(String(v), 10)) : "";

  switch (raw.intent) {
    case "hymn": {
      const number = digits(raw.number, 4);
      return number && number !== "0" ? { type: "hymn", number, language: lang, label: `Hymn ${number}` } : null;
    }
    case "verse": {
      const book = BOOK_NAMES.find((b) => b.toLowerCase() === String(raw.book ?? "").toLowerCase());
      const chapter = digits(raw.chapter, 3);
      if (!book || !chapter || chapter === "0") return null;
      const verseStart = digits(raw.verseStart, 3);
      const verseEnd = verseStart ? digits(raw.verseEnd, 3) : "";
      const label = `${book} ${chapter}${verseStart ? ":" + verseStart : ""}${verseEnd ? "-" + verseEnd : ""}`;
      return { type: "verse", book, chapter, verseStart, verseEnd, language: lang ?? "english", label };
    }
    case "goto": {
      const verse = digits(raw.verse, 3);
      return verse && verse !== "0" ? { type: "goto", verse: parseInt(verse, 10), label: `Verse ${verse}` } : null;
    }
    case "scroll": {
      const where = ["down", "up", "top", "bottom"].includes(raw.where) ? raw.where : null;
      const amount = ["small", "normal", "large"].includes(raw.amount) ? raw.amount : "normal";
      return where ? { type: "scroll", where, amount, label: `Scroll ${where}` } : null;
    }
    case "next":
      return { type: "next", label: "Next" };
    case "previous":
      return { type: "previous", label: "Previous" };
    case "blank":
      return { type: "blank", label: "Blank screen" };
    case "announcement":
      return { type: "announcement", label: "Announcement" };
    case "pause":
      return { type: "pause", label: "Pause" };
    case "resume":
      return { type: "resume", label: "Continue" };
    case "define": {
      const term = String(raw.term ?? "").trim().slice(0, 60);
      if (!/^[\p{L}\p{M}' -]{1,60}$/u.test(term)) return null;
      const language = raw.language === "yoruba" ? "yoruba" : raw.language === "both" ? "both" : raw.language === "english" ? "english" : undefined;
      return { type: "define", term, language, label: `Meaning of ${term}` };
    }
    case "language":
      return lang ? { type: "language", language: lang, label: lang === "yoruba" ? "Yoruba" : "English" } : null;
    default:
      return null;
  }
}

// Cheap check before asking the AI: only short sentences that look like they could be a command are worth a request.
export function looksLikeCommand(text: string): boolean {
  const tokens = tokenize(text);
  if (tokens.length === 0 || tokens.length > 16) return false;
  const words = new Set(["announcement", "announcements", "ikede", "meaning", "define", "definition", "mean", "itumo", "hymn", "hymns", "him", "hem", "book", "number", "verse", "verses", "chapter", "scroll", "turn", "open", "show", "bring", "next", "previous", "blank", "clear", "yoruba", "english", "orin", "psalm", "psalms", "ese", "ori", "wait", "continue", "hold", "back"]);
  if (tokens.some((t) => words.has(t))) return true;
  return tokens.some((t) => /^\d{1,4}$/.test(t)) && tokens.length <= 8;
}

// "Psalms", "Jenesisi" and so on -> the standard book name the screen lookup understands. null when it is not a book.
export function canonicalBook(name: string): string | null {
  const tokens = tokenize(name);
  if (tokens.length === 0) return null;
  const match = matchBookAt(tokens, 0);
  return match && match.length === tokens.length ? match.name : null;
}

// Worth asking the quote finder about: a sentence long enough to be a line of a verse or hymn.
export function looksLikeQuote(text: string): boolean {
  const tokens = tokenize(text);
  return tokens.length >= 5 && tokens.length <= 40 && text.length <= 300;
}
