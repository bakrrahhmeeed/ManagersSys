const express = require('express');
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");



const {getAllStages,
    createStage,
    updateStage,
    deleteStage,
    getStage
} = require('../controllers/stageController');



router.get('/', authorizeRoles("Administrator"), getAllStages);
router.post('/', authorizeRoles("Administrator"), createStage);
router.put('/:id', authorizeRoles("Administrator"), updateStage);
router.delete('/:id', authorizeRoles("Administrator"), deleteStage);
router.get('/:id',authorizeRoles("Administrator"), getStage);


module.exports = router;