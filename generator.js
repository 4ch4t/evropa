import fs from "node:fs/promises";
import path from "node:path";

// Приоритеты для сортировки (чтобы Extreme рисовался поверх остального)
const SEVERITY_ORDER = {
  Minor: 1,
  Moderate: 2,
  Severe: 3,
  Extreme: 4
};

// Настройки стилей GR2A (RGBA, alpha 0-255)
const CONFIG = {
  title: "MeteoAlarm Europe Live Warnings",
  refreshMinutes: 1,

  severityStyles: {
    Extreme: {
      fill: "255 0 0 60",      // Ярко-красный
      line: "255 0 0 255",     // Плотный контур
      lineWidth: 2
    },
    Severe: {
      fill: "255 120 0 45",    // Оранжевый
      line: "255 120 0 200",
      lineWidth: 1
    },
    Moderate: {
      fill: "240 200 0 25",    // Мягкий жёлтый (фоновый)
      line: "210 180 0 70",    // Едва заметная рамка
      lineWidth: 1
    },
    Minor: {
      fill: "0 150 255 15",    // Полупрозрачная голубая подсветка
      line: "0 150 255 30",
      lineWidth: 1
    }
  }
};

const FEEDS = [
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-andorra",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-austria",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-belgium",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-bosnia-herzegovina",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-bulgaria",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-croatia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-cyprus",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-czechia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-denmark",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-estonia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-finland",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-france",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-germany",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-greece",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-hungary",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-iceland",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-ireland",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-israel",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-italy",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-latvia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-lithuania",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-luxembourg",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-malta",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-moldova",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-montenegro",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-netherlands",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-norway",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-poland",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-portugal",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-republic-of-north-macedonia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-romania",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-serbia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-slovakia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-slovenia",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-spain",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-sweden",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-switzerland",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-ukraine",
  "https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-united-kingdom"
];

async function main() {
  console.log("1. Fetching MeteoAlarm feeds...");
  const rawWarnings = await fetchAllFeeds();

  console.log("2. Sorting & processing layers...");
  // Сортировка: слабая угроза в начале файла -> критическая угроза в конце файла (чтобы ложилась НАД слабой)
  const sortedWarnings = rawWarnings.sort((a, b) => {
    const weightA = SEVERITY_ORDER[a.severity] || 0;
    const weightB = SEVERITY_ORDER[b.severity] || 0;
    return weightA - weightB;
  });

  const lines = [
    `Title: ${CONFIG.title}`,
    `Refresh: ${CONFIG.refreshMinutes}`,
    ""
  ];

  let totalPolygons = 0;

  console.log("3. Formatting GR2A Placefile...");
  for (const w of sortedWarnings) {
    const style = CONFIG.severityStyles[w.severity] || CONFIG.severityStyles.Moderate;
    const cleanTitle = w.title.replace(/"/g, "'").replace(/\s+/g, " ").trim();

    for (const poly of w.polygons) {
      if (!poly || poly.length < 3) continue;

      // Заливка
      lines.push(`Color: ${style.fill}`);
      lines.push("Polygon:");
      for (const [lat, lon] of poly) {
        lines.push(`  ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }
      lines.push("End:");

      // Контур с текстом для Hover/Click в GR2A
      lines.push(`Color: ${style.line}`);
      lines.push(`Line: ${style.lineWidth}, 0, "${cleanTitle}"`);
      for (const [lat, lon] of poly) {
        lines.push(`  ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      }
      lines.push("End:");
      lines.push("");

      totalPolygons++;
    }
  }

  console.log("4. Writing placefile.txt...");
  const publicDir = path.join(process.cwd(), "public");
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(path.join(publicDir, "placefile.txt"), lines.join("\n"), "utf-8");

  console.log(`Done! Written ${totalPolygons} polygons into public/placefile.txt`);
}

async function fetchAllFeeds() {
  const promises = FEEDS.map(async (url) => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "GR2A-Placefile-Gen/1.0" },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) return [];
      const xml = await res.text();
      return parseAtom(xml);
    } catch {
      return [];
    }
  });

  const results = await Promise.allSettled(promises);
  return results
    .filter((r) => r.status === "fulfilled" && Array.isArray(r.value))
    .flatMap((r) => r.value);
}

function parseAtom(xml) {
  const warnings = [];
  let entryStart = xml.indexOf("<entry>");

  while (entryStart !== -1) {
    const entryEnd = xml.indexOf("</entry>", entryStart);
    if (entryEnd === -1) break;

    const entry = xml.substring(entryStart, entryEnd);
    const title = extractTag(entry, "title") || "Weather Warning";
    const severity = extractTag(entry, "cap:severity") || "Moderate";

    const polygons = [];
    let polyMatch;
    const polyRegex = /<cap:polygon>([\s\S]*?)<\/cap:polygon>/g;

    while ((polyMatch = polyRegex.exec(entry)) !== null) {
      const points = polyMatch[1]
        .trim()
        .split(/\s+/)
        .map((pt) => {
          const parts = pt.split(",");
          if (parts.length === 2) {
            const lat = parseFloat(parts[0]);
            const lon = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lon)) return [lat, lon];
          }
          return null;
        })
        .filter(Boolean);

      if (points.length >= 3) {
        polygons.push(points);
      }
    }

    if (polygons.length > 0) {
      warnings.push({ title, severity, polygons });
    }

    entryStart = xml.indexOf("<entry>", entryEnd);
  }

  return warnings;
}

function extractTag(text, tag) {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;
  const start = text.indexOf(openTag);
  if (start === -1) return null;
  const end = text.indexOf(closeTag, start + openTag.length);
  if (end === -1) return null;
  return text.substring(start + openTag.length, end).trim();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
