const dashboardService = require("../services/dashboardService");

const dashboard = async (req, res, next) => {
    try {
        const result = await dashboardService.dashboard(req.user);

        res.status(200).json(result);

    } catch (err) {
        next(err);
    }
};


const getProgress = async (req, res, next) => {
    try {
        const result = await dashboardService.getProgress(req.user);

        res.status(200).json(result);

    } catch (err) {
        next(err);
    }
};


const getTaskStatus = async (req, res, next) => {
    try {
        const result = await dashboardService.getTaskStatus(req.user);

        res.status(200).json(result);

    } catch (err) {
        next(err);
    }
};


const getUpcomingDeadlines = async (req, res, next) => {
    try {
        const result =
            await dashboardService.getUpcomingDeadlines(req.user);

        res.status(200).json(result);

    } catch (err) {
        next(err);
    }
};


const getTaskPriority = async (req, res, next) => {
    try {
        const result =
            await dashboardService.getTaskPriority(req.user);

        res.status(200).json(result);

    } catch (err) {
        next(err);
    }
};


module.exports = {
    dashboard,
    getProgress,
    getTaskStatus,
    getUpcomingDeadlines,
    getTaskPriority
};