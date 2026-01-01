const express = require("express");
const cors = require("cors");
const app = express();

// ✅ CORS (works both locally + Docker)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Parse JSON request bodies
app.use(express.json());

// Routes
const authRoutes = require("./routes/auth.routes");
const tenantRoutes = require("./routes/tenant.routes");
const userRoutes = require("./routes/user.routes");
const projectRoutes = require("./routes/project.routes");

app.use("/api/auth", authRoutes);
app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);

// ✅ MANDATORY Health Check (DB + Seed Data)
app.get("/api/health", async (req, res) => {
  try {
    const pool = require("./config/db");

    // 1️⃣ Check database connection
    await pool.query("SELECT 1");

    // 2️⃣ Check seed data exists (super admin)
    const seedCheck = await pool.query(
      "SELECT 1 FROM users WHERE email = 'superadmin@system.com' LIMIT 1"
    );

    // Seed not loaded yet
    if (seedCheck.rowCount === 0) {
      return res.status(503).json({
        status: "initializing",
        database: "connected",
      });
    }

    // Everything is ready
    return res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (err) {
    return res.status(500).json({
      status: "error",
      database: "disconnected",
    });
  }
});

module.exports = app;
