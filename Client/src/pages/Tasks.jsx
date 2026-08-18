import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import { getTasks } from "../services/tasksService";
import { AuthContext } from "../context/AuthContext";

import "../styles/Tasks.css";


import {
    FaPlus,
    FaSearch,
    FaTimes,
    FaEdit,
    FaTrash,
    FaEye,
    FaSyncAlt,
    FaUsers,
    FaBuilding,
    FaCodeBranch,
} from "react-icons/fa";

function Tasks() {
    const [tasks, setTasks] = useState([]);

    const navigate = useNavigate();

    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState("All");
    const [stageFilter, setStageFilter] = useState("All");

    const [currentPage, setCurrentPage] = useState(1);

    const tasksPerPage = 12;

    /* =========================================================
       EDIT TASK
    ========================================================= */

    const handleEditTask = (taskId) => {
        console.log("USER:", user);
        console.log("ROLE:", user?.roleName);

        if (
            String(user?.roleName || "").toLowerCase() ===
            "employee"
        ) {
            navigate(`/tasks/${taskId}/edit-employee`);
        } else {
            navigate(`/tasks/${taskId}/edit`);
        }
    };

    /* =========================================================
       LOAD TASKS
    ========================================================= */

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTasks();

            setTasks(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Tasks error:", err);

            setError("Failed to load tasks.");
        } finally {
            setLoading(false);
        }
    };

    /* =========================================================
       FILTER OPTIONS
    ========================================================= */

    const statusOptions = useMemo(() => {
        return [
            ...new Set(
                tasks
                    .map((task) => task.Status)
                    .filter(Boolean)
            ),
        ];
    }, [tasks]);

    const priorityOptions = useMemo(() => {
        return [
            ...new Set(
                tasks
                    .map((task) => task.PriorityLevel)
                    .filter(Boolean)
            ),
        ];
    }, [tasks]);

    const projectOptions = useMemo(() => {
        return [
            ...new Set(
                tasks
                    .map((task) => task.ProjectName)
                    .filter(Boolean)
            ),
        ];
    }, [tasks]);

    const stageOptions = useMemo(() => {
        return [
            ...new Set(
                tasks
                    .map((task) => task.StageName)
                    .filter(Boolean)
            ),
        ];
    }, [tasks]);

    /* =========================================================
       ASSIGNEE
    ========================================================= */

    function getAssigneeName(task) {
        if (
            Array.isArray(task.AssignedTo) &&
            task.AssignedTo.length > 0
        ) {
            return task.AssignedTo
                .map((assignedUser) => {
                    if (typeof assignedUser === "string") {
                        return assignedUser;
                    }

                    return (
                        assignedUser?.FullName ||
                        assignedUser?.fullName ||
                        ""
                    );
                })
                .filter(Boolean)
                .join(", ");
        }

        if (typeof task.AssignedTo === "string") {
            return task.AssignedTo;
        }

        return (
            task.AssignedToName ||
            task.assigneeName ||
            "-"
        );
    }



    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tasks.filter((task) => {
            const assignee = getAssigneeName(task);

            const matchesSearch =
                !query ||
                String(task.TaskID || "")
                    .toLowerCase()
                    .includes(query) ||
                String(task.TaskTitle || "")
                    .toLowerCase()
                    .includes(query) ||
                String(task.ProjectName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(task.StageName || "")
                    .toLowerCase()
                    .includes(query) ||
                String(assignee || "")
                    .toLowerCase()
                    .includes(query);

            const matchesStatus =
                statusFilter === "All" ||
                task.Status === statusFilter;

            const matchesPriority =
                priorityFilter === "All" ||
                task.PriorityLevel === priorityFilter;

            const matchesProject =
                projectFilter === "All" ||
                task.ProjectName === projectFilter;

            const matchesStage =
                stageFilter === "All" ||
                task.StageName === stageFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesProject &&
                matchesStage
            );
        });
    }, [
        tasks,
        search,
        statusFilter,
        priorityFilter,
        projectFilter,
        stageFilter,
    ]);

    /* =========================================================
       RESET PAGE WHEN FILTER CHANGES
    ========================================================= */

    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        statusFilter,
        priorityFilter,
        projectFilter,
        stageFilter,
    ]);

    /* =========================================================
       STATISTICS
    ========================================================= */

    const totalTasks = tasks.length;

    const notStartedTasks = tasks.filter(
        (task) =>
            String(task.Status || "").toLowerCase() ===
            "not started"
    ).length;

    const inProgressTasks = tasks.filter(
        (task) =>
            String(task.Status || "").toLowerCase() ===
            "in progress"
    ).length;

    const completedTasks = tasks.filter(
        (task) =>
            String(task.Status || "").toLowerCase() ===
            "completed"
    ).length;

    const overdueTasks = tasks.filter((task) => {
        if (!task.DueDate) {
            return false;
        }

        const status = String(
            task.Status || ""
        ).toLowerCase();

        if (status === "completed") {
            return false;
        }

        return new Date(task.DueDate) < new Date();
    }).length;

    /* =========================================================
       PAGINATION
    ========================================================= */

    const totalPages = Math.ceil(
        filteredTasks.length / tasksPerPage
    );

    const startIndex =
        (currentPage - 1) * tasksPerPage;

    const currentTasks = filteredTasks.slice(
        startIndex,
        startIndex + tasksPerPage
    );

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) {
            return;
        }

        setCurrentPage(page);
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    const getInitials = (name) => {
        if (!name || name === "-") {
            return "?";
        }

        return name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((part) =>
                part.charAt(0).toUpperCase()
            )
            .join("");
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
            }
        );
    };

    const getStatusClass = (status) => {
        switch (
            String(status || "").toLowerCase()
        ) {
            case "completed":
                return "task-status-completed";

            case "in progress":
                return "task-status-progress";

            case "not started":
                return "task-status-not-started";

            case "on hold":
                return "task-status-hold";

            case "overdue":
                return "task-status-overdue";

            case "blocked":
                return "task-status-blocked";

            default:
                return "task-status-default";
        }
    };

    const getPriorityClass = (priority) => {
        switch (
            String(priority || "").toLowerCase()
        ) {
            case "critical":
                return "task-priority-critical";

            case "high":
                return "task-priority-high";

            case "medium":
                return "task-priority-medium";

            case "low":
                return "task-priority-low";

            default:
                return "task-priority-default";
        }
    };

    /* =========================================================
       CLEAR FILTERS
    ========================================================= */

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setProjectFilter("All");
        setStageFilter("All");
    };

    const hasActiveFilters =
        search ||
        statusFilter !== "All" ||
        priorityFilter !== "All" ||
        projectFilter !== "All" ||
        stageFilter !== "All";

    /* =========================================================
       LOADING
    ========================================================= */

    if (loading) {
        return (
            <DashboardLayout>
                <div className="tasks-loading">
                    <div className="tasks-spinner"></div>

                    <p>
                        Loading tasks...
                    </p>
                </div>
            </DashboardLayout>
        );
    }

    /* =========================================================
       ERROR
    ========================================================= */

    if (error) {
        return (
            <DashboardLayout>
                <div className="tasks-error">
                    <h2>Tasks</h2>

                    <p>{error}</p>

                    <button onClick={loadTasks}>
                        Try Again
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    /* =========================================================
       PAGE
    ========================================================= */

    return (
        <DashboardLayout>
            <div className="tasks-page">

                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <div className="tasks-page-header">

                    <div>
                        <h1>Tasks</h1>

                        <p>
                            Manage and track project tasks
                        </p>
                    </div>

                    <button
                        type="button"
                        className="add-task-btn"
                        onClick={() =>
                            navigate("/tasks/add")
                        }
                    >
                        <span><FaPlus/></span>
                        Add Task
                    </button>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <section className="tasks-toolbar">

                    <div className="tasks-search">

                        <span className="tasks-search-icon">
                            <FaSearch/>
                        </span>

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            placeholder="Search tasks by title, project, assignee..."
                        />

                        {search && (
                            <button
                                type="button"
                                className="tasks-search-clear"
                                onClick={() =>
                                    setSearch("")
                                }
                            >
                                ×
                            </button>
                        )}

                    </div>


                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Statuses
                        </option>

                        {statusOptions.map(
                            (status) => (
                                <option
                                    key={status}
                                    value={status}
                                >
                                    {status}
                                </option>
                            )
                        )}
                    </select>


                    <select
                        value={priorityFilter}
                        onChange={(e) =>
                            setPriorityFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Priorities
                        </option>

                        {priorityOptions.map(
                            (priority) => (
                                <option
                                    key={priority}
                                    value={priority}
                                >
                                    {priority}
                                </option>
                            )
                        )}
                    </select>


                    <select
                        value={projectFilter}
                        onChange={(e) =>
                            setProjectFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Projects
                        </option>

                        {projectOptions.map(
                            (project) => (
                                <option
                                    key={project}
                                    value={project}
                                >
                                    {project}
                                </option>
                            )
                        )}
                    </select>


                    <select
                        value={stageFilter}
                        onChange={(e) =>
                            setStageFilter(
                                e.target.value
                            )
                        }
                    >
                        <option value="All">
                            All Stages
                        </option>

                        {stageOptions.map(
                            (stage) => (
                                <option
                                    key={stage}
                                    value={stage}
                                >
                                    {stage}
                                </option>
                            )
                        )}
                    </select>


                    <button
                        type="button"
                        className="clear-filters-btn"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                    >
                        ↻
                        Clear Filters
                    </button>

                </section>


                <section className="tasks-statistics">

                    <div className="task-stat-card">

                        <div className="task-stat-icon total">
                            ☑
                        </div>

                        <div>
                            <span>
                                Total Tasks
                            </span>

                            <strong>
                                {totalTasks}
                            </strong>
                        </div>

                    </div>


                    <div className="task-stat-card">

                        <div className="task-stat-icon not-started">
                            ◷
                        </div>

                        <div>
                            <span>
                                Not Started
                            </span>

                            <strong>
                                {notStartedTasks}
                            </strong>
                        </div>

                    </div>


                    <div className="task-stat-card">

                        <div className="task-stat-icon progress">
                            ▶
                        </div>

                        <div>
                            <span>
                                In Progress
                            </span>

                            <strong>
                                {inProgressTasks}
                            </strong>
                        </div>

                    </div>


                    <div className="task-stat-card">

                        <div className="task-stat-icon completed">
                            ✓
                        </div>

                        <div>
                            <span>
                                Completed
                            </span>

                            <strong>
                                {completedTasks}
                            </strong>
                        </div>

                    </div>


                    <div className="task-stat-card">

                        <div className="task-stat-icon overdue">
                            ⚑
                        </div>

                        <div>
                            <span>
                                Overdue
                            </span>

                            <strong>
                                {overdueTasks}
                            </strong>
                        </div>

                    </div>

                </section>



                <section className="tasks-cards-panel">

                    {currentTasks.length === 0 ? (

                        <div className="tasks-empty">
                            <strong>
                                No tasks found
                            </strong>

                            <span>
                                Try changing your search
                                or filters.
                            </span>
                        </div>

                    ) : (

                        <div className="tasks-cards-grid">

                            {currentTasks.map((task) => {

                                const assignee =
                                    getAssigneeName(task);

                                const isOverdue =
                                    task.DueDate &&
                                    new Date(task.DueDate) <
                                        new Date() &&
                                    String(
                                        task.Status || ""
                                    ).toLowerCase() !==
                                        "completed";

                                return (
                                    <article
                                        className="task-card"
                                        key={task.TaskID}
                                    >

                                        {/* CARD HEADER */}

                                        <div className="task-card-header">

                                            <span className="task-card-id">
                                                #{task.TaskID}
                                            </span>

                                            <div className="task-card-actions">

                                                <button
                                                    type="button"
                                                    title="View task"
                                                    className="task-action-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/tasks/${task.TaskID}`
                                                        )
                                                    }
                                                >
                                                    <FaEye/>
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Edit task"
                                                    className="task-action-btn edit"
                                                    onClick={() =>
                                                        handleEditTask(
                                                            task.TaskID
                                                        )
                                                    }
                                                >
                                                    <FaEdit/>
                                                </button>

                                                <button
                                                    type="button"
                                                    title="Delete task"
                                                    className="task-action-btn delete"
                                                >
                                                    <FaTrash />
                                                </button>

                                            </div>

                                        </div>


                    

                                        <div className="task-card-title-section">

                                            <h3
                                                title={
                                                    task.TaskTitle
                                                }
                                            >
                                                {
                                                    task.TaskTitle ||
                                                    "-"
                                                }
                                            </h3>

                                            {task.TaskDescription && (
                                                <p
                                                    title={
                                                        task.TaskDescription
                                                    }
                                                >
                                                    {
                                                        task.TaskDescription
                                                    }
                                                </p>
                                            )}

                                        </div>


                                        {/* PROJECT */}

                                        <div className="task-card-info">

                                            <div className="task-info-row">

                                                <span className="task-info-label">
                                                    Project
                                                </span>

                                                <strong
                                                    title={
                                                        task.ProjectName
                                                    }
                                                >
                                                    {
                                                        task.ProjectName ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="task-info-row">

                                                <span className="task-info-label">
                                                    Stage
                                                </span>

                                                <strong
                                                    title={
                                                        task.StageName
                                                    }
                                                >
                                                    {
                                                        task.StageName ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="task-info-row">

                                                <span className="task-info-label">
                                                    Department
                                                </span>

                                                <strong
                                                    title={
                                                        task.DepartmentName
                                                    }
                                                >
                                                    {
                                                        task.DepartmentName ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        {/* ASSIGNEE */}

                                        <div className="task-card-assignee">

                                            <div className="task-avatar">
                                                {getInitials(
                                                    assignee
                                                )}
                                            </div>

                                            <div className="task-assignee-info">

                                                <span>
                                                    Assignee
                                                </span>

                                                <strong
                                                    title={
                                                        assignee
                                                    }
                                                >
                                                    {
                                                        assignee ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>

                                        </div>


                                        {/* PRIORITY + STATUS */}

                                        <div className="task-card-meta">

                                            <div>

                                                <span className="task-meta-label">
                                                    Priority
                                                </span>

                                                <span
                                                    className={`task-priority ${getPriorityClass(
                                                        task.PriorityLevel
                                                    )}`}
                                                >
                                                    {
                                                        task.PriorityLevel ||
                                                        "-"
                                                    }
                                                </span>

                                            </div>


                                            <div>

                                                <span className="task-meta-label">
                                                    Status
                                                </span>

                                                <span
                                                    className={`task-status ${getStatusClass(
                                                        task.Status
                                                    )}`}
                                                >
                                                    {
                                                        task.Status ||
                                                        "-"
                                                    }
                                                </span>

                                            </div>

                                        </div>


                                        {/* DUE DATE */}

                                        <div
                                            className={
                                                isOverdue
                                                    ? "task-card-due overdue"
                                                    : "task-card-due"
                                            }
                                        >

                                            <span>
                                                Due Date
                                            </span>

                                            <strong>
                                                {formatDate(
                                                    task.DueDate
                                                )}
                                            </strong>

                                        </div>

                                    </article>
                                );
                            })}

                        </div>
                    )}

                </section>


                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="tasks-table-footer">

                    <span>
                        {filteredTasks.length === 0
                            ? "Showing 0 tasks"
                            : `Showing ${
                                  startIndex + 1
                              } to ${Math.min(
                                  startIndex +
                                      tasksPerPage,
                                  filteredTasks.length
                              )} of ${
                                  filteredTasks.length
                              } tasks`}
                    </span>


                    <div className="tasks-pagination">

                        <button
                            type="button"
                            onClick={() =>
                                goToPage(
                                    currentPage - 1
                                )
                            }
                            disabled={
                                currentPage === 1
                            }
                        >
                            ‹
                        </button>


                        {Array.from(
                            {
                                length: totalPages,
                            },
                            (_, index) => (
                                <button
                                    type="button"
                                    key={index + 1}
                                    className={
                                        currentPage ===
                                        index + 1
                                            ? "active"
                                            : ""
                                    }
                                    onClick={() =>
                                        goToPage(
                                            index + 1
                                        )
                                    }
                                >
                                    {index + 1}
                                </button>
                            )
                        )}


                        <button
                            type="button"
                            onClick={() =>
                                goToPage(
                                    currentPage + 1
                                )
                            }
                            disabled={
                                currentPage ===
                                    totalPages ||
                                totalPages === 0
                            }
                        >
                            ›
                        </button>

                    </div>

                </div>

            </div>
        </DashboardLayout>
    );
}

export default Tasks;