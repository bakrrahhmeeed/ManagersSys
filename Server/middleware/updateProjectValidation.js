const validateUpdateProject = (req, res, next) => {
    const {
        projectType,
        priorityLevel,
        status,
        startDate,
        targetEndDate,
        sponsorId,
        projectManagerId,
        departmentId,
        isStrategic,
    } = req.body;

    if (projectType) {
        const validTypes = ["Internal", "External"];

        if (!validTypes.includes(projectType)) {
            return res.status(400).json({
                message: "Invalid Project Type",
            });
        }
    }

    if (priorityLevel) {
        const validPriorities = [
            "Low",
            "Medium",
            "High",
            "Critical",
        ];

        if (!validPriorities.includes(priorityLevel)) {
            return res.status(400).json({
                message: "Invalid Priority Level",
            });
        }
    }

    if (status) {
        const validStatus = [
            "Not Started",
            "In Progress",
            "Completed",
            "On Hold",
            "Cancelled",
            "Planning"
        ];

        if (!validStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid Status",
            });
        }
    }

    if (startDate && targetEndDate) {
        if (new Date(targetEndDate) < new Date(startDate)) {
            return res.status(400).json({
                message: "Target End Date must be after Start Date",
            });
        }
    }



    if (projectManagerId && !Number.isInteger(Number(projectManagerId))) {
        return res.status(400).json({
            message: "Project Manager ID must be a number",
        });
    }

    if (departmentId && !Number.isInteger(Number(departmentId))) {
        return res.status(400).json({
            message: "Department ID must be a number",
        });
    }

    if (
        isStrategic !== undefined &&
        typeof isStrategic !== "boolean"
    ) {
        return res.status(400).json({
            message: "Is Strategic must be true or false",
        });
    }

    next();
};

module.exports = validateUpdateProject;