const express = require("express");
const router = express.Router();

const { registerTenant, login, getCurrentUser, logout } = require("../controllers/auth.controller");
const  authenticate  = require("../middleware/auth.middleware");


// Tenant registration
router.post("/register-tenant", registerTenant);

// Login
router.post("/login", login);

// Get current logged-in user
router.get("/me", authenticate, getCurrentUser);

// Logout
router.post("/logout", authenticate, logout);

module.exports = router;
