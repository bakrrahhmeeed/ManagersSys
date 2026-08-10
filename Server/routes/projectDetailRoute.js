const express = require("express");
const router = express.Router();

const { projectdetails } = require("../controllers/projectDetailcontrol");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");

router.get("/project/:id/details",projectdetails);

module.exports = router;