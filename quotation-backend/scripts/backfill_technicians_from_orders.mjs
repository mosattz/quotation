import fs from "fs";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

function optionalEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

function buildSslOptions() {
  if (!String(process.env.DB_SSL_REQUIRED || "").toLowerCase().startsWith("t")) {
    return undefined;
  }
  const caFile = process.env.DB_SSL_CA_FILE;
  const caInline = process.env.DB_SSL_CA;
  const ca = caFile ? fs.readFileSync(caFile, "utf8") : caInline || undefined;
  return ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: true };
}

async function ensureTechnicianUser(conn, technicianName, zone) {
  const name = String(technicianName || "").trim();
  if (!name) return null;

  const normalized = name.toLowerCase();
  const [existing] = await conn.query(
    `SELECT id
     FROM users
     WHERE role = 'technician' AND LOWER(name) = ?
     LIMIT 1`,
    [normalized]
  );
  if (existing.length) {
    const userId = existing[0].id;
    const submittedZone = zone ? String(zone).trim() : "";
    if (submittedZone) {
      await conn.query(
        `UPDATE users SET zone = ? WHERE id = ? AND (zone IS NULL OR TRIM(zone) = '')`,
        [submittedZone, userId]
      );
    }
    return { id: userId, created: false };
  }

  const slug =
    normalized
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "tech";
  const hash = crypto.createHash("sha1").update(normalized).digest("hex").slice(0, 10);
  const email = `tech+${slug}-${hash}@quotation.local`;
  const passwordHash = bcrypt.hashSync(crypto.randomBytes(32).toString("hex"), 10);
  const submittedZone = zone ? String(zone).trim() : "";

  const [result] = await conn.query(
    `INSERT INTO users (name, email, password, role, zone)
     VALUES (?, ?, ?, 'technician', ?)`,
    [name, email, passwordHash, submittedZone || null]
  );
  return { id: result.insertId, created: true };
}

async function main() {
  const host = requireEnv("DB_HOST");
  const port = Number(optionalEnv("DB_PORT", "3306"));
  const user = requireEnv("DB_USER");
  const password = requireEnv("DB_PASSWORD");
  const database = requireEnv("DB_NAME");
  const ssl = buildSslOptions();

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    ssl,
    multipleStatements: false,
  });

  const [names] = await conn.query(
    `SELECT 
       technician_name AS name,
       SUBSTRING_INDEX(GROUP_CONCAT(zone ORDER BY created_at DESC SEPARATOR ','), ',', 1) AS zone
     FROM orders
     WHERE technician_id IS NULL
       AND technician_name IS NOT NULL
       AND TRIM(technician_name) <> ''
     GROUP BY technician_name`
  );

  let ensured = 0;
  let created = 0;
  let updated = 0;

  for (const row of names) {
    const name = String(row.name || "").trim();
    if (!name) continue;
    const ensuredUser = await ensureTechnicianUser(conn, name, row.zone);
    if (!ensuredUser) continue;
    ensured += 1;
    if (ensuredUser.created) created += 1;
    const [res] = await conn.query(
      `UPDATE orders
       SET technician_id = ?
       WHERE technician_id IS NULL AND LOWER(technician_name) = LOWER(?)`,
      [ensuredUser.id, name]
    );
    updated += Number(res.affectedRows || 0);
  }

  await conn.end();
  console.log(
    `Backfill complete: ensured ${ensured} technicians (${created} created), updated ${updated} orders.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
