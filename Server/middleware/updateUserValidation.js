const validateUpdateUser = (req, res, next) => {

    const {
        fullName,
        userName,
        Email,
        departmentId,
        branchId,
        IsActive
    } = req.body;

    if (fullName !== undefined) {
        if (fullName.trim() === "") {
            return res.status(400).json({
                message: "Full Name cannot be empty"
            });
        }
    }

    if (userName !== undefined) {
        if (userName.trim() === "") {
            return res.status(400).json({
                message: "User Name cannot be empty"
            });
        }
    }

    if (Email !== undefined) {

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(Email)) {
            return res.status(400).json({
                message: "Invalid Email"
            });
        }
    }

    if (departmentId !== undefined) {
        if (isNaN(departmentId)) {
            return res.status(400).json({
                message: "Department ID must be a number"
            });
        }
    }

    if (branchId !== undefined) {
        if (isNaN(branchId)) {
            return res.status(400).json({
                message: "Branch ID must be a number"
            });
        }
    }

    if (IsActive !== undefined) {
        if (typeof IsActive !== "boolean") {
            return res.status(400).json({
                message: "IsActive must be true or false"
            });
        }
    }

    next();
};

module.exports = validateUpdateUser;