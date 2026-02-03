import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import pool from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const [rows] = await pool.query(
      "SELECT id, email, password, role, name, phone, zone FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        phone: user.phone || "",
        zone: user.zone || "",
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/register", async (req, res) => {
  const { name, email, password, phone, zone } = req.body || {};
  if (!name || !email || !password || !phone || !zone) {
    return res
      .status(400)
      .json({ error: "Name, email, password, phone, and zone required" });
  }

  try {
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      [email]
    );
    if (existing.length) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, role, phone, zone) VALUES (?, ?, ?, 'technician', ?, ?)",
      [name, email.toLowerCase(), passwordHash, phone, zone]
    );

    const token = jwt.sign(
      { id: result.insertId, email: email.toLowerCase(), role: "technician", name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    return res.status(201).json({
      token,
      user: {
        id: result.insertId,
        email: email.toLowerCase(),
        role: "technician",
        name,
        phone,
        zone,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
