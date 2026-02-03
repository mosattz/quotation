import express from "express";
import pool from "../db.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         j.id,
         j.created_at,
         u.name AS technician_name,
         j.zone,
         c.name AS customer_name,
         j.distance,
         j.pipe_size,
         (SELECT COUNT(*) FROM job_items ji WHERE ji.job_id = j.id) AS item_count
       FROM jobs j
       LEFT JOIN users u ON u.id = j.technician_id
       LEFT JOIN customers c ON c.id = j.customer_id
       ORDER BY j.created_at DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id/items", requireAuth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         ji.id,
         p.name,
         p.unit,
         ji.quantity AS qty,
         ji.unit_price AS price_vat
       FROM job_items ji
       LEFT JOIN products p ON p.id = ji.product_id
       WHERE ji.job_id = ?
       ORDER BY ji.id ASC`,
      [req.params.id]
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  const { technicianName, zone, customerName, distance, pipeSize, items } =
    req.body || {};

  if (!technicianName || !zone || !customerName || !distance || !pipeSize) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [customerRows] = await connection.query(
      "SELECT id FROM customers WHERE name = ? LIMIT 1",
      [customerName]
    );
    let customerId = customerRows[0]?.id;
    if (!customerId) {
      const [customerResult] = await connection.query(
        "INSERT INTO customers (name) VALUES (?)",
        [customerName]
      );
      customerId = customerResult.insertId;
    }

    const [result] = await connection.query(
      "INSERT INTO jobs (customer_id, technician_id, zone, distance, pipe_size, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
      [customerId, req.user.id, zone, distance, pipeSize]
    );
    const jobId = result.insertId;

    const safeItems = Array.isArray(items) ? items : [];
    for (const item of safeItems) {
      if (!item?.name) continue;
      const [productRows] = await connection.query(
        "SELECT id, unit, price FROM products WHERE LOWER(name) = LOWER(?) LIMIT 1",
        [item.name]
      );
      let productId = productRows[0]?.id || null;
      let unitPrice = Number(item.price || productRows[0]?.price || 0);

      if (!productId) {
        const [productResult] = await connection.query(
          "INSERT INTO products (name, unit, price) VALUES (?, ?, ?)",
          [item.name, item.unit || null, unitPrice || null]
        );
        productId = productResult.insertId;
      }

      const quantity = Number(item.qty || 0);
      const totalPrice = unitPrice ? unitPrice * quantity : null;

      await connection.query(
        "INSERT INTO job_items (job_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)",
        [jobId, productId, quantity, unitPrice || null, totalPrice]
      );
    }

    await connection.commit();
    return res.status(201).json({ id: jobId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  } finally {
    connection.release();
  }
});

export default router;
