import fs from "node:fs";
import path from "node:path";
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

function parseCsv(text) {
  // Minimal RFC4180-ish parser: supports quoted fields + escaped quotes.
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\n") {
      row.push(field);
      field = "";
      // trim trailing \r
      if (row.length && row[row.length - 1].endsWith("\r")) {
        row[row.length - 1] = row[row.length - 1].slice(0, -1);
      }
      rows.push(row);
      row = [];
      continue;
    }
    field += ch;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function findHeaderIndex(rows) {
  for (let i = 0; i < Math.min(rows.length, 30); i += 1) {
    const first = String(rows[i]?.[0] || "").trim().toLowerCase();
    if (first === "sn" || first === "s/n") return i;
  }
  return -1;
}

function cleanText(v) {
  return String(v || "").trim();
}

function cleanInt(v) {
  const s = cleanText(v).replace(/[^0-9]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function cleanDec(v) {
  const s = cleanText(v).replace(/,/g, "").replace(/[^0-9.\\-]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

async function insertBatches(conn, sql, rows, batchSize = 500) {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    // eslint-disable-next-line no-await-in-loop
    await conn.query(sql, [batch]);
    // eslint-disable-next-line no-console
    console.log(`Inserted ${Math.min(i + batchSize, rows.length)}/${rows.length}`);
  }
}

async function main() {
  const baseDir = process.env.CSV_DIR || "/home/mosatinc/Documents/quotation";
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

  const files = [
    { file: "FITTING-AVERAGE.csv", kind: "fitting_average" },
    { file: "TRANS-OCEAN.csv", kind: "trans_ocean" },
    { file: "SIMBA-PIPES.csv", kind: "simba_pipes" },
    { file: "PIPES-AVERAGE PRICE.csv", kind: "pipes_average_price" },
  ];

  for (const f of files) {
    const p = path.join(baseDir, f.file);
    if (!fs.existsSync(p)) throw new Error(`Missing file: ${p}`);
    const raw = fs.readFileSync(p, { encoding: "latin1" });
    const rows = parseCsv(raw);
    const headerIdx = findHeaderIndex(rows);
    if (headerIdx < 0) throw new Error(`Could not find header row in ${f.file}`);

    const dataRows = rows.slice(headerIdx + 1).filter((r) => r.some((c) => cleanText(c)));
    // eslint-disable-next-line no-console
    console.log(`\\n${f.kind}: parsed ${dataRows.length} rows`);

    if (f.kind === "fitting_average") {
      const toInsert = dataRows.map((r) => [
        cleanInt(r[0]),
        cleanText(r[1]),
        cleanText(r[2]),
        cleanText(r[3]),
        cleanDec(r[4]),
        cleanDec(r[5]),
        cleanDec(r[6]),
        cleanDec(r[7]),
        cleanDec(r[8]),
        cleanDec(r[9]),
        cleanDec(r[10]),
      ]);
      await conn.query("TRUNCATE fitting_average");
      await insertBatches(
        conn,
        `INSERT INTO fitting_average\n         (sn, item_name, unit_of_measure, quantity_and_physical_unit,\n          trans_old_price, nyamanolo, mayeura, trans_ocean, average_price, vat, average_with_vat)\n         VALUES ?`,
        toInsert
      );
      continue;
    }

    if (f.kind === "trans_ocean") {
      const toInsert = dataRows.map((r) => [
        cleanInt(r[0]),
        cleanText(r[1]),
        cleanText(r[2]),
        cleanText(r[3]),
        cleanDec(r[4]),
        cleanDec(r[5]),
        cleanDec(r[6]),
      ]);
      await conn.query("TRUNCATE trans_ocean");
      await insertBatches(
        conn,
        `INSERT INTO trans_ocean\n         (sn, item_name, unit_of_measure, quantity_and_physical_unit,\n          trans_ocean, vat, average_with_vat)\n         VALUES ?`,
        toInsert
      );
      continue;
    }

    if (f.kind === "simba_pipes") {
      const toInsert = dataRows.map((r) => [
        cleanInt(r[0]),
        cleanText(r[1]),
        cleanText(r[2]),
        cleanDec(r[3]),
        cleanDec(r[4]),
        cleanDec(r[5]),
        cleanDec(r[6]),
      ]);
      await conn.query("TRUNCATE simba_pipes");
      await insertBatches(
        conn,
        `INSERT INTO simba_pipes\n         (sn, description, unit, qty, simba_plastic, vat, average_with_vat)\n         VALUES ?`,
        toInsert
      );
      continue;
    }

    if (f.kind === "pipes_average_price") {
      const toInsert = dataRows.map((r) => [
        cleanInt(r[0]),
        cleanText(r[1]),
        cleanText(r[2]),
        cleanDec(r[3]),
        cleanDec(r[4]),
        cleanDec(r[5]),
        cleanDec(r[6]),
        cleanDec(r[7]),
        cleanDec(r[8]),
      ]);
      await conn.query("TRUNCATE pipes_average_price");
      await insertBatches(
        conn,
        `INSERT INTO pipes_average_price\n         (sn, description, unit, qty, pipe_industries, simba_plastic, average_price, vat, average_with_vat)\n         VALUES ?`,
        toInsert
      );
      continue;
    }
  }

  await conn.end();
  // eslint-disable-next-line no-console
  console.log("\nDone.");
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
