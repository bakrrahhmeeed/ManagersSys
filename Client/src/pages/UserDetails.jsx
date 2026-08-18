import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    FaArrowLeft,
    FaUser,
    FaEnvelope,
    FaUserTag,
    FaBuilding,
    FaCodeBranch,
    FaCalendarAlt,
    FaEdit,
    FaCheckCircle,
    FaTimesCircle,
    FaIdBadge,
    FaProjectDiagram,
    FaTasks,
    FaClock,
    FaExclamationCircle,
} from "react-icons/fa";

import Header from "../components/Header";
import { getUserById } from "../services/userService";

import "../styles/UserDetails.css";

const UserDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const result = await getUserById(id);

                console.log("User Details API:", result);

                setUser(result?.user || null);
                setProjects(
                    Array.isArray(result?.projects)
                        ? result.projects
                        : []
                );
                setTasks(
                    Array.isArray(result?.tasks)
                        ? result.tasks
                        : []
                );

            } catch (err) {
                console.error(
                    "User details error:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load user details."
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchUserDetails();
        } else {
            setError("User ID is missing.");
            setLoading(false);
        }
    }, [id]);

    const formatDate = (date) => {
        if (!date) return "-";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }

        return parsedDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getInitials = (name) => {
        if (!name) return "NA";

        return name
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const getStatusClass = (status) => {
        if (!status) return "";

        return status
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    const getTaskStatusClass = (status) => {
        if (!status) return "default";

        switch (status) {
            case "Completed":
                return "completed";

            case "In Progress":
                return "in-progress";

            case "Blocked":
                return "blocked";

            case "Not Started":
                return "not-started";

            case "Cancelled":
                return "cancelled";

            default:
                return "default";
        }
    };

    const getPriorityClass = (priority) => {
        if (!priority) return "";

        return priority
            .toLowerCase()
            .replace(/\s+/g, "-");
    };

    if (loading) {
        return (
            <div className="user-details-shell">
                <Header />

                <div className="user-details-state">
                    <div className="user-loading-spinner" />

                    <p>
                        Loading user details...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="user-details-shell">
                <Header />

                <div className="user-details-state error">

                    <FaTimesCircle />

                    <h2>
                        Failed to load user
                    </h2>

                    <p>
                        {error}
                    </p>

                    <button
                        onClick={() =>
                            navigate("/users")
                        }
                    >
                        <FaArrowLeft />
                        Back to Users
                    </button>

                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="user-details-shell">
                <Header />

                <div className="user-details-state error">

                    <FaUser />

                    <h2>
                        User not found
                    </h2>

                    <button
                        onClick={() =>
                            navigate("/users")
                        }
                    >
                        <FaArrowLeft />
                        Back to Users
                    </button>

                </div>
            </div>
        );
    }

    return (
        <div className="user-details-shell">

            <Header />

            <main className="user-details-page">

                {/* =====================================================
                    TOP BAR
                ===================================================== */}

                <div className="user-details-topbar">

                    <div className="user-breadcrumbs">

                        <button
                            className="user-back-button"
                            onClick={() =>
                                navigate("/users")
                            }
                        >
                            <FaArrowLeft />
                        </button>

                        <span>
                            Users
                        </span>

                        <span className="breadcrumb-arrow">
                            /
                        </span>

                        <strong>
                            {user.FullName}
                        </strong>

                    </div>


                    <div className="user-actions">

                        <button
                            className="user-edit-btn"
                            onClick={() =>
                                navigate(
                                    `/users/${user.UserID}/edit`
                                )
                            }
                        >
                            <FaEdit />
                            Edit User
                        </button>

                    </div>

                </div>


                {/* =====================================================
                    USER HEADER
                ===================================================== */}

                <section className="user-main-card">

                    <div className="user-main-info">

                        <div className="user-large-avatar">
                            {getInitials(
                                user.FullName
                            )}
                        </div>


                        <div className="user-title-area">

                            <div className="user-title-row">

                                <h1>
                                    {user.FullName}
                                </h1>

                                <span
                                    className={`user-status-badge ${
                                        user.IsActive
                                            ? "active"
                                            : "inactive"
                                    }`}
                                >

                                    <span className="status-dot" />

                                    {user.IsActive
                                        ? "Active"
                                        : "Inactive"}

                                </span>

                            </div>


                            <p className="user-username">
                                @{user.UserName || "-"}
                            </p>


                            <div className="user-role">

                                <FaUserTag />

                                <span>
                                    {user.RoleName ||
                                        "User"}
                                </span>

                            </div>


                            <div className="user-id">

                                <FaIdBadge />

                                User ID: #{user.UserID}

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    STATISTICS
                ===================================================== */}

                <section className="user-statistics">

                    <div className="user-stat-card blue">

                        <div className="user-stat-icon">
                            <FaUser />
                        </div>

                        <div>

                            <span>
                                USER ID
                            </span>

                            <strong>
                                {user.UserID}
                            </strong>

                        </div>

                    </div>


                    <div className="user-stat-card green">

                        <div className="user-stat-icon">
                            <FaCheckCircle />
                        </div>

                        <div>

                            <span>
                                STATUS
                            </span>

                            <strong>
                                {user.IsActive
                                    ? "Active"
                                    : "Inactive"}
                            </strong>

                        </div>

                    </div>


                    <div className="user-stat-card purple">

                        <div className="user-stat-icon">
                            <FaProjectDiagram />
                        </div>

                        <div>

                            <span>
                                PROJECTS
                            </span>

                            <strong>
                                {projects.length}
                            </strong>

                        </div>

                    </div>


                    <div className="user-stat-card orange">

                        <div className="user-stat-icon">
                            <FaTasks />
                        </div>

                        <div>

                            <span>
                                TASKS
                            </span>

                            <strong>
                                {tasks.length}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    PERSONAL INFORMATION
                ===================================================== */}

                <section className="user-information">

                    <div className="user-section-header">

                        <div>

                            <h2>
                                Personal Information
                            </h2>

                            <p>
                                User account and contact
                                information.
                            </p>

                        </div>

                    </div>


                    <div className="user-information-grid">

                        <div className="user-info-item">

                            <div className="info-icon">
                                <FaUser />
                            </div>

                            <div>

                                <span>
                                    Full Name
                                </span>

                                <strong>
                                    {user.FullName || "-"}
                                </strong>

                            </div>

                        </div>


                        <div className="user-info-item">

                            <div className="info-icon">
                                <FaUserTag />
                            </div>

                            <div>

                                <span>
                                    Username
                                </span>

                                <strong>
                                    {user.UserName || "-"}
                                </strong>

                            </div>

                        </div>


                        <div className="user-info-item">

                            <div className="info-icon">
                                <FaEnvelope />
                            </div>

                            <div>

                                <span>
                                    Email Address
                                </span>

                                <strong>
                                    {user.Email || "-"}
                                </strong>

                            </div>

                        </div>


                        <div className="user-info-item">

                            <div className="info-icon">
                                <FaCalendarAlt />
                            </div>

                            <div>

                                <span>
                                    Account Created
                                </span>

                                <strong>
                                    {formatDate(
                                        user.CreatedAt
                                    )}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    ORGANIZATION INFORMATION
                ===================================================== */}

                <section className="user-information">

                    <div className="user-section-header">

                        <div>

                            <h2>
                                Organization Information
                            </h2>

                            <p>
                                Department, branch and role
                                assignment.
                            </p>

                        </div>

                    </div>


                    <div className="user-information-grid">

                        <div className="user-info-item">

                            <div className="info-icon purple">
                                <FaBuilding />
                            </div>

                            <div>

                                <span>
                                    Department
                                </span>

                                <strong>
                                    {user.DepartmentName ||
                                        `Department #${
                                            user.DepartmentID ??
                                            "-"
                                        }`}
                                </strong>

                            </div>

                        </div>


                        <div className="user-info-item">

                            <div className="info-icon orange">
                                <FaCodeBranch />
                            </div>

                            <div>

                                <span>
                                    Branch
                                </span>

                                <strong>
                                    {user.BranchName ||
                                        `Branch #${
                                            user.BranchID ??
                                            "-"
                                        }`}
                                </strong>

                            </div>

                        </div>


                        <div className="user-info-item">

                            <div className="info-icon blue">
                                <FaUserTag />
                            </div>

                            <div>

                                <span>
                                    Role
                                </span>

                                <strong>
                                    {user.RoleName ||
                                        "-"}
                                </strong>

                            </div>

                        </div>


                        <div className="user-info-item">

                            <div
                                className={`info-icon ${
                                    user.IsActive
                                        ? "green"
                                        : "gray"
                                }`}
                            >

                                {user.IsActive ? (
                                    <FaCheckCircle />
                                ) : (
                                    <FaTimesCircle />
                                )}

                            </div>

                            <div>

                                <span>
                                    Account Status
                                </span>

                                <strong
                                    className={
                                        user.IsActive
                                            ? "green-text"
                                            : "gray-text"
                                    }
                                >
                                    {user.IsActive
                                        ? "Active"
                                        : "Inactive"}
                                </strong>

                            </div>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    PROJECTS
                ===================================================== */}

                <section className="user-related-section">

                    <div className="related-section-header">

                        <div className="related-title">

                            <div className="related-icon purple">
                                <FaProjectDiagram />
                            </div>

                            <div>

                                <h2>
                                    Projects
                                </h2>

                                <p>
                                    Projects related to this
                                    user according to their
                                    role.
                                </p>

                            </div>

                        </div>


                        <span className="related-count">
                            {projects.length}
                        </span>

                    </div>


                    {projects.length > 0 ? (

                        <div className="projects-list">

                            {projects.map((project) => (

                                <div
                                    className="user-project-card"
                                    key={project.ProjectID}
                                >

                                    <div className="project-card-main">

                                        <div className="project-card-icon">
                                            <FaProjectDiagram />
                                        </div>

                                        <div className="project-card-info">

                                            <h3>
                                                {
                                                    project.ProjectName
                                                }
                                            </h3>

                                            <div className="project-card-meta">

                                                <span>
                                                    Project #
                                                    {
                                                        project.ProjectID
                                                    }
                                                </span>

                                                {project.ProjectManagerName && (
                                                    <>
                                                        <span>
                                                            •
                                                        </span>

                                                        <span>
                                                            Manager:{" "}
                                                            {
                                                                project.ProjectManagerName
                                                            }
                                                        </span>
                                                    </>
                                                )}

                                            </div>

                                        </div>

                                    </div>


                                    <div className="project-card-details">

                                        <span
                                            className={`status-badge small ${getStatusClass(
                                                project.Status
                                            )}`}
                                        >
                                            {
                                                project.Status ||
                                                "Unknown"
                                            }
                                        </span>

                                        <div className="project-date">

                                            <FaCalendarAlt />

                                            <span>
                                                {
                                                    formatDate(
                                                        project.TargetEndDate
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            ))}

                        </div>

                    ) : (

                        <div className="related-empty">

                            <FaProjectDiagram />

                            <strong>
                                No projects
                            </strong>

                            <span>
                                No projects are currently
                                associated with this user.
                            </span>

                        </div>

                    )}

                </section>


                {/* =====================================================
                    TASKS
                ===================================================== */}

                <section className="user-related-section">

                    <div className="related-section-header">

                        <div className="related-title">

                            <div className="related-icon orange">
                                <FaTasks />
                            </div>

                            <div>

                                <h2>
                                    Tasks
                                </h2>

                                <p>
                                    Tasks related to this user
                                    according to their role.
                                </p>

                            </div>

                        </div>


                        <span className="related-count">
                            {tasks.length}
                        </span>

                    </div>


                    {tasks.length > 0 ? (

                        <div className="tasks-table-wrapper">

                            <div className="user-tasks-table">

                                <div className="user-task-header">

                                    <span>
                                        Task
                                    </span>

                                    <span>
                                        Project
                                    </span>

                                    <span>
                                        Assignee
                                    </span>

                                    <span>
                                        Priority
                                    </span>

                                    <span>
                                        Status
                                    </span>

                                    <span>
                                        Due Date
                                    </span>

                                </div>


                                {tasks.map((task) => (

                                    <div
                                        className="user-task-row"
                                        key={task.TaskID}
                                    >

                                        <div className="task-title-cell">

                                            {task.Status ===
                                            "Completed" ? (
                                                <FaCheckCircle className="task-completed-icon" />
                                            ) : (
                                                <span className="task-status-circle" />
                                            )}

                                            <div>

                                                <strong>
                                                    {
                                                        task.TaskTitle
                                                    }
                                                </strong>

                                                {task.StageName && (
                                                    <small>
                                                        {
                                                            task.StageName
                                                        }
                                                    </small>
                                                )}

                                            </div>

                                        </div>


                                        <div className="task-project-cell">

                                            <span>
                                                {
                                                    task.ProjectName ||
                                                    `Project #${
                                                        task.ProjectID
                                                    }`
                                                }
                                            </span>

                                        </div>


                                        <div className="task-assignee-cell">

                                            <div className="task-avatar">

                                                {getInitials(
                                                    task.AssignedToName
                                                )}

                                            </div>

                                            <span>
                                                {
                                                    task.AssignedToName ||
                                                    `User #${
                                                        task.AssignedTo
                                                    }`
                                                }
                                            </span>

                                        </div>


                                        <span
                                            className={`priority-label ${getPriorityClass(
                                                task.PriorityLevel
                                            )}`}
                                        >
                                            {
                                                task.PriorityLevel ||
                                                "-"
                                            }
                                        </span>


                                        <span
                                            className={`task-status ${getTaskStatusClass(
                                                task.Status
                                            )}`}
                                        >
                                            {
                                                task.Status ||
                                                "Unknown"
                                            }
                                        </span>


                                        <div className="task-due-date">

                                            <FaClock />

                                            <span>
                                                {
                                                    formatDate(
                                                        task.DueDate
                                                    )
                                                }
                                            </span>

                                        </div>

                                    </div>

                                ))}

                            </div>

                        </div>

                    ) : (

                        <div className="related-empty">

                            <FaTasks />

                            <strong>
                                No tasks
                            </strong>

                            <span>
                                No tasks are currently
                                associated with this user.
                            </span>

                        </div>

                    )}

                </section>


                {/* =====================================================
                    ACCOUNT DETAILS
                ===================================================== */}

                <section className="user-information">

                    <div className="user-section-header">

                        <div>

                            <h2>
                                Account Details
                            </h2>

                            <p>
                                System information for this
                                user.
                            </p>

                        </div>

                    </div>


                    <div className="account-details">

                        <div>

                            <span>
                                User ID
                            </span>

                            <strong>
                                #{user.UserID}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Username
                            </span>

                            <strong>
                                {user.UserName || "-"}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Created At
                            </span>

                            <strong>
                                {formatDate(
                                    user.CreatedAt
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Status
                            </span>

                            <strong
                                className={
                                    user.IsActive
                                        ? "green-text"
                                        : "gray-text"
                                }
                            >
                                {user.IsActive
                                    ? "Active"
                                    : "Inactive"}
                            </strong>

                        </div>

                    </div>

                </section>


                {/* =====================================================
                    BOTTOM ACTIONS
                ===================================================== */}

                <div className="user-bottom-actions">

                    <button
                        className="back-users-btn"
                        onClick={() =>
                            navigate("/users")
                        }
                    >
                        <FaArrowLeft />
                        Back to Users
                    </button>


                    <button
                        className="edit-user-bottom-btn"
                        onClick={() =>
                            navigate(
                                `/users/${user.UserID}/edit`
                            )
                        }
                    >
                        <FaEdit />
                        Edit User
                    </button>

                </div>

            </main>
        </div>
    );
};

export default UserDetails;