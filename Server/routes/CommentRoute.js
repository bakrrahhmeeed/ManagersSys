const express = require("express");
const router = express.Router();
const authroizroles = require("../middleware/authorizeRoles")
const Roles = require("../constants/roles")

const {addcomment} = require("../controllers/CommentController")



router.post("/" ,authroizroles(Roles.ADMIN , Roles.DEPARTMENT_MANAGER , Roles.PROJECT_MANAGER) ,addcomment)






module.exports = router