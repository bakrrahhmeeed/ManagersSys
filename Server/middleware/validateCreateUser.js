const validateCreateUser = (req, res, next) => {
    const {
        fullName,
        userName,
        Email,
        Password,
        departmentId,
        branchId,
        IsActive,
        role
    } = req.body;

    // Required Fields
    if (!fullName || fullName.trim() === "") {
        return res.status(400).json({
            message: "Full Name is required"
        });
    }

    if (!userName || userName.trim() === "") {
        return res.status(400).json({
            message: "User Name is required"
        });
    }

    if (!Email || Email.trim() === "") {
        return res.status(400).json({
            message: "Email is required"
        });
    }

    if (!Password || Password.trim() === "") {
        return res.status(400).json({
            message: "Password is required"
        });
    }

    if (departmentId === undefined || departmentId === null) {
        return res.status(400).json({
            message: "Department ID is required"
        });
    }

    if (branchId === undefined || branchId === null) {
        return res.status(400).json({
            message: "Branch ID is required"
        });
    }

    if (IsActive === undefined) {
        return res.status(400).json({
            message: "IsActive is required"
        });
    }

    if (role === undefined || role === null) {

    return res.status(400).json({

        message: "Role is required"

    });

}

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(Email)) {
        return res.status(400).json({
            message: "Invalid Email"
        });
    }

    if (Password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        });
    }

    if (isNaN(departmentId)) {
        return res.status(400).json({
            message: "Department ID must be a number"
        });
    }

    if (isNaN(branchId)) {
        return res.status(400).json({
            message: "Branch ID must be a number"
        });
    }

    if (isNaN(role)) {

    return res.status(400).json({

        message: "Role must be a number"

    });

}

    if (typeof IsActive !== "boolean") {
        return res.status(400).json({
            message: "IsActive must be true or false"
        });
    }

    next();
};

module.exports = validateCreateUser;