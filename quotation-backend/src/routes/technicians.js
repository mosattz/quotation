import express from "express";
import pool from "../db.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT 
         u.id,
         u.name,
         u.email,
         u.phone,
         u.zone,
         u.created_at,
         COUNT(o.id) AS order_count
       FROM users u
       LEFT JOIN orders o ON o.technician_id = u.id
       WHERE u.role = 'technician'
       GROUP BY u.id
       ORDER BY u.created_at DESC`
    );
    return res.json(rows);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const [users] = await pool.query(
      `SELECT id, name, email, phone, zone, created_at
       FROM users
       WHERE id = ? AND role = 'technician'
       LIMIT 1`,
      [id]
    );
    if (!users.length) {
      return res.status(404).json({ error: "Technician not found" });
    }

    const [orders] = await pool.query(
      `SELECT id, created_at, zone, customer_name, distance, pipe_size, items
       FROM orders
       WHERE technician_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    return res.json({
      technician: users[0],
      orders,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
