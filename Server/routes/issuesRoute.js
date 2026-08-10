const express = require("express");
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles");
const {getissues , getissue , createissue , updateIssue , deleteIssue} = require('../controllers/issuesController');
const Roles = require("../constants/roles")



router.get("/",getissues),
router.get("/:id",getissue),
router.post("/",createissue),
router.put("/:id",updateIssue),
router.delete("/:id",authorizeRoles(Roles.ADMIN),deleteIssue)


module.exports = router;