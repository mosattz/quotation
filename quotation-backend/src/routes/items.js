import express from "express";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const query = String(req.query?.query || "").trim();
  if (!query) {
    return res.json([]);
  }

  try {
    const stopWords = new Set(["threaded", "thread"]);
    const normalized = query
      .toLowerCase()
      .replace(/[“”]/g, '"')
      .replace(/[’]/g, "'")
      .replace(/["']/g, "")
      .replace(/[^a-z0-9/ .x-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const tokens = normalized
      .split(" ")
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !stopWords.has(t));
    const patterns = tokens.length ? tokens : [normalized];
    const likes = patterns.map((t) => `%${t}%`);
    const where = likes.map(() => "LOWER(name) LIKE ?").join(" OR ");
    const [rows] = await pool.query(
      `SELECT name, unit FROM (
         SELECT item_name AS name, unit_of_measure AS unit
         FROM trans_ocean
         UNION ALL
         SELECT item_name AS name, unit_of_measure AS unit
         FROM fitting_average
         UNION ALL
         SELECT description AS name, unit
         FROM simba_pipes
         UNION ALL
         SELECT description AS name, unit
         FROM pipes_average_price
         UNION ALL
         SELECT canonical_name AS name, NULL AS unit
         FROM item_aliases
       ) items
       WHERE ${where}
       GROUP BY name, unit
       ORDER BY name ASC
       LIMIT 20`,
      likes
    );

    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
