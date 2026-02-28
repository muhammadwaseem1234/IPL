import fs from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";

type PlayerInsert = {
  name: string;
  nationality: string | null;
  category: string | null;
  role: string;
  base_price: number;
  ais: number;
  batting: number | null;
  bowling: number | null;
  fielding: number | null;
  leadership: number | null;
  image_path: string | null;
};

function cleanText(value: string | undefined): string {
  return (value ?? "").trim();
}

function toNumber(value: string | undefined): number | null {
  const raw = cleanText(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const IMAGE_NAME_ALIASES: Record<string, string> = {
  [normalizeKey("Abhishek Sharma")]: normalizeKey("abishek_ sharma"),
  [normalizeKey("Ajinkya Rahane")]: normalizeKey("rahane"),
  [normalizeKey("Andre Russel")]: normalizeKey("andre_russell"),
  [normalizeKey("Bhuvneshwar Kumar")]: normalizeKey("bhuvaneshwar"),
  [normalizeKey("Bhuvneshwar Kumar45")]: normalizeKey("bhuvaneshwar"),
  [normalizeKey("Chris Gayle")]: normalizeKey("gayle"),
  [normalizeKey("Chris Goyle")]: normalizeKey("gayle"),
  [normalizeKey("Daniel Sams")]: normalizeKey("daniel_ sam"),
  [normalizeKey("Dwayne Bravo")]: normalizeKey("dj_bravo"),
  [normalizeKey("Imam-ul-Haq")]: normalizeKey("imman_ul_haq"),
  [normalizeKey("Iman -Ul-Haq")]: normalizeKey("imman_ul_haq"),
  [normalizeKey("Jonny Bairstow")]: normalizeKey("jonny_-baristow"),
  [normalizeKey("Kane Williamson")]: normalizeKey("kane_wiiliamson"),
  [normalizeKey("M S Dhoni")]: normalizeKey("dhoni"),
  [normalizeKey("R Ashwin")]: normalizeKey("ravichandra_ashwin"),
  [normalizeKey("Ranvindra Jadeja")]: normalizeKey("jadeja"),
  [normalizeKey("Rishabh Pant")]: normalizeKey("rishab_pant"),
  [normalizeKey("Romario Shepherd")]: normalizeKey("romario_stepherd"),
  [normalizeKey("Shikhar Dhawan")]: normalizeKey("shikar_dhawan"),
  [normalizeKey("Vaibhav Arora")]: normalizeKey("vaibav_arora"),
};

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function estimateBasePrice(ais: number, ovr: number | null): number {
  const score = ovr ?? ais;
  const estimated = score / 20;
  return Math.max(0.2, Math.round(estimated * 10) / 10);
}

async function loadEnvFile(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex <= 0) continue;

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

async function buildImageMap(playerPicsDir: string): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>();

  const files = await fs.readdir(playerPicsDir);
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(extension)) {
      continue;
    }
    const withoutExt = file.slice(0, -extension.length);
    fileMap.set(normalizeKey(withoutExt), `/Player_pics/${file}`);
  }

  return fileMap;
}

async function resolveDefaultCsvPath(): Promise<string> {
  const candidates = [
    path.resolve(process.cwd(), "../cricket_players_with_categories.csv"),
    path.resolve(process.cwd(), "../IPL_Player_Ratings_with_Nationality.csv"),
    path.resolve(process.cwd(), "../creadit score (1).csv"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  throw new Error(
    "No default CSV found. Pass a path: npm run import:players -- \"..\\cricket_players_with_categories.csv\"",
  );
}

function getColumn(
  columns: string[],
  indexByHeader: Map<string, number>,
  headerCandidates: string[],
  fallbackIndices: number[],
): string | undefined {
  for (const candidate of headerCandidates) {
    const index = indexByHeader.get(normalizeKey(candidate));
    if (index !== undefined && index < columns.length) {
      return columns[index];
    }
  }

  for (const index of fallbackIndices) {
    if (index >= 0 && index < columns.length) {
      return columns[index];
    }
  }

  return undefined;
}

async function main() {
  await loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  await loadEnvFile(path.resolve(process.cwd(), ".env"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before import.",
    );
  }

  const csvPathArg = process.argv[2];
  const csvPath = csvPathArg ? path.resolve(process.cwd(), csvPathArg) : await resolveDefaultCsvPath();

  const playerPicsDir = path.resolve(process.cwd(), "public", "Player_pics");
  const imageMap = await buildImageMap(playerPicsDir);

  const csvRaw = await fs.readFile(csvPath, "utf8");
  const lines = csvRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new Error("CSV has no data rows.");
  }

  const headerColumns = parseCsvLine(lines[0]).map((header) => cleanText(header));
  const indexByHeader = new Map(
    headerColumns.map((header, index) => [normalizeKey(header), index] as const),
  );

  const rows = lines.slice(1);
  const playersByName = new Map<string, PlayerInsert>();

  for (const row of rows) {
    const cols = parseCsvLine(row);
    const name = cleanText(
      getColumn(cols, indexByHeader, ["playername", "name"], [1]),
    );
    if (!name) continue;

    const nationality =
      cleanText(getColumn(cols, indexByHeader, ["nationality"], [2])) || null;
    const category =
      cleanText(getColumn(cols, indexByHeader, ["category"], [10])) || null;
    const batting = toNumber(getColumn(cols, indexByHeader, ["batting40", "batting"], [3]));
    const bowling = toNumber(getColumn(cols, indexByHeader, ["bowling40", "bowling"], [5]));
    const fielding = toNumber(getColumn(cols, indexByHeader, ["fielding10", "fielding"], [7]));
    const leadership = toNumber(
      getColumn(cols, indexByHeader, ["leadership10", "leadership"], [9]),
    );
    const ais = toNumber(getColumn(cols, indexByHeader, ["ais"], [11, 7])) ?? 0;
    const role =
      cleanText(getColumn(cols, indexByHeader, ["position", "role"], [12, 8])) || "Batsman";
    const ovr = toNumber(getColumn(cols, indexByHeader, ["ovr"], [14, 9]));

    const normalizedName = normalizeKey(name);
    const aliasKey = IMAGE_NAME_ALIASES[normalizedName];
    const imagePath = imageMap.get(aliasKey ?? normalizedName) ?? null;

    playersByName.set(name, {
      name,
      nationality,
      category,
      role,
      base_price: estimateBasePrice(ais, ovr),
      ais,
      batting,
      bowling,
      fielding,
      leadership,
      image_path: imagePath,
    });
  }

  const players = [...playersByName.values()];

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { error } = await supabase.from("players").upsert(players, { onConflict: "name" });

  if (error) {
    throw new Error(`Supabase import failed: ${error.message}`);
  }

  console.log(`Imported ${players.length} players from ${csvPath}`);

  const unresolved = players.filter((player) => !player.image_path).map((player) => player.name);
  if (unresolved.length > 0) {
    console.log(`Unresolved photos: ${unresolved.length}`);
    unresolved.forEach((name) => console.log(`- ${name}`));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
