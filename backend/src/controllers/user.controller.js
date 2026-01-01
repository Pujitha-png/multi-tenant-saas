const db = require("../config/db");

// PUT /api/users/:userId
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role, isActive } = req.body;
    const currentUser = req.user;

    // Fetch target user
    const userRes = await db.query(
      "SELECT id, tenant_id, role FROM users WHERE id = $1",
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRes.rows[0];

    // Authorization: self or tenant_admin
    if (
      currentUser.role !== "super_admin" &&
      currentUser.tenantId !== user.tenant_id &&
      currentUser.id !== userId
    ) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    // Normal user: update own fullName
    if (fullName && currentUser.id === userId) {
      fields.push(`full_name = $${idx++}`);
      values.push(fullName);
    }

    // Tenant-admin: can update fullName, role, isActive for users in same tenant
    if (currentUser.role === "tenant_admin" && currentUser.tenantId === user.tenant_id) {
      if (fullName && currentUser.id !== userId) {
        fields.push(`full_name = $${idx++}`);
        values.push(fullName);
      }
      if (role) {
        // Prevent changing another tenant-admin's role
        if (user.role === "tenant_admin") {
          return res.status(403).json({ success: false, message: "Cannot change role of another tenant-admin" });
        }
        fields.push(`role = $${idx++}`);
        values.push(role);
      }
      if (typeof isActive !== "undefined") {
        fields.push(`is_active = $${idx++}`);
        values.push(isActive);
      }
    }

    if (fields.length === 0) {
      return res.status(403).json({ success: false, message: "No fields allowed to update" });
    }

    // Add userId for WHERE clause
    values.push(userId);

    // Update query
    const query = `
      UPDATE users
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, full_name AS "fullName", role, updated_at AS "updatedAt"
    `;

    const result = await db.query(query, values);

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.tenant_id, currentUser.id, "Update User", "User", userId, req.ip || null]
    );

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });

  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /api/users/:userId
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Fetch the target user
    const userRes = await db.query(
      "SELECT id, tenant_id, role FROM users WHERE id = $1",
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = userRes.rows[0];

    // Authorization: tenant_admin only, cannot delete self
    if (currentUser.role !== "tenant_admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    if (currentUser.id === user.id) {
      return res.status(403).json({ success: false, message: "Cannot delete self" });
    }

    // Verify same tenant
    if (currentUser.tenantId !== user.tenant_id) {
      return res.status(403).json({ success: false, message: "Not authorized for this tenant" });
    }

    // Cascade delete / set assigned_to NULL in tasks
    await db.query(
      "UPDATE tasks SET assigned_to = NULL WHERE assigned_to = $1",
      [userId]
    );

    // Delete user
    await db.query("DELETE FROM users WHERE id = $1", [userId]);

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [user.tenant_id, currentUser.id, "Delete User", "User", userId, req.ip || null]
    );

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });

  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// src/controllers/user.controller.js

// GET /api/users → list all users in the tenant
const listUsers = async (req, res) => {
  try {
    const currentUser = req.user;

    const usersRes = await db.query(
      `SELECT id, full_name AS "fullName", email, role 
       FROM users 
       WHERE tenant_id = $1`,
      [currentUser.tenantId]
    );

    return res.status(200).json({
      success: true,
      data: { users: usersRes.rows }
    });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { updateUser, deleteUser, listUsers };



