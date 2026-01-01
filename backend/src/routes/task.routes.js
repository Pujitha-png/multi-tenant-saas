const express = require('express');
const router = express.Router({ mergeParams: true });
const auth = require('../middleware/auth.middleware');
const taskController = require('../controllers/task.controller');

// API 16 & 17: Task under project
router.post('/', auth, taskController.createTask);
router.get('/', auth, taskController.listTasks);
// API 18 & 19: Task by taskId
router.patch('/:taskId/status', auth, taskController.updateTaskStatus);
router.put('/:taskId', auth, taskController.updateTask);
router.delete('/:taskId', auth, taskController.deleteTask);
module.exports = router;
