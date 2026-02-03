import "dotenv/config";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/orders.js";
import technicianRoutes from "./routes/technicians.js";
import itemRoutes from "./routes/items.js";

const app = express();
const isProd = process.env.NODE_ENV === "production";
const jwtSecret = process.env.JWT_SECRET;

if (isProd && !jwtSecret) {
  throw new Error("JWT_SECRET must be set in production");
}

app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (!allowedOrigins.length) return callback(null, !isProd);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()"
  );
  next();
});

const rateWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const rateMax = Number(process.env.RATE_LIMIT_MAX || 300);
const rateMap = new Map();
const rateCleanupMs = Number(process.env.RATE_LIMIT_CLEANUP_MS || 60 * 60 * 1000);
let lastCleanup = Date.now();

app.use((req, res, next) => {
  const now = Date.now();
  if (now - lastCleanup > rateCleanupMs) {
    for (const [key, entry] of rateMap.entries()) {
      if (now > entry.resetAt) {
        rateMap.delete(key);
      }
    }
    lastCleanup = now;
  }
  const key = req.ip || req.connection?.remoteAddress || "unknown";
  const entry = rateMap.get(key) || { count: 0, resetAt: now + rateWindowMs };
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + rateWindowMs;
  }
  entry.count += 1;
  rateMap.set(key, entry);
  if (entry.count > rateMax) {
    return res.status(429).json({ error: "Too many requests" });
  }
  return next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false, limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/technicians", technicianRoutes);
app.use("/api/items", itemRoutes);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
