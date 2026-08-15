const express = require("express");
const router = express.Router();
const authorizeRoles = require("../middleware/authorizeRoles")
const validateCreateUser = require("../middleware/validateCreateUser");
const updateuservalidation = require("../middleware/updateUserValidation")
const Roles = require("../constants/roles")

const { 
    getuser , addUser , updateUser , deleteUser , getuserById , updateUserPss , getProjectmanagers , getUsersByDepartment
} = require("../controllers/userController");
const { getRounds } = require("bcrypt");

router.get("/",authorizeRoles(
    Roles.ADMIN,
    Roles.DEPARTMENT_MANAGER,
    Roles.PMO_MANAGER
), getuser);

router.get("/projectmanagers", getProjectmanagers) 

router.get("/:id",authorizeRoles(
    Roles.ADMIN,
    Roles.DEPARTMENT_MANAGER,
    Roles.PMO_MANAGER
), getuserById);

router.post("/",authorizeRoles(
    Roles.ADMIN
),validateCreateUser,addUser);

router.put("/:id",authorizeRoles(
    Roles.ADMIN,
    Roles.SECRETARY
),updateuservalidation,updateUser);

router.put("/pass/:id",updateUserPss);

router.delete("/deletuser/:id", authorizeRoles(Roles.ADMIN),deleteUser);

router.get(

    "/department/:departmentId",

    getUsersByDepartment

);


module.exports = router;


