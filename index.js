const fs = require('fs');
const path = require('path');

const METEOALARM_FEEDS = [
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

const BOUNDARY_SOURCES = [
  "https://raw.githubusercontent.com/wmgeolab/geoBoundaries/main/releaseData/gbOpen/UKR/ADM1/geoBoundaries-UKR-ADM1.geojson",
  "https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_20M_2021_4326_LEVL_2.geojson"
];

const SEVERITY_COLORS = {
  Extreme:  { fill: "255 0 0 25",     line: "255 0 0 70" },
  Severe:   { fill: "255 140 0 25",   line: "255 140 0 70" },
  Moderate: { fill: "240 200 0 25",   line: "210 180 0 70" },
  Minor:    { fill: "0 180 230 25",   line: "0 120 200 70" }
};

const UKRAINE_REGION_ALIASES = {
  "черкаська": "cherkasy", "cherkasy": "cherkasy",
  "чернігівська": "chernihiv", "chernihiv": "chernihiv",
  "чернівецька": "chernivtsi", "chernivtsi": "chernivtsi",
  "дніпропетровська": "dnipropetrovsk", "dnipropetrovsk": "dnipropetrovsk",
  "донецька": "donetsk", "donetsk": "donetsk",
  "івано-франківська": "ivano-frankivsk", "ivanofrankivsk": "ivano-frankivsk",
  "харківська": "kharkiv", "kharkiv": "kharkiv",
  "херсонська": "kherson", "kherson": "kherson",
  "хмельницька": "khmelnytskyi", "khmelnytskyi": "khmelnytskyi",
  "кіровоградська": "kirovohrad", "kirovohrad": "kirovohrad", "kropyvnytskyi": "kirovohrad",
  "київська": "kyiv", "kyiv": "kyiv", "kiev": "kyiv",
  "луганська": "luhansk", "luhansk": "luhansk",
  "львівська": "lviv", "lviv": "lviv",
  "миколаївська": "mykolaiv", "mykolaiv": "mykolaiv",
  "одеська": "odesa", "odesa": "odesa", "odessa": "odesa",
  "полтавська": "poltava", "poltava": "poltava",
  "рівненська": "rivne", "rivne": "rivne",
  "сумська": "sumy", "sumy": "sumy",
  "тернопільська": "ternopil", "ternopil": "ternopil",
  "вінницька": "vinnytsia", "vinnytsia": "vinnytsia",
  "волинська": "volyn", "volyn": "volyn",
  "закарпатська": "zakarpattia", "zakarpattia": "zakarpattia",
  "запорізька": "zaporizhzhia", "zaporizhzhia": "zaporizhzhia",
  "житомирська": "zhytomyr", "zhytomyr": "zhytomyr",
  "крим": "crimea", "crimea": "crimea",
  "севастополь": "sevastopol", "sevastopol": "sevastopol"
};

function normalizeName(str) {
  if (!str) return "";
  const cleanStr = str.toLowerCase().trim();
  for (const [key, alias] of Object.entries(UKRAINE_REGION_ALIASES)) {
    if (cleanStr.includes(key)) return alias;
  }
  return cleanStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
}

async function fetchAllMeteoAlarmWarnings() {
  const fetchPromises = METEOALARM_FEEDS.map(async (url) => {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "GR2A-Placefile-Gen/1.0" } });
      if (!res.ok) return [];
      const xmlText = await res.text();
      return parseFeedXml(xmlText);
    } catch { return []; }
  });
  const results = await Promise.allSettled(fetchPromises);
  const warnings = [];
  for (const res of results) {
    if (res.status === "fulfilled" && Array.isArray(res.value)) {
      warnings.push(...res.value);
    }
  }
  return warnings;
}

function parseFeedXml(xmlText) {
  const warnings = [];
  const entries = xmlText.split("<entry>");
  for (let i = 1; i < entries.length; i++) {
    const entry = entries[i];
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const severityMatch = entry.match(/<cap:severity>(.*?)<\/cap:severity>/s);
    const areaDescMatch = entry.match(/<cap:areaDesc>(.*?)<\/cap:areaDesc>/s);
    const polygonMatch = entry.match(/<cap:polygon>(.*?)<\/cap:polygon>/s);

    const title = titleMatch ? titleMatch[1].trim() : "Weather Warning";
    const severity = severityMatch ? severityMatch[1].trim() : "Moderate";
    const areaDesc = areaDescMatch ? areaDescMatch[1].trim() : "";

    let capPolygon = null;
    if (polygonMatch) {
      const rawCoords = polygonMatch[1].trim().split(/\s+/);
      capPolygon = rawCoords.map(pt => {
        const [lat, lon] = pt.split(",").map(Number);
        return [lon, lat];
      });
    }

    if (areaDesc) {
      const regionList = areaDesc.split(/[,;\n]+/).map(r => r.trim()).filter(Boolean);
      for (const regionName of regionList) {
        const norm = normalizeName(regionName);
        if (norm.length >= 3) {
          warnings.push({ regionName, normalizedName: norm, severity, title, capPolygon });
        }
      }
    }
  }
  return warnings;
}

async function fetchActiveRegionBoundaries(activeNames) {
  const activeRegions = [];
  for (const url of BOUNDARY_SOURCES) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const geojson = await res.json();
      if (!geojson.features) continue;

      for (const feature of geojson.features) {
        const props = feature.properties || {};
        const name = props.shapeName || props.NUTS_NAME || props.NAME_LATN || props.NAME || props.id;
        if (!name) continue;

        const norm = normalizeName(name);
        if (norm.length < 3) continue;

        let isMatch = false;
        for (const activeName of activeNames) {
          if (activeName === norm || (norm.length >= 4 && (activeName.includes(norm) || norm.includes(activeName)))) {
            isMatch = true;
            break;
          }
        }
        if (!isMatch) continue;

        const geometry = feature.geometry;
        if (!geometry) continue;

        const polygons = [];
        if (geometry.type === "Polygon") {
          polygons.push(geometry.coordinates[0]);
        } else if (geometry.type === "MultiPolygon") {
          for (const poly of geometry.coordinates) polygons.push(poly[0]);
        }
        if (polygons.length > 0) activeRegions.push({ name, normalizedName: norm, polygons });
      }
    } catch (e) { console.error(e); }
  }
  return activeRegions;
}

function findWarning(regionNorm, warnings) {
  if (!regionNorm || regionNorm.length < 3) return null;
  return warnings.find(w => {
    if (!w.normalizedName || w.normalizedName.length < 3) return false;
    if (w.normalizedName === regionNorm) return true;
    if (regionNorm.length >= 4 && w.normalizedName.length >= 4) {
      return w.normalizedName.includes(regionNorm) || regionNorm.includes(w.normalizedName);
    }
    return false;
  });
}

function generatePlacefile(warnings, regions) {
  const lines = ["Title: MeteoAlarm & Ukraine Warnings", "Refresh: 1", ""];
  const processedWarnings = new Set();

  for (const region of regions) {
    const warning = findWarning(region.normalizedName, warnings);
    if (!warning) continue;
    processedWarnings.add(warning);
    const colorSpec = SEVERITY_COLORS[warning.severity] || SEVERITY_COLORS.Moderate;
    const hoverText = `${warning.title} issued for ${region.name}`;

    for (const poly of region.polygons) {
      lines.push(`Color: ${colorSpec.fill}`);
      lines.push("Polygon:");
      for (const [lon, lat] of poly) lines.push(`  ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      lines.push("End:");

      lines.push(`Color: ${colorSpec.line}`);
      lines.push(`Line: 1, 0, "${hoverText}"`);
      for (const [lon, lat] of poly) lines.push(`  ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
      lines.push("End:");
    }
  }

  for (const warning of warnings) {
    if (processedWarnings.has(warning) || !warning.capPolygon) continue;
    const colorSpec = SEVERITY_COLORS[warning.severity] || SEVERITY_COLORS.Moderate;

    lines.push(`Color: ${colorSpec.fill}`);
    lines.push("Polygon:");
    for (const [lon, lat] of warning.capPolygon) lines.push(`  ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    lines.push("End:");

    lines.push(`Color: ${colorSpec.line}`);
    lines.push(`Line: 1, 0, "${warning.title} issued for ${warning.regionName}"`);
    for (const [lon, lat] of warning.capPolygon) lines.push(`  ${lat.toFixed(5)}, ${lon.toFixed(5)}`);
    lines.push("End:");
  }
  return lines.join("\n");
}

async function main() {
  try {
    console.log("Starting data fetch...");
    const warnings = await fetchAllMeteoAlarmWarnings();
    let placefileContent = "";

    if (warnings.length === 0) {
      placefileContent = "Title: MeteoAlarm Active Warnings\nRefresh: 1\n";
    } else {
      const activeNames = new Set(warnings.map(w => w.normalizedName));
      const activeRegions = await fetchActiveRegionBoundaries(activeNames);
      placefileContent = generatePlacefile(warnings, activeRegions);
    }

    // Принудительно создаем папку public, чтобы GitHub Actions не падал
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    // Сохраняем файл ТОЧНО под именем placefile.txt
    const outputPath = path.join(publicDir, 'placefile.txt');
    fs.writeFileSync(outputPath, placefileContent, 'utf8');
    
    console.log("SUCCESS: Placefile generated at", outputPath);
  } catch (err) {
    console.error("CRITICAL ERROR:", err);
    process.exit(1); // Роняем процесс, если была фатальная ошибка
  }
}

main();
