const db = require("../config/db");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const getTenantDetails = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role } = req.user;

    if (role !== "super_admin" && tenantId !== userTenantId) {
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const tenantResult = await db.query(
      `SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at
       FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Tenant not found" });
    }

    const tenant = tenantResult.rows[0];

    const [usersResult, projectsResult, tasksResult] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE tenant_id = $1", [tenantId]),
      db.query("SELECT COUNT(*) FROM projects WHERE tenant_id = $1", [tenantId]),
      db.query("SELECT COUNT(*) FROM tasks WHERE tenant_id = $1", [tenantId]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        ...tenant,
        stats: {
          totalUsers: parseInt(usersResult.rows[0].count),
          totalProjects: parseInt(projectsResult.rows[0].count),
          totalTasks: parseInt(tasksResult.rows[0].count),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { tenantId: userTenantId, role } = req.user;
    const { name, status, subscriptionPlan, maxUsers, maxProjects } = req.body;

    if (role !== "super_admin" && tenantId !== userTenantId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (role === "tenant_admin" && (status || subscriptionPlan || maxUsers || maxProjects)) {
      return res.status(403).json({ success: false, message: "Cannot update restricted fields" });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (status && role === "super_admin") { fields.push(`status = $${idx++}`); values.push(status); }
    if (subscriptionPlan && role === "super_admin") { fields.push(`subscription_plan = $${idx++}`); values.push(subscriptionPlan); }
    if (maxUsers && role === "super_admin") { fields.push(`max_users = $${idx++}`); values.push(maxUsers); }
    if (maxProjects && role === "super_admin") { fields.push(`max_projects = $${idx++}`); values.push(maxProjects); }

    if (!fields.length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    values.push(tenantId);

    const result = await db.query(
      `UPDATE tenants SET ${fields.join(", ")}, updated_at = NOW()
       WHERE id = $${idx}
       RETURNING id, name, updated_at`,
      values
    );

    return res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const listAllTenants = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    let { page = 1, limit = 10, status, subscriptionPlan } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const filters = [];
    const values = [];
    let idx = 1;

    if (status) { filters.push(`status = $${idx++}`); values.push(status); }
    if (subscriptionPlan) { filters.push(`subscription_plan = $${idx++}`); values.push(subscriptionPlan); }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const tenantsResult = await db.query(
      `SELECT id, name, subdomain, status, subscription_plan, created_at
       FROM tenants ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...values, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM tenants ${whereClause}`,
      values
    );

    return res.status(200).json({
      success: true,
      data: {
        tenants: tenantsResult.rows,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult.rows[0].count / limit),
          totalTenants: parseInt(countResult.rows[0].count),
          limit,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const addUserToTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { email, password, fullName, role } = req.body;
    const currentUser = req.user;

    if (currentUser.role !== "tenant_admin" || currentUser.tenantId !== tenantId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const tenantRes = await db.query(
      "SELECT max_users FROM tenants WHERE id = $1",
      [tenantId]
    );

    const userCountRes = await db.query(
      "SELECT COUNT(*) FROM users WHERE tenant_id = $1",
      [tenantId]
    );

    if (parseInt(userCountRes.rows[0].count) >= tenantRes.rows[0].max_users) {
      return res.status(403).json({ success: false, message: "Subscription user limit reached" });
    }

    const emailRes = await db.query(
      "SELECT 1 FROM users WHERE tenant_id = $1 AND email = $2",
      [tenantId, email]
    );

    if (emailRes.rows.length) {
      return res.status(409).json({ success: false, message: "Email already exists in this tenant" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.query(
      `INSERT INTO users (id, tenant_id, email, full_name, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,true,now(),now())
       RETURNING id, email, full_name AS "fullName", role,
       tenant_id AS "tenantId", is_active AS "isActive", created_at AS "createdAt"`,
      [uuidv4(), tenantId, email, fullName, hashedPassword, role || "user"]
    );

    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [tenantId, currentUser.userId, "Add User", "User", newUser.rows[0].id, req.ip]
    );

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const listTenantUsers = async (req, res) => {
  try {
    const { tenantId } = req.params;
    if (tenantId !== req.user.tenantId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    let { search, role, page = 1, limit = 50 } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 100) limit = 100;
    const offset = (page - 1) * limit;

    const filters = ["tenant_id = $1"];
    const values = [tenantId];
    let idx = 2;

    if (search) {
      filters.push(`(email ILIKE $${idx} OR full_name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx++;
    }

    if (role) {
      filters.push(`role = $${idx}`);
      values.push(role);
      idx++;
    }

    const whereClause = `WHERE ${filters.join(" AND ")}`;

    const usersResult = await db.query(
      `SELECT id, email, full_name AS "fullName", role,
       is_active AS "isActive", created_at AS "createdAt"
       FROM users ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      values
    );

    return res.status(200).json({
      success: true,
      data: {
        users: usersResult.rows,
        total: parseInt(countResult.rows[0].count),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult.rows[0].count / limit),
          limit,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getTenantDetails,
  updateTenant,
  listAllTenants,
  addUserToTenant,
  listTenantUsers,
};
