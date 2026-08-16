import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaArrowLeft,
    FaUserPlus,
    FaSave,
    FaTimes,
} from "react-icons/fa";

import DashboardLayout from "../layouts/DashboardLayout";

import {
    createUser,
    getUserOptions,
} from "../services/userService";

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


    // =========================================================
    // FORM
    // =========================================================

    const [form, setForm] = useState(initialForm);


    // =========================================================
    // OPTIONS
    // =========================================================

    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);
    const [roles, setRoles] = useState([]);


    // =========================================================
    // LOADING
    // =========================================================

    const [loadingOptions, setLoadingOptions] = useState(true);
    const [saving, setSaving] = useState(false);


    // =========================================================
    // MESSAGES
    // =========================================================

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================================
    // LOAD DEPARTMENTS + BRANCHES + ROLES
    // =========================================================

    useEffect(() => {

        const loadOptions = async () => {

            try {

                setLoadingOptions(true);
                setError("");


                const [
                    departmentsData,
                    userOptions,
                ] = await Promise.all([

                    getDepartments(),

                    getUserOptions(),

                ]);


                // =================================================
                // DEPARTMENTS
                // =================================================

                setDepartments(
                    Array.isArray(departmentsData)
                        ? departmentsData
                        : []
                );


                // =================================================
                // BRANCHES
                // =================================================

                setBranches(
                    Array.isArray(
                        userOptions?.branches
                    )
                        ? userOptions.branches
                        : []
                );


                // =================================================
                // ROLES
                // =================================================

                setRoles(
                    Array.isArray(
                        userOptions?.roles
                    )
                        ? userOptions.roles
                        : []
                );


            } catch (err) {

                console.error(
                    "Create user options error:",
                    err
                );


                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Failed to load form options."
                );

            } finally {

                setLoadingOptions(false);

            }

        };


        loadOptions();

    }, []);


    // =========================================================
    // HANDLE CHANGE
    // =========================================================

    const handleChange = (e) => {

        const {
            name,
            value,
            type,
            checked,
        } = e.target;


        setForm((prev) => ({

            ...prev,

            [name]:
                type === "checkbox"
                    ? checked
                    : value,

        }));

    };


    // =========================================================
    // SUBMIT
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();


        setError("");
        setSuccess("");


        // =====================================================
        // VALIDATION
        // =====================================================

        if (!form.fullName.trim()) {

            setError(
                "Full Name is required."
            );

            return;
        }


        if (!form.userName.trim()) {

            setError(
                "User Name is required."
            );

            return;
        }


        if (!form.Email.trim()) {

            setError(
                "Email is required."
            );

            return;
        }


        if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                form.Email
            )
        ) {

            setError(
                "Invalid Email."
            );

            return;
        }


        if (!form.Password) {

            setError(
                "Password is required."
            );

            return;
        }


        if (form.Password.length < 6) {

            setError(
                "Password must be at least 6 characters."
            );

            return;
        }


        if (!form.departmentId) {

            setError(
                "Please select a Department."
            );

            return;
        }


        if (!form.branchId) {

            setError(
                "Please select a Branch."
            );

            return;
        }


        if (!form.role) {

            setError(
                "Please select a Role."
            );

            return;
        }


        // =====================================================
        // CREATE
        // =====================================================

        try {

            setSaving(true);


            await createUser({

                fullName:
                    form.fullName.trim(),

                userName:
                    form.userName.trim(),

                Email:
                    form.Email.trim(),

                Password:
                    form.Password,

                departmentId:
                    Number(
                        form.departmentId
                    ),

                branchId:
                    Number(
                        form.branchId
                    ),

                IsActive:
                    Boolean(
                        form.IsActive
                    ),

                role:
                    Number(
                        form.role
                    ),

            });


            setSuccess(
                "User created successfully."
            );


            setTimeout(() => {

                navigate("/users");

            }, 700);


        } catch (err) {

            console.error(
                "Create user error:",
                err
            );


            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to create user."
            );

        } finally {

            setSaving(false);

        }

    };


    // =========================================================
    // UI
    // =========================================================

    return (

        <DashboardLayout>

            <div className="create-user-page">


                {/* =================================================
                    BACK
                ================================================= */}

                <div className="create-user-topbar">

                    <button
                        className="create-user-back"
                        onClick={() =>
                            navigate("/users")
                        }
                    >

                        <FaArrowLeft />

                        Back to Users

                    </button>

                </div>


                {/* =================================================
                    CARD
                ================================================= */}

                <section className="create-user-card">


                    {/* HEADER */}

                    <div className="create-user-header">

                        <div className="create-user-icon">

                            <FaUserPlus />

                        </div>


                        <div>

                            <h1>
                                Create User
                            </h1>

                            <p>
                                Add a new user to the system.
                            </p>

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="user-form-error">

                            {error}

                        </div>

                    )}


                    {/* SUCCESS */}

                    {success && (

                        <div className="user-form-success">

                            {success}

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        className="user-form"
                        onSubmit={handleSubmit}
                    >


                        <div className="user-form-grid">


                            {/* FULL NAME */}

                            <div className="user-form-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    name="fullName"
                                    value={
                                        form.fullName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter full name"
                                />

                            </div>


                            {/* USERNAME */}

                            <div className="user-form-group">

                                <label>
                                    Username
                                </label>

                                <input
                                    name="userName"
                                    value={
                                        form.userName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter username"
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="user-form-group">

                                <label>
                                    Email
                                </label>

                                <input
                                    type="email"
                                    name="Email"
                                    value={
                                        form.Email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Enter email"
                                />

                            </div>


                            {/* PASSWORD */}

                            <div className="user-form-group">

                                <label>
                                    Password
                                </label>

                                <input
                                    type="password"
                                    name="Password"
                                    value={
                                        form.Password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="Minimum 6 characters"
                                />

                            </div>


                            {/* DEPARTMENT */}

                            <div className="user-form-group">

                                <label>
                                    Department
                                </label>

                                <select
                                    name="departmentId"
                                    value={
                                        form.departmentId
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loadingOptions
                                    }
                                >

                                    <option value="">

                                        {loadingOptions
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

                                                {
                                                    department.DepartmentName
                                                }

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* BRANCH */}

                            <div className="user-form-group">

                                <label>
                                    Branch
                                </label>

                                <select
                                    name="branchId"
                                    value={
                                        form.branchId
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loadingOptions
                                    }
                                >

                                    <option value="">

                                        {loadingOptions
                                            ? "Loading..."
                                            : "Select Branch"}

                                    </option>


                                    {branches.map(
                                        (branch) => (

                                            <option
                                                key={
                                                    branch.BranchID
                                                }
                                                value={
                                                    branch.BranchID
                                                }
                                            >

                                                {
                                                    branch.BranchName
                                                }

                                                {branch.City
                                                    ? ` — ${branch.City}`
                                                    : ""}

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* ROLE */}

                            <div className="user-form-group">

                                <label>
                                    Role
                                </label>

                                <select
                                    name="role"
                                    value={
                                        form.role
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        loadingOptions
                                    }
                                >

                                    <option value="">

                                        {loadingOptions
                                            ? "Loading..."
                                            : "Select Role"}

                                    </option>


                                    {roles.map(
                                        (role) => (

                                            <option
                                                key={
                                                    role.RoleID
                                                }
                                                value={
                                                    role.RoleID
                                                }
                                            >

                                                {
                                                    role.RoleName
                                                }

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* STATUS */}

                            <div className="user-form-group">

                                <label>
                                    Status
                                </label>


                                <label className="active-toggle">

                                    <input
                                        type="checkbox"
                                        name="IsActive"
                                        checked={
                                            form.IsActive
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <span>
                                        Active User
                                    </span>

                                </label>

                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div className="user-form-actions">


                            <button
                                type="button"
                                className="user-cancel-btn"
                                onClick={() =>
                                    navigate("/users")
                                }
                                disabled={
                                    saving
                                }
                            >

                                <FaTimes />

                                Cancel

                            </button>


                            <button
                                type="submit"
                                className="user-save-btn"
                                disabled={
                                    saving ||
                                    loadingOptions
                                }
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