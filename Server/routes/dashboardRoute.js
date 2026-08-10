const express = require("express");
const router = express.Router();

const {
    dashboard,
    getProgress,
    getTaskStatus,
    getUpcomingDeadlines,
    getTaskPriority
} = require("../controllers/dashboardController");




router.get(
    "/summary",
    dashboard
);


router.get(
    "/getprogress",
    getProgress
);


router.get(
    "/task-status",
    getTaskStatus
);


router.get(
    "/upcoming-deadlines",
    getUpcomingDeadlines
);


router.get(
    "/task-priority",
    getTaskPriority
);


module.exports = router;