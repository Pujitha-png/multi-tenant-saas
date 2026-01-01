const db = require('../config/db'); // your PostgreSQL client
const { v4: uuidv4 } = require('uuid');

/**
 * API 16: Create Task
 * POST /api/projects/:projectId/tasks
 */
const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const currentUser = req.user;

    if (!title) {
      return res.status(400).json({ success: false, message: "Task title is required" });
    }

    // Verify project
    const projectRes = await db.query(
      "SELECT tenant_id FROM projects WHERE id = $1",
      [projectId]
    );

    if (projectRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    if (projectRes.rows[0].tenant_id !== currentUser.tenantId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Verify assigned user
    if (assignedTo) {
      const userRes = await db.query(
        "SELECT tenant_id FROM users WHERE id = $1",
        [assignedTo]
      );

      if (
        userRes.rows.length === 0 ||
        userRes.rows[0].tenant_id !== currentUser.tenantId
      ) {
        return res.status(400).json({
          success: false,
          message: "Assigned user does not belong to your tenant"
        });
      }
    }

    const insertRes = await db.query(
      `
      INSERT INTO tasks (
        id,
        project_id,
        tenant_id,
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING
        id,
        project_id AS "projectId",
        tenant_id AS "tenantId",
        title,
        description,
        status,
        priority,
        assigned_to AS "assignedTo",
        due_date AS "dueDate",
        created_at AS "createdAt"
      `,
      [
        uuidv4(),
        projectId,
        currentUser.tenantId,
        title,
        description || null,
        "todo",
        priority || "medium",
        assignedTo || null,
        dueDate || null
      ]
    );

    return res.status(201).json({
      success: true,
      data: insertRes.rows[0]
    });

  } catch (err) {
    console.error("Create task error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


/**
 * API 17: List Project Tasks
 * GET /api/projects/:projectId/tasks
 */
const listTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const currentUser = req.user;
    const { status, assignedTo, priority, search = '', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify project belongs to tenant
    const projectRes = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
    if (projectRes.rows.length === 0) return res.status(404).json({ success: false, message: "Project not found" });
    if (projectRes.rows[0].tenant_id !== currentUser.tenantId) return res.status(403).json({ success: false, message: "Project doesn't belong to your tenant" });

    let query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.due_date AS "dueDate",
        t.created_at AS "createdAt",
        json_build_object('id', u.id, 'fullName', u.full_name, 'email', u.email) AS "assignedTo"
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.project_id = $1
    `;
    const values = [projectId];
    let idx = 2;

    if (status) { query += ` AND t.status = $${idx++}`; values.push(status); }
    if (assignedTo) { query += ` AND t.assigned_to = $${idx++}`; values.push(assignedTo); }
    if (priority) { query += ` AND t.priority = $${idx++}`; values.push(priority); }
    if (search) { query += ` AND LOWER(t.title) LIKE $${idx++}`; values.push(`%${search.toLowerCase()}%`); }

    // Total count for pagination
    const countRes = await db.query(`SELECT COUNT(*) AS total FROM tasks t WHERE t.project_id = $1`, [projectId]);
    const total = parseInt(countRes.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    query += ` ORDER BY t.priority DESC, t.due_date ASC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    const tasksRes = await db.query(query, values);

    return res.status(200).json({
      success: true,
      data: { tasks: tasksRes.rows, total, pagination: { currentPage: parseInt(page), totalPages, limit: parseInt(limit) } }
    });

  } catch (err) {
    console.error("List tasks error:", err);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**
 * API 18: Update Task Status
 * PATCH /api/tasks/:taskId/status
 */
const updateTaskStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;
    const currentUser = req.user;

    if (!["todo","in_progress","completed"].includes(status)) return res.status(400).json({ success:false, message:"Invalid status" });

    const taskRes = await db.query('SELECT tenant_id FROM tasks WHERE id = $1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ success:false, message:"Task not found" });
    if (taskRes.rows[0].tenant_id !== currentUser.tenantId) return res.status(403).json({ success:false, message:"Task doesn't belong to your tenant" });

    const updateRes = await db.query(
      'UPDATE tasks SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id, status, updated_at AS "updatedAt"',
      [status, taskId]
    );

    return res.status(200).json({ success:true, data: updateRes.rows[0] });

  } catch (err) {
    console.error("Update task status error:", err);
    return res.status(500).json({ success:false, message:"Internal server error" });
  }
};

/**
 * API 19: Update Task
 * PUT /api/tasks/:taskId
 */
const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate } = req.body;
    const currentUser = req.user;

    const taskRes = await db.query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
    if (taskRes.rows.length === 0) return res.status(404).json({ success:false, message:"Task not found" });
    if (taskRes.rows[0].tenant_id !== currentUser.tenantId) return res.status(403).json({ success:false, message:"Task doesn't belong to your tenant" });

    // If assignedTo provided, verify same tenant
    if (assignedTo) {
      const userRes = await db.query('SELECT tenant_id FROM users WHERE id=$1', [assignedTo]);
      if (userRes.rows.length===0 || userRes.rows[0].tenant_id!==currentUser.tenantId) {
        return res.status(400).json({ success:false, message:"Assigned user doesn't belong to your tenant" });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    if (title!==undefined) { fields.push(`title=$${idx++}`); values.push(title); }
    if (description!==undefined) { fields.push(`description=$${idx++}`); values.push(description); }
    if (status!==undefined) { 
      if (!["todo","in_progress","completed"].includes(status)) return res.status(400).json({ success:false, message:"Invalid status" });
      fields.push(`status=$${idx++}`); values.push(status); 
    }
    if (priority!==undefined) { 
      if (!["low","medium","high"].includes(priority)) return res.status(400).json({ success:false, message:"Invalid priority" });
      fields.push(`priority=$${idx++}`); values.push(priority); 
    }
    if (assignedTo!==undefined) { fields.push(`assigned_to=$${idx++}`); values.push(assignedTo || null); }
    if (dueDate!==undefined) { fields.push(`due_date=$${idx++}`); values.push(dueDate || null); }

    if (fields.length===0) return res.status(400).json({ success:false, message:"No fields to update" });

    values.push(taskId);
    const query = `UPDATE tasks SET ${fields.join(", ")}, updated_at=NOW() WHERE id=$${idx} RETURNING id, title, description, status, priority, assigned_to AS "assignedTo", due_date AS "dueDate", updated_at AS "updatedAt"`;
    const updateRes = await db.query(query, values);

    // TODO: optionally join assignedTo user info like in listTasks
    return res.status(200).json({ success:true, message:"Task updated successfully", data:updateRes.rows[0] });

  } catch (err) {
    console.error("Update task error:", err);
    return res.status(500).json({ success:false, message:"Internal server error" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const currentUser = req.user;

    const taskRes = await db.query('SELECT tenant_id FROM tasks WHERE id=$1', [taskId]);
    if (taskRes.rows.length === 0)
      return res.status(404).json({ success:false, message:"Task not found" });

    if (taskRes.rows[0].tenant_id !== currentUser.tenantId)
      return res.status(403).json({ success:false, message:"Task doesn't belong to your tenant" });

    await db.query('DELETE FROM tasks WHERE id=$1', [taskId]);

    return res.status(200).json({ success:true, message:"Task deleted successfully" });

  } catch (err) {
    console.error("Delete task error:", err);
    return res.status(500).json({ success:false, message:"Internal server error" });
  }
};

module.exports = { createTask, listTasks, updateTaskStatus, updateTask, deleteTask };

