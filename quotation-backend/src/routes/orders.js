import express from "express";
import pool from "../db.js";
import { optionalAuth, requireAdmin, requireAuth, requireRoles } from "../middleware/auth.js";
const router = express.Router();

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
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

function parseDistance(value) {
  if (value === null || value === undefined) return 0;
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function isNumeric(value) {
  if (value === null || value === undefined) return false;
  const num = Number(String(value).trim());
  return Number.isFinite(num);
}

function sanitizeItems(items) {
  return Array.isArray(items)
    ? items
        .filter((item) => item && String(item.name || "").trim())
        .map((item) => ({
          name: String(item.name || "").trim(),
          qty: Number(item.qty || 0),
          unit: item.unit ? String(item.unit).trim() : "",
        }))
        .filter((item) => item.qty > 0 && item.unit)
    : [];
}

async function logAudit({ orderId, action, user, before, after }) {
  await pool.query(
    `INSERT INTO order_audits
       (order_id, action, performed_by, performed_by_name, before_json, after_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      orderId,
      action,
      user?.id || null,
      user?.name || null,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
    ]
  );
}

function normalizeNameLoose(value) {
  return normalizeName(value)
    .replace(/["']/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\bone\s+side\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractSizeTokens(value) {
  const cleaned = normalizeName(value).replace(/["']/g, "");
  const matches = cleaned.match(/\d+(?:\.\d+)?(?:\/\d+)?/g);
  if (!matches) return [];
  const sizes = matches
    .map((token) => token.replace(/^0+/, ""))
    .filter(Boolean);
  return Array.from(new Set(sizes));
}

function similarityScore(a, b) {
  const left = normalizeNameLoose(a);
  const right = normalizeNameLoose(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  const bigrams = (text) => {
    const grams = new Map();
    for (let i = 0; i < text.length - 1; i += 1) {
      const gram = text.slice(i, i + 2);
      grams.set(gram, (grams.get(gram) || 0) + 1);
    }
    return grams;
  };
  const leftBigrams = bigrams(left);
  const rightBigrams = bigrams(right);
  let intersection = 0;
  for (const [gram, count] of leftBigrams) {
    const other = rightBigrams.get(gram) || 0;
    intersection += Math.min(count, other);
  }
  const total = Math.max(left.length - 1, 1) + Math.max(right.length - 1, 1);
  return (2 * intersection) / total;
}

async function saveAlias(pool, inputName, canonicalName) {
  try {
    await pool.query(
      `INSERT INTO item_aliases (input_name, canonical_name)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE canonical_name = VALUES(canonical_name)`,
      [normalizeName(inputName), canonicalName]
    );
  } catch {
    // ignore alias insert failures
  }
}

async function fallbackLookup(pool, name) {
  const needle = normalizeNameLoose(name);
  if (!needle) return null;
  const rawTokens = needle.split(" ").filter((token) => token.length >= 3);
  const tokens = rawTokens.sort((a, b) => b.length - a.length).slice(0, 4);
  const threshold = 0.78;
  const requiredSizes = extractSizeTokens(name);
  const tables = [
    { table: "trans_ocean", nameCol: "item_name", unitCol: "unit_of_measure" },
    { table: "fitting_average", nameCol: "item_name", unitCol: "unit_of_measure" },
    { table: "simba_pipes", nameCol: "description", unitCol: "unit" },
    { table: "pipes_average_price", nameCol: "description", unitCol: "unit" },
  ];

  for (const t of tables) {
    const whereParts = [];
    const params = [];
    if (tokens.length) {
      tokens.forEach((token) => {
        whereParts.push(`LOWER(${t.nameCol}) LIKE ?`);
        params.push(`%${token}%`);
      });
    } else {
      whereParts.push(`LOWER(${t.nameCol}) LIKE ?`);
      params.push(`%${needle}%`);
    }
    requiredSizes.forEach((size) => {
      whereParts.push(`LOWER(${t.nameCol}) REGEXP ?`);
      params.push(`(^|[^0-9])${size}([^0-9]|$)`);
    });
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT ${t.nameCol} AS name, ${t.unitCol} AS unit, average_with_vat AS rate
       FROM ${t.table}
       ${whereClause}
       LIMIT 200`,
      params
    );
    let best = null;
    let bestScore = 0;
    for (const row of rows) {
      if (requiredSizes.length) {
        const rowSizes = extractSizeTokens(row.name);
        const hasAll = requiredSizes.every((size) => rowSizes.includes(size));
        if (!hasAll) continue;
      }
      const score = similarityScore(needle, row.name);
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }
    if (best && bestScore >= threshold) {
      await saveAlias(pool, name, best.name);
      return {
        name: best.name,
        unit: best.unit,
        rate: toNumber(best.rate),
      };
    }
  }
  return null;
}

async function lookupItem(pool, name) {
  let normalized = normalizeName(name);
  if (!normalized) return null;

  const [aliasRows] = await pool.query(
    `SELECT canonical_name
     FROM item_aliases
     WHERE LOWER(input_name) IN (?, ?)
     ORDER BY CASE WHEN LOWER(input_name) = ? THEN 1 ELSE 0 END DESC
     LIMIT 1`,
    [normalized, normalizeNameStrict(normalized), normalized]
  );
  const aliasName = aliasRows.length ? aliasRows[0].canonical_name : null;
  const keys = new Set([
    normalizeName(normalized),
    normalizeNameStrict(normalized),
  ]);
  if (aliasName) {
    keys.add(normalizeName(aliasName));
    keys.add(normalizeNameStrict(aliasName));
  }
  const candidates = Array.from(keys).filter(Boolean);
  if (!candidates.length) return null;
  const placeholders = candidates.map(() => "?").join(", ");
  const [rows] = await pool.query(
    `SELECT item_name AS name, unit_of_measure AS unit, average_with_vat AS rate
     FROM trans_ocean
     WHERE LOWER(TRIM(REPLACE(REPLACE(item_name,'  ',' '),'  ',' '))) IN (${placeholders})
     UNION ALL
     SELECT item_name AS name, unit_of_measure AS unit, average_with_vat AS rate
     FROM fitting_average
     WHERE LOWER(TRIM(REPLACE(REPLACE(item_name,'  ',' '),'  ',' '))) IN (${placeholders})
     UNION ALL
     SELECT description AS name, unit, average_with_vat AS rate
     FROM simba_pipes
     WHERE LOWER(TRIM(REPLACE(REPLACE(description,'  ',' '),'  ',' '))) IN (${placeholders})
     UNION ALL
     SELECT description AS name, unit, average_with_vat AS rate
     FROM pipes_average_price
     WHERE LOWER(TRIM(REPLACE(REPLACE(description,'  ',' '),'  ',' '))) IN (${placeholders})
     LIMIT 1`,
    [...candidates, ...candidates, ...candidates, ...candidates]
  );

  if (!rows.length) {
    return await fallbackLookup(pool, name);
  }
  return {
    name: rows[0].name,
    unit: rows[0].unit,
    rate: toNumber(rows[0].rate),
  };
}

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { technicianId, customer, zone, startDate, endDate } = req.query || {};
    const where = [];
    const params = [];

    if (technicianId) {
      where.push("o.technician_id = ?");
      params.push(technicianId);
    }
    if (customer) {
      where.push("LOWER(o.customer_name) LIKE ?");
      params.push(`%${String(customer).toLowerCase()}%`);
    }
    if (zone) {
      where.push("o.zone = ?");
      params.push(zone);
    }
    if (startDate) {
      where.push("o.created_at >= ?");
      params.push(`${startDate} 00:00:00`);
    }
    if (endDate) {
      where.push("o.created_at <= ?");
      params.push(`${endDate} 23:59:59`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [rows] = await pool.query(
      `SELECT 
         o.id,
         o.created_at,
         o.updated_at,
         o.zone,
         o.customer_name,
         o.distance,
         o.pipe_size,
         o.items,
         u.name AS technician_name
       FROM orders o
       LEFT JOIN users u ON u.id = o.technician_id
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    );

    const data = [];
    for (const row of rows) {
      let items = [];
      try {
        items = Array.isArray(row.items) ? row.items : JSON.parse(row.items || "[]");
      } catch {
        items = [];
      }
      const detailedItems = [];
      let materialCost = 0;

      for (const item of items) {
        const name = String(item?.name || "").trim();
        const qty = toNumber(item?.qty);
        const unitFallback = item?.unit ? String(item.unit).trim() : null;
        const match = name ? await lookupItem(pool, name) : null;
        const unit = match?.unit || unitFallback || "";
        const rate = match?.rate ?? 0;
        const amount = rate && qty ? rate * qty : 0;
        materialCost += amount;
        detailedItems.push({
          name,
          unit,
          qty,
          rate,
          amount,
        });
      }

      const distanceQty = parseDistance(row.distance);
      const excavationRate = 3500;
      const excavationAmount = distanceQty * excavationRate;
      const labourAmount = materialCost * 0.1;
      const supervisionAmount = materialCost * 0.15;
      const otherChargesCost = excavationAmount + labourAmount + supervisionAmount;
      const grandTotal = materialCost + otherChargesCost;

      data.push({
        ...row,
        items: detailedItems,
        item_count: detailedItems.length,
        totals: {
          materialCost,
          distanceQty,
          excavationRate,
          excavationAmount,
          labourAmount,
          supervisionAmount,
          otherChargesCost,
          grandTotal,
        },
      });
    }

    return res.json(data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", optionalAuth, async (req, res) => {
  const { zone, customerName, distance, pipeSize, items, technicianName } = req.body || {};

  const submittedTechnicianName = String(technicianName || "").trim();
  const resolvedTechnicianName = req.user?.name ? String(req.user.name).trim() : submittedTechnicianName;

  if (!resolvedTechnicianName || !zone || !customerName || !distance || !pipeSize) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (resolvedTechnicianName.length > 150) {
    return res.status(400).json({ error: "Technician name is too long" });
  }
  if (String(customerName).trim().length > 150) {
    return res.status(400).json({ error: "Customer name is too long" });
  }

  // We store the original string (e.g. "340 m"), but validate that it contains a number.
  if (parseDistance(distance) <= 0 || parseDistance(pipeSize) <= 0) {
    return res.status(400).json({ error: "Distance and pipe size must include a number" });
  }

  const safeItems = sanitizeItems(items);
  if (!safeItems.length) {
    return res.status(400).json({ error: "At least one item is required" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO orders 
         (technician_id, technician_name, zone, customer_name, distance, pipe_size, items, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        req.user?.id || null,
        resolvedTechnicianName,
        zone,
        customerName,
        distance,
        pipeSize,
        JSON.stringify(safeItems),
      ]
    );
    return res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { zone, customerName, distance, pipeSize, items } = req.body || {};

  if (!zone || !customerName || !distance || !pipeSize) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  if (!isNumeric(distance) || !isNumeric(pipeSize)) {
    return res.status(400).json({ error: "Distance and pipe size must be numeric" });
  }
  const safeItems = sanitizeItems(items);
  if (!safeItems.length) {
    return res.status(400).json({ error: "At least one item is required" });
  }

  try {
    const [existingRows] = await pool.query(
      `SELECT id, technician_id, technician_name, zone, customer_name, distance, pipe_size, items, created_at, updated_at
       FROM orders
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!existingRows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    await pool.query(
      `UPDATE orders
       SET zone = ?, customer_name = ?, distance = ?, pipe_size = ?, items = ?, updated_at = NOW()
       WHERE id = ?`,
      [zone, customerName, distance, pipeSize, JSON.stringify(safeItems), id]
    );

    await logAudit({
      orderId: id,
      action: "update",
      user: req.user,
      before: existingRows[0],
      after: {
        ...existingRows[0],
        zone,
        customer_name: customerName,
        distance,
        pipe_size: pipeSize,
        items: JSON.stringify(safeItems),
      },
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const [existingRows] = await pool.query(
      `SELECT id, technician_id, technician_name, zone, customer_name, distance, pipe_size, items, created_at, updated_at
       FROM orders
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    if (!existingRows.length) {
      return res.status(404).json({ error: "Order not found" });
    }

    await pool.query("DELETE FROM orders WHERE id = ?", [id]);
    await logAudit({
      orderId: id,
      action: "delete",
      user: req.user,
      before: existingRows[0],
      after: null,
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
