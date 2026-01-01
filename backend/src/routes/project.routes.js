const express = require("express");
const router = express.Router();
const { createProject, listProjects, updateProject, deleteProject, getProjectDetails } = require("../controllers/project.controller");
const authenticate = require("../middleware/auth.middleware");

router.post("/", authenticate, createProject);
router.get("/", authenticate, listProjects);
router.get("/:projectId", authenticate, getProjectDetails);
router.put("/:projectId", authenticate, updateProject);
router.delete("/:projectId", authenticate, deleteProject);
// Nested task routes under project
router.use('/:projectId/tasks', require('./task.routes'));

module.exports = router;