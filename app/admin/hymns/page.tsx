"use client";

import { useState } from "react";
import Link from "next/link";

interface HymnHistoryEntry {
  id: number;
  hymn_number: number;
  admin_user_id: string | null;
  admin_email: string | null;
  changed_fields: string[];
  old_yoruba: string | null;
  new_yoruba: string | null;
  old_english: string | null;
  new_english: string | null;
  edited_at: string;
}

function splitHymnContent(content: string) {
  const separator = content.indexOf("\n\n");

  if (separator === -1) {
    return {
      yoruba: content,
      english: "",
    };
  }

  return {
    yoruba: content.slice(0, separator),
    english: content.slice(separator + 2),
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function shortChange(oldValue: string | null, newValue: string | null) {
  if (oldValue === null || newValue === null) {
    return "Previous audit entry — detailed before/after text was not recorded.";
  }

  const oldLines = oldValue.split("\n");
  const newLines = newValue.split("\n");

  let firstDifference = -1;

  const max = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < max; i++) {
    if (oldLines[i] !== newLines[i]) {
      firstDifference = i;
      break;
    }
  }

  if (firstDifference === -1) {
    return "Text changed, but no line-level difference was detected.";
  }

  const before = oldLines[firstDifference] ?? "";
  const after = newLines[firstDifference] ?? "";

  return `"${before}" → "${after}"`;
}

export default function HymnEditorPage() {
  const [number, setNumber] = useState("");
  const [loadedNumber, setLoadedNumber] = useState<number | null>(null);

  const [yoruba, setYoruba] = useState("");
  const [english, setEnglish] = useState("");

  const [history, setHistory] = useState<HymnHistoryEntry[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadHymn() {
    setMessage("");
    setError("");

    const hymnNumber = Number.parseInt(number, 10);

    if (!Number.isInteger(hymnNumber) || hymnNumber < 1) {
      setError("Enter a valid hymn number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`/api/admin/hymns/${hymnNumber}`, {
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to load hymn.");
      }

      const parts = splitHymnContent(data.content);

      setLoadedNumber(data.hymn_number);
      setYoruba(parts.yoruba);
      setEnglish(parts.english);
      setHistory(data.history ?? []);
      setMessage(`Hymn ${data.hymn_number} loaded.`);
    } catch (err) {
      setLoadedNumber(null);
      setYoruba("");
      setEnglish("");
      setHistory([]);

      setError(
        err instanceof Error ? err.message : "Unable to load hymn."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveHymn() {
    if (!loadedNumber) {
      setError("Load a hymn before saving.");
      return;
    }

    setMessage("");
    setError("");

    if (!yoruba.trim() || !english.trim()) {
      setError("Both Yoruba and English text are required.");
      return;
    }

    const content = `${yoruba}\n\n${english}`;

    setSaving(true);

    try {
      const res = await fetch(`/api/admin/hymns/${loadedNumber}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unable to save hymn.");
      }

      if (data.warning) {
        setMessage(data.warning);
      } else if (data.changed === false) {
        setMessage("No changes detected.");
      } else {
        setMessage(`Hymn ${loadedNumber} saved successfully.`);
      }

      if (data.changed) {
        await loadHymn();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save hymn."
      );
    } finally {
      setSaving(false);
    }
  }

  const lastEdit = history[0] ?? null;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-medium text-navy-light hover:underline"
            >
              ← Back to Admin Dashboard
            </Link>

            <h1 className="mt-3 font-serif text-3xl font-bold text-navy">
              Hymn Editor
            </h1>

            <p className="mt-1 text-sm text-navy-light/70">
              Correct hymn text while preserving the original structure,
              repetitions, punctuation and line breaks.
            </p>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label
                htmlFor="hymn-number"
                className="mb-2 block text-sm font-semibold text-navy"
              >
                Hymn Number
              </label>

              <input
                id="hymn-number"
                type="number"
                min="1"
                max="9999"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadHymn();
                  }
                }}
                placeholder="e.g. 4"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>

            <button
              type="button"
              onClick={loadHymn}
              disabled={loading}
              className="rounded-xl bg-navy px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load Hymn"}
            </button>
          </div>

          {loadedNumber && (
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="font-serif text-xl font-bold text-navy">
                    Hymn {loadedNumber} — Edit Information
                  </h2>

                  <p className="mt-1 text-sm text-navy-light/70">
                    This information comes from the hymn's audit history.
                  </p>
                </div>

                <div className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-sm">
                  {history.length}{" "}
                  {history.length === 1 ? "edit" : "edits"} recorded
                </div>
              </div>

              {lastEdit ? (
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-navy-light/60">
                      Last edited
                    </div>
                    <div className="mt-1 text-sm font-medium text-gray-900">
                      {formatDate(lastEdit.edited_at)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-navy-light/60">
                      Edited by
                    </div>
                    <div className="mt-1 break-all text-sm font-medium text-gray-900">
                      {lastEdit.admin_email || "Unknown administrator"}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-navy-light/60">
                      Language changed
                    </div>
                    <div className="mt-1 text-sm font-medium capitalize text-gray-900">
                      {lastEdit.changed_fields.join(" + ")}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  <strong>No previous corrections recorded.</strong>
                  <br />
                  This hymn has no edit history yet.
                </div>
              )}

              {history.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-serif text-lg font-bold text-navy">
                    Edit History
                  </h3>

                  <div className="mt-3 space-y-3">
                    {history.map((entry) => (
                      <details
                        key={entry.id}
                        className="group rounded-xl border border-gray-200 bg-white"
                      >
                        <summary className="cursor-pointer list-none px-4 py-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <span className="font-semibold text-navy">
                                {formatDate(entry.edited_at)}
                              </span>

                              <span className="ml-2 text-sm text-navy-light/70">
                                by {entry.admin_email || "Unknown administrator"}
                              </span>
                            </div>

                            <div className="text-sm font-semibold capitalize text-navy">
                              {entry.changed_fields.join(" + ")}
                            </div>
                          </div>
                        </summary>

                        <div className="border-t border-gray-100 px-4 py-4">
                          {entry.changed_fields.includes("yoruba") && (
                            <div className="mb-5">
                              <h4 className="mb-2 font-semibold text-navy">
                                Yoruba
                              </h4>

                              {entry.old_yoruba !== null &&
                              entry.new_yoruba !== null ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="rounded-xl bg-red-50 p-4">
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
                                      Before
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-800">
                                      {entry.old_yoruba}
                                    </pre>
                                  </div>

                                  <div className="rounded-xl bg-green-50 p-4">
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
                                      After
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-800">
                                      {entry.new_yoruba}
                                    </pre>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-navy-light/70">
                                  Detailed before/after text was not recorded
                                  for this older edit.
                                </p>
                              )}
                            </div>
                          )}

                          {entry.changed_fields.includes("english") && (
                            <div>
                              <h4 className="mb-2 font-semibold text-navy">
                                English
                              </h4>

                              {entry.old_english !== null &&
                              entry.new_english !== null ? (
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="rounded-xl bg-red-50 p-4">
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-red-700">
                                      Before
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-800">
                                      {entry.old_english}
                                    </pre>
                                  </div>

                                  <div className="rounded-xl bg-green-50 p-4">
                                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-green-700">
                                      After
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-gray-800">
                                      {entry.new_english}
                                    </pre>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-navy-light/70">
                                  Detailed before/after text was not recorded
                                  for this older edit.
                                </p>
                              )}

                              {entry.old_english !== null &&
                                entry.new_english !== null && (
                                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-navy-light">
                                    {shortChange(
                                      entry.old_english,
                                      entry.new_english
                                    )}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </section>

        {loadedNumber && (
          <section className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label
                htmlFor="yoruba-text"
                className="mb-3 block font-serif text-xl font-bold text-navy"
              >
                Yoruba
              </label>

              <p className="mb-3 text-xs text-navy-light/60">
                Preserve the source exactly where possible. Line breaks,
                repetitions and punctuation are retained.
              </p>

              <textarea
                id="yoruba-text"
                value={yoruba}
                onChange={(e) => setYoruba(e.target.value)}
                spellCheck={false}
                className="min-h-[520px] w-full resize-y rounded-xl border border-gray-300 bg-white p-4 font-mono text-sm leading-7 text-gray-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <label
                htmlFor="english-text"
                className="mb-3 block font-serif text-xl font-bold text-navy"
              >
                English
              </label>

              <p className="mb-3 text-xs text-navy-light/60">
                Correct only what you intend to correct. The saved text is
                re-embedded automatically.
              </p>

              <textarea
                id="english-text"
                value={english}
                onChange={(e) => setEnglish(e.target.value)}
                spellCheck={false}
                className="min-h-[520px] w-full resize-y rounded-xl border border-gray-300 bg-white p-4 font-mono text-sm leading-7 text-gray-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/10"
              />
            </div>

            <div className="lg:col-span-2 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-amber-900">
                <strong>Before saving:</strong> check the Yoruba and English
                text carefully. Saving changes the live hymn used by the
                presentation and Nehemiah.
              </div>

              <button
                type="button"
                onClick={saveHymn}
                disabled={saving}
                className="shrink-0 rounded-xl bg-navy px-7 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving & Re-embedding..." : "Save Changes"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
