const validateCreateProject = (req, res, next) => {
    const {
        projectName,
        projectDescription,
        projectType,
        priorityLevel,
        status,
        startDate,
        targetEndDate,
        projectManagerId,
        departmentIds,
        isStrategic,
    } = req.body;

    if (!projectName || projectName.trim() === "") {
        return res.status(400).json({
            message: "Project Name is required",
        });
    }

    if (!projectDescription || projectDescription.trim() === "") {
        return res.status(400).json({
            message: "Project Description is required",
        });
    }

    if (!projectType || projectType.trim() === "") {
        return res.status(400).json({
            message: "Project Type is required",
        });
    }

    const validTypes = ["Internal", "External" , "Business"];

    if (!validTypes.includes(projectType)) {
        return res.status(400).json({
            message: "Invalid Project Type",
        });
    }

    const validPriorities = ["Low", "Medium", "High", "Critical"];

    if (!validPriorities.includes(priorityLevel)) {
        return res.status(400).json({
            message: "Invalid Priority Level",
        });
    }

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

    if (!startDate)
        return res.status(400).json({ message: "Start Date is required" });

    if (!targetEndDate)
        return res.status(400).json({ message: "Target End Date is required" });

    if (new Date(targetEndDate) < new Date(startDate)) {
        return res.status(400).json({
            message: "Target End Date must be after Start Date",
        });
    }


    if (!Number.isInteger(Number(projectManagerId)))
        return res.status(400).json({
            message: "Project Manager ID must be a number",
        });

if (
    !Array.isArray(departmentIds) ||
    !departmentIds.every(id => Number.isInteger(Number(id)))
) {
    return res.status(400).json({
        message: "Department IDs must be an array of numbers",
    });
}

    if (typeof isStrategic !== "boolean") {
        return res.status(400).json({
            message: "Is Strategic must be true or false",
        });
    }

    next();
};

module.exports = validateCreateProject;