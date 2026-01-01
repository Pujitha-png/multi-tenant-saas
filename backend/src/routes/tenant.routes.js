const express = require("express");
const router = express.Router();

const {
  getTenantDetails,
  updateTenant,
  listAllTenants,
  addUserToTenant,
  listTenantUsers,
} = require("../controllers/tenant.controller");

const authenticate = require("../middleware/auth.middleware");

router.get("/:tenantId", authenticate, getTenantDetails);

router.put("/:tenantId", authenticate, updateTenant);

router.get("/", authenticate, listAllTenants);

router.post("/:tenantId/users", authenticate, addUserToTenant);

router.get("/:tenantId/users", authenticate, listTenantUsers);

module.exports = router;
