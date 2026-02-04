import fs from "node:fs";
import mysql from "mysql2/promise";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var ${name}`);
  return v;
}

function buildSslConfig() {
  const caRaw = process.env.DB_SSL_CA;
  const caFile = process.env.DB_SSL_CA_FILE;
  const required = String(process.env.DB_SSL_REQUIRED || "").toLowerCase() === "true";
  if (!caRaw && !caFile && !required) return undefined;
  const ca = caFile
    ? fs.readFileSync(caFile, "utf8")
    : caRaw
      ? caRaw.replace(/\\n/g, "\n")
      : undefined;
  return { ca, rejectUnauthorized: true };
}

function normalizeName(value) {
  return String(value || "")
    .replace(/[“”]/g, '"')
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeNameStrict(value) {
  const stopWords = new Set(["threaded", "thread"]);
  const cleaned = normalizeName(value)
    .replace(/["']/g, "")
    .replace(/[^a-z0-9/ .x-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const tokens = cleaned
    .split(" ")
    .map((t) => t.trim())
    .filter((t) => t && !stopWords.has(t));
  return tokens.join(" ").trim();
}

function normalizeNameLoose(value) {
  return normalizeName(value)
    .replace(/["']/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bone\s+side\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildKeyVariants(canonicalName) {
  const variants = new Set();
  const base = normalizeName(canonicalName);
  const strict = normalizeNameStrict(canonicalName);
  const loose = normalizeNameLoose(canonicalName);
  const noQuotes = base.replace(/["']/g, "");

  [base, strict, loose, noQuotes].forEach((v) => {
    const key = normalizeName(v);
    if (key) variants.add(key);
  });

  return Array.from(variants);
}

async function insertBatches(conn, rows, batchSize = 1000) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    const [result] = await conn.query(
      "INSERT IGNORE INTO item_aliases (input_name, canonical_name) VALUES ?",
      [batch]
    );
    // For INSERT IGNORE, affectedRows counts inserted rows.
    inserted += Number(result?.affectedRows || 0);
    // eslint-disable-next-line no-console
    console.log(`Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
  return inserted;
}

async function main() {
  const dbName = requireEnv("DB_NAME");
  const conn = await mysql.createConnection({
    host: requireEnv("DB_HOST"),
    port: Number(requireEnv("DB_PORT")),
    user: requireEnv("DB_USER"),
    password: requireEnv("DB_PASSWORD"),
    database: dbName,
    ssl: buildSslConfig(),
    multipleStatements: false,
  });

  const [beforeRows] = await conn.query("SELECT COUNT(*) AS c FROM item_aliases");
  const before = Number(beforeRows?.[0]?.c || 0);

  const sources = [
    { table: "trans_ocean", col: "item_name" },
    { table: "fitting_average", col: "item_name" },
    { table: "simba_pipes", col: "description" },
    { table: "pipes_average_price", col: "description" },
  ];

  // Keep first canonical per key based on source priority.
  const keyToCanonical = new Map();

  for (const src of sources) {
    // eslint-disable-next-line no-console
    console.log(`\\nLoading ${src.table}...`);
    // eslint-disable-next-line no-await-in-loop
    const [rows] = await conn.query(
      `SELECT ${src.col} AS name
       FROM ${src.table}
       WHERE ${src.col} IS NOT NULL AND TRIM(${src.col}) <> ''`
    );

    for (const r of rows) {
      const canonical = String(r?.name || "").trim();
      if (!canonical) continue;
      const keys = buildKeyVariants(canonical);
      for (const key of keys) {
        if (!keyToCanonical.has(key)) keyToCanonical.set(key, canonical);
      }
    }
    // eslint-disable-next-line no-console
    console.log(`${src.table}: loaded ${rows.length} rows`);
  }

  const toInsert = Array.from(keyToCanonical.entries()).map(([inputName, canonicalName]) => [
    inputName,
    canonicalName,
  ]);

  // eslint-disable-next-line no-console
  console.log(`\\nPrepared ${toInsert.length} alias rows`);

  const inserted = await insertBatches(conn, toInsert);

  const [afterRows] = await conn.query("SELECT COUNT(*) AS c FROM item_aliases");
  const after = Number(afterRows?.[0]?.c || 0);

  await conn.end();

  // eslint-disable-next-line no-console
  console.log(
    `\\nDone. item_aliases before=${before}, after=${after}, inserted=${inserted}, net_new=${after - before}`
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

