const express = require('express');
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");

const {getAllRisks,
    getRisk,
    createRisk,
    updateRisk,
    deleteRisk
} = require('../controllers/risksController');

router.get('/',authorizeRoles('administrator'), getAllRisks);
router.get("/:id",authorizeRoles('administrator'), getRisk);
router.post("/", authorizeRoles('administrator'), createRisk);
router.put("/:id" , authorizeRoles('administrator'), updateRisk);
router.delete("/:id", authorizeRoles('administrator'), deleteRisk);


module.exports = router;