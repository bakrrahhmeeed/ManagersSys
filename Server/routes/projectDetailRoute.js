const express = require("express");
const router = express.Router();

const { projectdetails } = require("../controllers/projectDetailcontrol");

router.get("/project/:id/details",projectdetails);

module.exports = router;