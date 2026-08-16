import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaArrowLeft,
    FaUserPlus,
    FaSave,
    FaTimes,
} from "react-icons/fa";

import DashboardLayout from "../layouts/DashboardLayout";
import { createUser } from "../services/userService";
import { getDepartments } from "../services/departmentservice";

import "../styles/createUser.css";

const initialForm = {
    fullName: "",
    userName: "",
    Email: "",
    Password: "",
    departmentId: "",
    branchId: "",
    IsActive: true,
    role: "",
};

function CreateUser() {
    const navigate = useNavigate();

    const [form, setForm] = useState(initialForm);
    const [departments, setDepartments] = useState([]);

    const [loadingDepartments, setLoadingDepartments] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const loadDepartments = async () => {
            try {
                const data = await getDepartments();

                setDepartments(
                    Array.isArray(data) ? data : []
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingDepartments(false);
            }
        };

        loadDepartments();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!form.fullName.trim()) {
            setError("Full Name is required.");
            return;
        }

        if (!form.userName.trim()) {
            setError("User Name is required.");
            return;
        }

        if (!form.Email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.Email)) {
            setError("Invalid Email.");
            return;
        }

        if (!form.Password) {
            setError("Password is required.");
            return;
        }

        if (form.Password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        if (!form.departmentId) {
            setError("Department ID is required.");
            return;
        }

        if (!form.branchId) {
            setError("Branch ID is required.");
            return;
        }

        if (!form.role) {
            setError("Role ID is required.");
            return;
        }

        try {
            setSaving(true);

            await createUser({
                fullName: form.fullName.trim(),
                userName: form.userName.trim(),
                Email: form.Email.trim(),
                Password: form.Password,
                departmentId: Number(form.departmentId),
                branchId: Number(form.branchId),
                IsActive: Boolean(form.IsActive),
                role: Number(form.role),
            });

            setSuccess("User created successfully.");

            setTimeout(() => {
                navigate("/users");
            }, 700);

        } catch (err) {
            console.error("Create user error:", err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to create user."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>

            <div className="create-user-page">

                <div className="create-user-topbar">

                    <button
                        className="create-user-back"
                        onClick={() => navigate("/users")}
                    >
                        <FaArrowLeft />
                        Back to Users
                    </button>

                </div>

                <section className="create-user-card">

                    <div className="create-user-header">

                        <div className="create-user-icon">
                            <FaUserPlus />
                        </div>

                        <div>
                            <h1>Create User</h1>

                            <p>
                                Add a new user to the system.
                            </p>
                        </div>

                    </div>

                    {error && (
                        <div className="user-form-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="user-form-success">
                            {success}
                        </div>
                    )}

                    <form
                        className="user-form"
                        onSubmit={handleSubmit}
                    >

                        <div className="user-form-grid">

                            <div className="user-form-group">
                                <label>
                                    Full Name
                                </label>

                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter full name"
                                />
                            </div>

                            <div className="user-form-group">
                                <label>
                                    Username
                                </label>

                                <input
                                    name="userName"
                                    value={form.userName}
                                    onChange={handleChange}
                                    placeholder="Enter username"
                                />
                            </div>

                            <div className="user-form-group">
                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="Email"
                                    value={form.Email}
                                    onChange={handleChange}
                                    placeholder="Enter email"
                                />
                            </div>

                            <div className="user-form-group">
                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="Password"
                                    value={form.Password}
                                    onChange={handleChange}
                                    placeholder="Minimum 6 characters"
                                />
                            </div>

                            <div className="user-form-group">
                                <label>
                                    Department
                                </label>

                                <select
                                    name="departmentId"
                                    value={form.departmentId}
                                    onChange={handleChange}
                                >
                                    <option value="">
                                        {loadingDepartments
                                            ? "Loading..."
                                            : "Select Department"}
                                    </option>

                                    {departments.map(
                                        (department) => (
                                            <option
                                                key={
                                                    department.DepartmentID
                                                }
                                                value={
                                                    department.DepartmentID
                                                }
                                            >
                                                {department.DepartmentName}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div className="user-form-group">
                                <label>
                                    Branch ID
                                </label>

                                <input
                                    type="number"
                                    name="branchId"
                                    value={form.branchId}
                                    onChange={handleChange}
                                    placeholder="Enter branch ID"
                                    min="1"
                                />
                            </div>

                            <div className="user-form-group">
                                <label>
                                    Role ID
                                </label>

                                <input
                                    type="number"
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    placeholder="Enter role ID"
                                    min="1"
                                />

                                <small>
                                    Enter the RoleID configured in the database.
                                </small>
                            </div>

                            <div className="user-form-group">

                                <label>
                                    Status
                                </label>

                                <label className="active-toggle">

                                    <input
                                        type="checkbox"
                                        name="IsActive"
                                        checked={form.IsActive}
                                        onChange={handleChange}
                                    />

                                    <span>
                                        Active User
                                    </span>

                                </label>

                            </div>

                        </div>

                        <div className="user-form-actions">

                            <button
                                type="button"
                                className="user-cancel-btn"
                                onClick={() => navigate("/users")}
                                disabled={saving}
                            >
                                <FaTimes />
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="user-save-btn"
                                disabled={saving}
                            >
                                <FaSave />

                                {saving
                                    ? "Creating..."
                                    : "Create User"}
                            </button>

                        </div>

                    </form>

                </section>

            </div>

        </DashboardLayout>
    );
}

export default CreateUser;