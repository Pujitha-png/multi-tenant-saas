const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_key";

/**
 * POST /api/auth/register-tenant
 */
async function registerTenant(req, res) {
  try {
    const {
      tenantName,
      subdomain,
      adminEmail,
      adminPassword,
      adminFullName,
    } = req.body;

    // Basic validation
    if (
      !tenantName ||
      !subdomain ||
      !adminEmail ||
      !adminPassword ||
      !adminFullName
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Check tenant exists
    const tenantExists = await db.query(
      "SELECT id FROM tenants WHERE subdomain = $1",
      [subdomain]
    );

    if (tenantExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Subdomain already exists",
      });
    }

    // Check admin email exists
    const emailExists = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [adminEmail]
    );

    if (emailExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Admin email already exists",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Transaction
    await db.query("BEGIN");

    // Create tenant
    const tenantResult = await db.query(
      `
      INSERT INTO tenants (name, subdomain, subscription_plan, max_users, max_projects)
      VALUES ($1, $2, 'free', 5, 3)
      RETURNING id, subdomain
      `,
      [tenantName, subdomain]
    );

    const tenant = tenantResult.rows[0];

    // Create admin user
    const userResult = await db.query(
      `
      INSERT INTO users (tenant_id, email, full_name, password_hash, role)
      VALUES ($1, $2, $3, $4, 'tenant_admin')
      RETURNING id, email, full_name, role
      `,
      [tenant.id, adminEmail, adminFullName, passwordHash]
    );

    await db.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Tenant registered successfully",
      data: {
        tenantId: tenant.id,
        subdomain: tenant.subdomain,
        adminUser: userResult.rows[0],
      },
    });
  } catch (error) {
    await db.query("ROLLBACK");
    console.error("Register tenant error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password, tenantSubdomain } = req.body;

  if (!email || !password || !tenantSubdomain) {
    return res.status(400).json({
      success: false,
      message: "Email, password and tenantSubdomain are required",
    });
  }

  try {
    const tenantResult = await db.query(
      "SELECT id FROM tenants WHERE subdomain = $1",
      [tenantSubdomain]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const tenantId = tenantResult.rows[0].id;

    const userResult = await db.query(
      `
      SELECT id, email, full_name, role, password_hash
      FROM users
      WHERE email = $1 AND tenant_id = $2
      `,
      [email, tenantId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = jwt.sign(
      { userId: user.id, tenantId, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId,
        },
        token,
        expiresIn: 86400,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}




const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.user.tenantId;

    const userResult = await db.query(
      `SELECT id, email, full_name, role
       FROM users
       WHERE id = $1 AND tenant_id = $2`,
      [userId, tenantId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId,
      },
    });
  } catch (err) {
    console.error("Get current user error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Optional: log action in audit_logs
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action)
       VALUES ($1, $2, $3)`,
      [tenantId, userId, "logout"]
    );

    // Since JWT is stateless, just return success
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  registerTenant,
  login,
  getCurrentUser,
  logout,
};
