// src/data/prayers.ts
// 🙏 Daily prayer prompts — auto-rotates by day of week

const prayers = {
  Sunday: "Lord, bless our worship; let Your presence be felt as we gather in Jesus’ name. (Acts 2:42)",
  Monday: "Father, give us grace to start the week with joy, not just duty. (Psalm 118:24)",
  Tuesday: "Lord, renew our strength and bring peace to every family in our church. (Isaiah 40:29-31)",
  Wednesday: "May Your Word be a lamp to our feet as we seek You in midweek. (Psalm 119:105)",
  Thursday: "Father, let Your Spirit move afresh — awakening faith, love, and unity. (1 Corinthians 13:13)",
  Friday: "We surrender our week to You; prepare our hearts for a blessed Sunday. (Proverbs 3:5-6)",
  Saturday: "Rest in Your promises, Lord — we trust You with all that lies ahead. (Psalm 62:8)",
};

// Returns today’s prayer
export const getTodayPrayer = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[new Date().getDay()]; // 0=Sun, 1=Mon, ..., 2=Tue...
  return prayers[dayName as keyof typeof prayers] || "Lord, meet us today — guide our steps and words.";
};