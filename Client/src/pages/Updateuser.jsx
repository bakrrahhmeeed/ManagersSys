import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaUserEdit,
    FaSave,
    FaTimes,
} from "react-icons/fa";

import DashboardLayout from "../layouts/DashboardLayout";

import {
    getUsers,
    updateUser,
} from "../services/userService";

import { getDepartments } from "../services/departmentservice";

import "../styles/UpdateUser.css";


function UpdateUser() {

    const { id } = useParams();
    const navigate = useNavigate();


    const [form, setForm] = useState({
        fullName: "",
        userName: "",
        Email: "",
        departmentId: "",
        branchId: "",
        IsActive: false,
    });


    const [departments, setDepartments] = useState([]);
    const [branches, setBranches] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    // =========================================================
    // LOAD DATA
    // =========================================================

    useEffect(() => {

        const loadData = async () => {

            try {

                setLoading(true);
                setError("");


                // =================================================
                // GET ALL USERS
                // =================================================

                const users = await getUsers();


                console.log("ALL USERS:", users);
                console.log("EDIT USER ID:", id);


                // =================================================
                // FIND CURRENT USER
                // =================================================

                const currentUser = users.find(
                    (user) =>
                        String(user.UserID) === String(id)
                );


                console.log(
                    "CURRENT USER:",
                    currentUser
                );


                if (!currentUser) {

                    throw new Error(
                        "User not found."
                    );
                }


                // =================================================
                // GET DEPARTMENTS
                // =================================================

                const departmentsData =
                    await getDepartments();


                console.log(
                    "DEPARTMENTS:",
                    departmentsData
                );


                setDepartments(
                    Array.isArray(
                        departmentsData
                    )
                        ? departmentsData
                        : []
                );


                // =================================================
                // BUILD BRANCHES LIST
                // =================================================

                const branchMap = new Map();


                users.forEach((user) => {

                    if (
                        user.BranchID !== null &&
                        user.BranchID !== undefined
                    ) {

                        const branchId =
                            Number(
                                user.BranchID
                            );


                        if (
                            !branchMap.has(
                                branchId
                            )
                        ) {

                            branchMap.set(
                                branchId,
                                {
                                    BranchID:
                                        branchId,

                                    BranchName:
                                        user.BranchName ||
                                        `Branch ${branchId}`,
                                }
                            );
                        }
                    }
                });


                const branchesData =
                    Array.from(
                        branchMap.values()
                    );


                console.log(
                    "BRANCHES:",
                    branchesData
                );


                setBranches(
                    branchesData
                );


                // =================================================
                // SET FORM
                // =================================================

                setForm({

                    fullName:
                        currentUser.FullName ||
                        "",

                    userName:
                        currentUser.UserName ||
                        "",

                    Email:
                        currentUser.Email ||
                        "",

                    departmentId:
                        currentUser.DepartmentID ??
                        "",

                    branchId:
                        currentUser.BranchID ??
                        "",

                    IsActive:
                        Boolean(
                            currentUser.IsActive
                        ),
                });


            } catch (err) {

                console.error(
                    "LOAD EDIT USER ERROR:",
                    err
                );


                setError(
                    err.message ||
                    "Failed to load user."
                );

            } finally {

                setLoading(false);

            }

        };


        if (id) {
            loadData();
        }

    }, [id]);


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
    // SAVE
    // =========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");


        try {

            setSaving(true);


            await updateUser(id, {

                fullName:
                    form.fullName,

                userName:
                    form.userName,

                Email:
                    form.Email,

                departmentId:
                    Number(
                        form.departmentId
                    ),

                branchId:
                    Number(
                        form.branchId
                    ),

                IsActive:
                    form.IsActive,

            });


            setSuccess(
                "User updated successfully."
            );


            setTimeout(() => {

                navigate("/users");

            }, 700);


        } catch (err) {

            console.error(
                "UPDATE USER ERROR:",
                err
            );


            setError(
                err.response?.data?.message ||
                err.message ||
                "Failed to update user."
            );

        } finally {

            setSaving(false);

        }
    };


    // =========================================================
    // LOADING
    // =========================================================

    if (loading) {

        return (

            <DashboardLayout>

                <div className="update-user-loading">

                    <div className="update-user-spinner" />

                    <p>
                        Loading user...
                    </p>

                </div>

            </DashboardLayout>

        );
    }


    // =========================================================
    // PAGE
    // =========================================================

    return (

        <DashboardLayout>

            <div className="update-user-page">


                {/* BACK */}

                <div className="update-user-topbar">

                    <button
                        className="update-user-back"
                        onClick={() =>
                            navigate("/users")
                        }
                    >

                        <FaArrowLeft />

                        Back to Users

                    </button>

                </div>


                {/* CARD */}

                <section className="update-user-card">


                    {/* HEADER */}

                    <div className="update-user-header">

                        <div className="update-user-icon">

                            <FaUserEdit />

                        </div>


                        <div>

                            <h1>
                                Edit User
                            </h1>

                            <p>
                                Update the user information.
                            </p>

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="update-form-error">

                            {error}

                        </div>

                    )}


                    {/* SUCCESS */}

                    {success && (

                        <div className="update-form-success">

                            {success}

                        </div>

                    )}


                    {/* FORM */}

                    <form
                        className="update-user-form"
                        onSubmit={handleSubmit}
                    >


                        <div className="update-user-grid">


                            {/* FULL NAME */}

                            <div className="update-user-group">

                                <label>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="fullName"
                                    value={
                                        form.fullName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>


                            {/* USERNAME */}

                            <div className="update-user-group">

                                <label>
                                    Username
                                </label>

                                <input
                                    type="text"
                                    name="userName"
                                    value={
                                        form.userName
                                    }
                                    onChange={
                                        handleChange
                                    }
                                />

                            </div>


                            {/* EMAIL */}

                            <div className="update-user-group">

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
                                />

                            </div>


                            {/* DEPARTMENT */}

                            <div className="update-user-group">

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
                                >

                                    <option value="">
                                        Select Department
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

                            <div className="update-user-group">

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
                                >

                                    <option value="">
                                        Select Branch
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

                                            </option>

                                        )
                                    )}

                                </select>

                            </div>


                            {/* STATUS */}

                            <div className="update-user-group">

                                <label>
                                    Status
                                </label>


                                <label className="update-active-toggle">

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

                        <div className="update-user-actions">


                            <button
                                type="button"
                                className="update-cancel-btn"
                                onClick={() =>
                                    navigate("/users")
                                }
                                disabled={saving}
                            >

                                <FaTimes />

                                Cancel

                            </button>


                            <button
                                type="submit"
                                className="update-save-btn"
                                disabled={saving}
                            >

                                <FaSave />

                                {saving
                                    ? "Saving..."
                                    : "Save Changes"}

                            </button>

                        </div>


                    </form>

                </section>

            </div>

        </DashboardLayout>

    );
}


export default UpdateUser;