"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface DayRow {
  day: string;
  views: number;
  visitors: number;
  new_visitors: number;
  mobile_views: number;
}

interface SectionRow {
  section: string;
  views: number;
  visitors: number;
}

interface Bucket {
  key: string;
  label: string;
  views: number;
  visitors: number;
}

type Mode = "day" | "week" | "month";

const NAVY = "#14284b";
const GOLD = "#c9a227";

const MODES: { id: Mode; label: string; count: number; fetchDays: number; heading: string }[] = [
  { id: "day", label: "Daily", count: 30, fetchDays: 35, heading: "Last 30 days" },
  { id: "week", label: "Weekly", count: 12, fetchDays: 91, heading: "Last 12 weeks" },
  { id: "month", label: "Monthly", count: 12, fetchDays: 400, heading: "Last 12 months" },
];

const SECTION_NAMES: Record<string, string> = {
  "/": "Home page",
  "/live": "Live",
  "/history": "History",
  "/events": "Events",
  "/announcements": "Announcements",
  "/mother-celestial": "Mother Celestial",
  "/contact": "Contact",
  "/sermons": "Sermons",
  "/posts": "Daily word",
  "/lessons": "Lessons",
  "/nehemiah": "Nehemiah",
  "/live-stream": "Live stream",
  "/other": "Other pages",
};

const toDate = (s: string) => new Date(`${s}T00:00:00Z`);
const fmt = (d: Date) => d.toISOString().slice(0, 10);
const todayLagos = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Lagos" });

function addDays(s: string, n: number): string {
  const d = toDate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}

function weekStart(s: string): string {
  const d = toDate(s);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return fmt(d);
}

function shortDate(s: string, opts: Intl.DateTimeFormatOptions) {
  return toDate(s).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
}

function bucketize(rows: DayRow[], mode: Mode, count: number, today: string): Bucket[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const buckets: Bucket[] = [];

  if (mode === "day") {
    for (let i = count - 1; i >= 0; i--) {
      const day = addDays(today, -i);
      const r = byDay.get(day);
      buckets.push({ key: day, label: shortDate(day, { day: "numeric", month: "short" }), views: r?.views ?? 0, visitors: r?.visitors ?? 0 });
    }
    return buckets;
  }

  const index = new Map<string, Bucket>();

  if (mode === "week") {
    const current = weekStart(today);
    for (let i = count - 1; i >= 0; i--) {
      const key = addDays(current, -7 * i);
      const b = { key, label: shortDate(key, { day: "numeric", month: "short" }), views: 0, visitors: 0 };
      index.set(key, b);
      buckets.push(b);
    }
    for (const r of rows) {
      const b = index.get(weekStart(r.day));
      if (b) {
        b.views += r.views;
        b.visitors += r.visitors;
      }
    }
    return buckets;
  }

  const [ty, tm] = today.split("-").map(Number);
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ty, tm - 1 - i, 1));
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    const b = { key, label: d.toLocaleDateString("en-GB", { timeZone: "UTC", month: "short", year: "2-digit" }), views: 0, visitors: 0 };
    index.set(key, b);
    buckets.push(b);
  }
  for (const r of rows) {
    const b = index.get(r.day.slice(0, 7));
    if (b) {
      b.views += r.views;
      b.visitors += r.visitors;
    }
  }
  return buckets;
}

function niceMax(value: number): number {
  if (value <= 5) return 5;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const step = [1, 2, 2.5, 5, 10].find((m) => m * pow >= value) ?? 10;
  return step * pow;
}

function Chart({ buckets }: { buckets: Bucket[] }) {
  const W = 800;
  const H = 280;
  const pad = { left: 44, right: 12, top: 16, bottom: 36 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = niceMax(Math.max(1, ...buckets.map((b) => Math.max(b.views, b.visitors))));
  const slot = innerW / Math.max(buckets.length, 1);
  const barW = Math.max(4, slot * 0.55);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const every = Math.ceil(buckets.length / 10);

  const line = buckets.map((b, i) => `${pad.left + slot * i + slot / 2},${y(b.views)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Visitors and page views">
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={W - pad.right} y1={y(max * t)} y2={y(max * t)} stroke="#e5e7eb" />
          <text x={pad.left - 6} y={y(max * t) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
            {Math.round(max * t)}
          </text>
        </g>
      ))}
      {buckets.map((b, i) => (
        <g key={b.key}>
          <rect x={pad.left + slot * i + (slot - barW) / 2} y={y(b.visitors)} width={barW} height={Math.max(0, pad.top + innerH - y(b.visitors))} rx={3} fill={NAVY}>
            <title>{`${b.label}: ${b.visitors} visitors, ${b.views} page views`}</title>
          </rect>
          {i % every === 0 && (
            <text x={pad.left + slot * i + slot / 2} y={H - 12} textAnchor="middle" fontSize="11" fill="#6b7280">
              {b.label}
            </text>
          )}
        </g>
      ))}
      <polyline points={line} fill="none" stroke={GOLD} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
      {buckets.map((b, i) => (
        <circle key={`${b.key}-dot`} cx={pad.left + slot * i + slot / 2} cy={y(b.views)} r={3.5} fill={GOLD}>
          <title>{`${b.label}: ${b.views} page views`}</title>
        </circle>
      ))}
    </svg>
  );
}

function Donut({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e5e7eb" strokeWidth="16" />
        {total > 0 &&
          parts.map((p) => {
            const len = (p.value / total) * c;
            const el = (
              <circle
                key={p.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={p.color}
                strokeWidth="16"
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 60 60)"
              />
            );
            offset += len;
            return el;
          })}
      </svg>
      <ul className="space-y-1 text-sm">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2 text-navy">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: p.color }} />
            {p.label}: <strong>{p.value.toLocaleString()}</strong>
            {total > 0 && <span className="text-navy-light/60">({Math.round((p.value / total) * 100)}%)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatCard({ title, visitors, views }: { title: string; visitors: number; views: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-light/70">{title}</p>
      <p className="mt-2 font-serif text-3xl font-bold text-navy">{visitors.toLocaleString()}</p>
      <p className="text-sm text-navy-light/70">visitors &middot; {views.toLocaleString()} page views</p>
    </div>
  );
}

export default function VisitorReportPage() {
  const [mode, setMode] = useState<Mode>("day");
  const [daily, setDaily] = useState<DayRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const config = MODES.find((m) => m.id === mode) ?? MODES[0];

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetch(`/api/admin/visitors?days=${config.fetchDays}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not load the report.");
        if (active) {
          setDaily(data.daily ?? []);
          setSections(data.sections ?? []);
        }
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "Could not load the report."))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [config.fetchDays]);

  const today = todayLagos();
  const buckets = useMemo(() => bucketize(daily, mode, config.count, today), [daily, mode, config.count, today]);

  const totals = useMemo(() => {
    const sum = (from: string) =>
      daily.filter((r) => r.day >= from).reduce((acc, r) => ({ visitors: acc.visitors + r.visitors, views: acc.views + r.views }), { visitors: 0, views: 0 });
    const todayRow = daily.find((r) => r.day === today);
    return {
      today: { visitors: todayRow?.visitors ?? 0, views: todayRow?.views ?? 0 },
      week: sum(addDays(today, -6)),
      month: sum(addDays(today, -29)),
      thisMonth: sum(`${today.slice(0, 7)}-01`),
    };
  }, [daily, today]);

  const period = useMemo(() => {
    const first = buckets[0]?.key ?? today;
    const from = mode === "month" ? `${first}-01` : first;
    const rows = daily.filter((r) => r.day >= from);
    return rows.reduce(
      (acc, r) => ({
        newVisitors: acc.newVisitors + r.new_visitors,
        visitors: acc.visitors + r.visitors,
        mobile: acc.mobile + r.mobile_views,
        views: acc.views + r.views,
      }),
      { newVisitors: 0, visitors: 0, mobile: 0, views: 0 }
    );
  }, [daily, buckets, mode, today]);

  const best = buckets.reduce<Bucket | null>((top, b) => (!top || b.visitors > top.visitors ? b : top), null);
  const maxSection = Math.max(1, ...sections.map((s) => s.views));
  const empty = !loading && !error && daily.length === 0;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <Link href="/admin" className="text-sm font-medium text-navy-light hover:underline">
            ← Back to Admin Dashboard
          </Link>
          <h1 className="mt-3 font-serif text-3xl font-bold text-navy">Visitor Report</h1>
          <p className="mt-1 text-sm text-navy-light/70">
            How many people visit the church website. Totals only: no names, no addresses, no tracking of individuals. Admin and projector pages are not counted.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {empty && (
          <div className="rounded-2xl border border-gold/50 bg-white p-6 text-sm text-navy">
            No visits have been recorded yet. Counting starts as soon as people open the public pages after this update is live. Come back tomorrow for the first chart.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Today" visitors={totals.today.visitors} views={totals.today.views} />
          <StatCard title="Last 7 days" visitors={totals.week.visitors} views={totals.week.views} />
          <StatCard title="Last 30 days" visitors={totals.month.visitors} views={totals.month.views} />
          <StatCard title="This month" visitors={totals.thisMonth.visitors} views={totals.thisMonth.views} />
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy">{config.heading}</h2>
              <p className="text-xs text-navy-light/60">
                <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: NAVY }} /> visitors
                <span className="ml-4 mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: GOLD }} /> page views
              </p>
            </div>
            <div className="flex gap-2">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === m.id ? "bg-navy text-gold" : "border border-navy/20 bg-white text-navy"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">{loading ? <p className="py-16 text-center text-sm text-navy-light/60">Loading...</p> : <Chart buckets={buckets} />}</div>

          {best && best.visitors > 0 && (
            <p className="mt-3 text-sm text-navy-light/70">
              Busiest {mode === "day" ? "day" : mode === "week" ? "week (starting)" : "month"}: <strong className="text-navy">{best.label}</strong> with {best.visitors.toLocaleString()} visitors.
            </p>
          )}
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-xl font-bold text-navy">Most visited pages</h2>
            <p className="text-xs text-navy-light/60">{config.heading}, by page views</p>
            <ul className="mt-4 space-y-3">
              {sections.length === 0 && <li className="text-sm text-navy-light/60">Nothing yet.</li>}
              {sections.slice(0, 8).map((s) => (
                <li key={s.section}>
                  <div className="flex justify-between text-sm text-navy">
                    <span>{SECTION_NAMES[s.section] ?? s.section}</span>
                    <span className="font-semibold">{s.views.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{ width: `${(s.views / maxSection) * 100}%`, backgroundColor: NAVY }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-navy">New and returning</h2>
              <p className="mb-4 text-xs text-navy-light/60">Visitors in this period</p>
              <Donut
                parts={[
                  { label: "First-time", value: period.newVisitors, color: GOLD },
                  { label: "Returning", value: Math.max(0, period.visitors - period.newVisitors), color: NAVY },
                ]}
              />
            </section>
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-xl font-bold text-navy">Phone and computer</h2>
              <p className="mb-4 text-xs text-navy-light/60">Page views in this period</p>
              <Donut
                parts={[
                  { label: "Phone", value: period.mobile, color: GOLD },
                  { label: "Computer or tablet", value: Math.max(0, period.views - period.mobile), color: NAVY },
                ]}
              />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
