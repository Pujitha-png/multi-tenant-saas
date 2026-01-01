const db = require("../config/db");

// POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const currentUser = req.user;

    if (!name) {
      return res.status(400).json({ success: false, message: "Project name is required" });
    }

    // Get current number of projects for this tenant
    const countRes = await db.query(
      "SELECT COUNT(*) FROM projects WHERE tenant_id = $1",
      [currentUser.tenantId]
    );
    const projectCount = parseInt(countRes.rows[0].count);

    // Get tenant's maxProjects
    const tenantRes = await db.query(
      "SELECT max_projects FROM tenants WHERE id = $1",
      [currentUser.tenantId]
    );
    const maxProjects = tenantRes.rows[0].max_projects;

    if (projectCount >= maxProjects) {
      return res.status(403).json({ success: false, message: "Project limit reached" });
    }

    // Insert new project
    const insertRes = await db.query(
      `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id, tenant_id AS "tenantId", name, description, status, created_by AS "createdBy", created_at AS "createdAt"`,
      [currentUser.tenantId, name, description || null, status || "active", currentUser.id]
    );

    const project = insertRes.rows[0];

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [currentUser.tenantId, currentUser.id, "Create Project", "Project", project.id, req.ip || null]
    );

    return res.status(201).json({ success: true, data: project });
  } catch (err) {
    console.error("Create project error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// GET /api/projects
const listProjects = async (req, res) => {
  try {
    const currentUser = req.user;
    const statusFilter = req.query.status;
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.status,
        p.created_at AS "createdAt",
        json_build_object(
          'id', u.id,
          'fullName', u.full_name
        ) AS "createdBy",
        COALESCE(t.task_count,0) AS "taskCount",
        COALESCE(t.completed_task_count,0) AS "completedTaskCount"
      FROM projects p
      JOIN users u ON p.created_by = u.id
      LEFT JOIN (
        SELECT project_id,
               COUNT(*) AS task_count,
               COUNT(*) FILTER (WHERE status='completed') AS completed_task_count
        FROM tasks
        GROUP BY project_id
      ) t ON t.project_id = p.id
      WHERE p.tenant_id = $1
    `;

    const values = [currentUser.tenantId];
    let idx = 2;

    if (statusFilter) {
      query += ` AND p.status = $${idx++}`;
      values.push(statusFilter);
    }
    if (search) {
      query += ` AND LOWER(p.name) LIKE $${idx++}`;
      values.push(`%${search.toLowerCase()}%`);
    }

    // Total count for pagination
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM projects p
      WHERE p.tenant_id = $1
      ${statusFilter ? `AND p.status = '${statusFilter}'` : ""}
      ${search ? `AND LOWER(p.name) LIKE '%${search.toLowerCase()}%'` : ""}
    `;
    const countRes = await db.query(countQuery, [currentUser.tenantId]);
    const total = parseInt(countRes.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      data: {
        projects: result.rows,
        total,
        pagination: { currentPage: page, totalPages, limit }
      }
    });

  } catch (err) {
    console.error("List projects error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/projects/:projectId
const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, status } = req.body;
    const currentUser = req.user;

    const projectRes = await db.query(
      "SELECT id, tenant_id, created_by FROM projects WHERE id = $1",
      [projectId]
    );
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }
    const project = projectRes.rows[0];

    if (project.tenant_id !== currentUser.tenantId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (currentUser.role !== "tenant_admin" && currentUser.id !== project.created_by) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (name) { fields.push(`name = $${idx++}`); values.push(name); }
    if (description) { fields.push(`description = $${idx++}`); values.push(description); }
    if (status) {
      if (!["active","archived","completed"].includes(status)) {
        return res.status(400).json({ success:false, message:"Invalid status value" });
      }
      fields.push(`status = $${idx++}`); values.push(status);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success:false, message:"No fields provided to update" });
    }

    values.push(projectId);
    const updateQuery = `
      UPDATE projects
      SET ${fields.join(", ")}, updated_at = NOW()
      WHERE id = $${idx}
      RETURNING id, name, description, status, updated_at AS "updatedAt"
    `;
    const result = await db.query(updateQuery, values);

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (tenant_id,user_id,action,entity_type,entity_id,ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [currentUser.tenantId, currentUser.id, "Update Project", "Project", projectId, req.ip || null]
    );

    return res.status(200).json({ success:true, message:"Project updated successfully", data: result.rows[0] });

  } catch (err) {
    console.error("Update project error:", err);
    return res.status(500).json({ success:false, message:"Internal server error" });
  }
};

// DELETE /api/projects/:projectId
const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    // Fetch project
    const projectRes = await db.query(
      "SELECT id, tenant_id, created_by FROM projects WHERE id = $1",
      [projectId]
    );
    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success:false, message:"Project not found" });
    }
    const project = projectRes.rows[0];

    // Authorization: same tenant
    if (project.tenant_id !== currentUser.tenantId) {
      return res.status(403).json({ success:false, message:"Not authorized" });
    }

    // Authorization: tenant_admin OR creator
    if (currentUser.role !== "tenant_admin" && currentUser.id !== project.created_by) {
      return res.status(403).json({ success:false, message:"Not authorized" });
    }

    // Delete tasks associated with this project (cascade)
    await db.query("DELETE FROM tasks WHERE project_id = $1", [projectId]);

    // Delete project
    await db.query("DELETE FROM projects WHERE id = $1", [projectId]);

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (tenant_id,user_id,action,entity_type,entity_id,ip_address)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [currentUser.tenantId, currentUser.id, "Delete Project", "Project", projectId, req.ip || null]
    );

    return res.status(200).json({ success:true, message:"Project deleted successfully" });

  } catch (err) {
    console.error("Delete project error:", err);
    return res.status(500).json({ success:false, message:"Internal server error" });
  }
};

// GET /api/projects/:id
const getProjectDetails = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;

    const projectRes = await db.query(
      `SELECT 
         p.id,
         p.name,
         p.description,
         p.status,
         p.created_at AS "createdAt",
         json_build_object('id', u.id, 'fullName', u.full_name) AS "createdBy",
         COALESCE(t.task_count,0) AS "taskCount",
         COALESCE(t.completed_task_count,0) AS "completedTaskCount"
       FROM projects p
       JOIN users u ON p.created_by = u.id
       LEFT JOIN (
         SELECT project_id,
                COUNT(*) AS task_count,
                COUNT(*) FILTER (WHERE status='completed') AS completed_task_count
         FROM tasks
         GROUP BY project_id
       ) t ON t.project_id = p.id
       WHERE p.id = $1 AND p.tenant_id = $2`,
      [projectId, currentUser.tenantId]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success:false, message:"Project not found" });
    }

    return res.status(200).json({ success:true, data: projectRes.rows[0] });

  } catch (err) {
    console.error("Get project details error:", err);
    return res.status(500).json({ success:false, message:"Internal server error" });
  }
};

module.exports = { createProject, listProjects, updateProject, deleteProject, getProjectDetails };
