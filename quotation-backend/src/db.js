import mysql from "mysql2/promise";
import fs from "node:fs";

function buildSslConfig() {
  // Aiven (and many managed MySQL providers) require TLS.
  // Provide the CA cert via env var `DB_SSL_CA` (multiline is fine on Render).
  const caRaw = process.env.DB_SSL_CA;
  const caFile = process.env.DB_SSL_CA_FILE;
  const required = String(process.env.DB_SSL_REQUIRED || "").toLowerCase() === "true";
  if (!caRaw && !caFile && !required) return undefined;

  // Support either raw PEM, PEM encoded with literal "\n", or a file path.
  const ca = caFile
    ? fs.readFileSync(caFile, "utf8")
    : caRaw
      ? caRaw.replace(/\\n/g, "\n")
      : undefined;
  return {
    ca,
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: buildSslConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;
