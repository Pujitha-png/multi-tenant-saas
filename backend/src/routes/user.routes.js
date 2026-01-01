const express = require("express");
const router = express.Router();
const { updateUser, deleteUser, listUsers } = require("../controllers/user.controller");
const authenticate = require("../middleware/auth.middleware");

router.put("/:userId", authenticate, updateUser);
router.delete("/:userId", authenticate, deleteUser);
router.get("/", authenticate, listUsers);

module.exports = router;
