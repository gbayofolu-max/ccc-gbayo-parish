"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Settings {
  church_name: string;
  service_time: string;
  address: string;
  phone: string;
  email: string;
  extra_note: string;
  updated_at?: string | null;
  updated_by?: string | null;
}

interface Person {
  id: string;
  email: string;
  role: "admin" | "operator";
  created_at: string;
  last_sign_in_at: string | null;
}

interface Usage {
  db_bytes: number;
  hymn_rows: number;
  documents_rows: number;
}

// The free Supabase plan allows 0.5 GB of database per project.
const DB_LIMIT_BYTES = 512 * 1024 * 1024;

const EMPTY: Settings = {
  church_name: "",
  service_time: "",
  address: "",
  phone: "",
  email: "",
  extra_note: "",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Never";
  return new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-navy focus:border-gold focus:outline-none";
const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wide text-navy-light/70";
const cardClass = "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

export default function ChurchSettingsPage() {
  const [settings, setSettings] = useState<Settings>(EMPTY);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [me, setMe] = useState("");

  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "operator">("operator");
  const [newPassword, setNewPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [peopleMessage, setPeopleMessage] = useState("");
  const [peopleError, setPeopleError] = useState("");

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }),
        fetch("/api/admin/people", { cache: "no-store" }),
      ]);
      const sData = await s.json();
      const pData = await p.json();

      if (!s.ok) throw new Error(sData.error || "Could not load the church details.");
      if (!p.ok) throw new Error(pData.error || "Could not load the team list.");

      setSettings({ ...EMPTY, ...(sData.settings ?? {}) });
      setUsage(sData.usage ?? null);
      setPeople(pData.people ?? []);
      setMe(pData.me ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this page.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setField(field: keyof Settings, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  async function saveSettings() {
    setMessage("");
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save.");
      setMessage("Church details saved.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  async function addPerson() {
    setPeopleMessage("");
    setPeopleError("");

    try {
      const res = await fetch("/api/admin/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole, password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add this person.");
      setPeopleMessage(`${data.email} can now sign in as ${data.role}. Share the password with them privately.`);
      setNewEmail("");
      setNewPassword("");
      await load();
    } catch (err) {
      setPeopleError(err instanceof Error ? err.message : "Could not add this person.");
    }
  }

  async function changeRole(person: Person, role: "admin" | "operator") {
    setPeopleMessage("");
    setPeopleError("");

    try {
      const res = await fetch(`/api/admin/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change the role.");
      setPeopleMessage(`${person.email} is now ${role}.`);
      await load();
    } catch (err) {
      setPeopleError(err instanceof Error ? err.message : "Could not change the role.");
    }
  }

  async function setPassword(person: Person) {
    const password = window.prompt(`New password for ${person.email} (at least 10 characters):`);
    if (!password) return;

    setPeopleMessage("");
    setPeopleError("");

    try {
      const res = await fetch(`/api/admin/people/${person.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not set the password.");
      setPeopleMessage(`New password set for ${person.email}. Share it with them privately.`);
    } catch (err) {
      setPeopleError(err instanceof Error ? err.message : "Could not set the password.");
    }
  }

  async function removePerson(person: Person) {
    if (!window.confirm(`Remove ${person.email}? They will no longer be able to sign in.`)) return;

    setPeopleMessage("");
    setPeopleError("");

    try {
      const res = await fetch(`/api/admin/people/${person.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not remove this person.");
      setPeopleMessage(`${person.email} has been removed.`);
      await load();
    } catch (err) {
      setPeopleError(err instanceof Error ? err.message : "Could not remove this person.");
    }
  }

  const usedPercent = usage ? Math.min(100, Math.round((usage.db_bytes / DB_LIMIT_BYTES) * 100)) : 0;
  const usedMb = usage ? Math.round(usage.db_bytes / (1024 * 1024)) : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <Link href="/admin" className="text-sm font-medium text-navy-light hover:underline">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold text-navy">Church Settings</h1>
          <p className="mt-1 text-sm text-navy-light/70">
            Church details, who can sign in, and how much database space is used. Admins only.
          </p>
        </div>

        <section className={cardClass}>
          <h2 className="font-serif text-xl font-bold text-navy">Church details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Church name</label>
              <input className={inputClass} value={settings.church_name} onChange={(e) => setField("church_name", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Service time</label>
              <input className={inputClass} value={settings.service_time} onChange={(e) => setField("service_time", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={settings.address} onChange={(e) => setField("address", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={settings.phone} onChange={(e) => setField("phone", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} value={settings.email} onChange={(e) => setField("email", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Note for visitors (optional)</label>
              <textarea className={inputClass} rows={3} value={settings.extra_note} onChange={(e) => setField("extra_note", e.target.value)} />
            </div>
          </div>

          {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-gold disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save details"}
            </button>
            {settings.updated_at && (
              <span className="text-xs text-navy-light/60">
                Last saved {formatDate(settings.updated_at)}
                {settings.updated_by ? ` by ${settings.updated_by}` : ""}
              </span>
            )}
          </div>
        </section>

        <section className={cardClass}>
          <h2 className="font-serif text-xl font-bold text-navy">People and access</h2>
          <p className="mt-1 text-sm text-navy-light/70">
            Admins can do everything. Operators can only use the projector controls.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-navy-light/60">
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Last sign-in</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} className="border-b border-gray-100">
                    <td className="py-3 pr-4 text-navy">
                      {person.email}
                      {person.id === me && <span className="ml-2 text-xs text-navy-light/60">(you)</span>}
                    </td>
                    <td className="py-3 pr-4">
                      <select
                        className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
                        value={person.role}
                        disabled={person.id === me}
                        onChange={(e) => changeRole(person, e.target.value as "admin" | "operator")}
                      >
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                      </select>
                    </td>
                    <td className="py-3 pr-4 text-navy-light/70">{formatDate(person.last_sign_in_at)}</td>
                    <td className="py-3">
                      <button onClick={() => setPassword(person)} className="mr-3 text-sm font-medium text-navy hover:underline">
                        Set password
                      </button>
                      {person.id !== me && (
                        <button onClick={() => removePerson(person)} className="text-sm font-medium text-red-600 hover:underline">
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="mt-6 text-sm font-semibold uppercase tracking-wide text-navy">Add a person</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <input className={`${inputClass} sm:col-span-2`} placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <select className={inputClass} value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "operator")}>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            <input className={inputClass} type="text" placeholder="First password (10+ characters)" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <button onClick={addPerson} className="mt-3 rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-navy">
            Add person
          </button>

          {peopleMessage && <p className="mt-4 text-sm text-green-700">{peopleMessage}</p>}
          {peopleError && <p className="mt-4 text-sm text-red-600">{peopleError}</p>}
        </section>

        <section className={cardClass}>
          <h2 className="font-serif text-xl font-bold text-navy">System health</h2>
          {usage ? (
            <>
              <p className="mt-1 text-sm text-navy-light/70">
                Database: {usedMb} MB of 512 MB ({usedPercent}%) &middot; {usage.hymn_rows} hymns &middot;{" "}
                {usage.documents_rows.toLocaleString()} searchable texts
              </p>
              <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={`h-full rounded-full ${usedPercent >= 85 ? "bg-red-500" : usedPercent >= 70 ? "bg-amber-500" : "bg-green-600"}`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
              {usedPercent >= 70 && (
                <p className="mt-3 text-sm text-amber-700">
                  The database is getting full. Tell your developer before adding large documents.
                </p>
              )}
            </>
          ) : (
            <p className="mt-1 text-sm text-navy-light/70">Database size is not available yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
