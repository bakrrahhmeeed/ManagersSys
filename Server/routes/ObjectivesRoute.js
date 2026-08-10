const express = require("express");
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");

const {getObjectives , getObjective , createObjective} = require('../controllers/ObjectivesController');


router.get("/",getObjectives),
router.get("/:id",getObjective);
router.post("/",  createObjective);
// router.put("/:id", authorizeRoles("Administrator"), updateObjective);
// router.delete("/:id", authorizeRoles("Administrator"), deleteObjective);

module.exports = router;