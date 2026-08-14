import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../layouts/DashboardLayout";
import { getTasks } from "../services/tasksService";
import "../styles/Tasks.css";

function Tasks() {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [projectFilter, setProjectFilter] = useState("All");
    const [stageFilter, setStageFilter] = useState("All");

    const [currentPage, setCurrentPage] = useState(1);

    const tasksPerPage = 10;

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
       FILTER TASKS
    ========================================================= */

    const filteredTasks = useMemo(() => {
        const query = search.trim().toLowerCase();

        return tasks.filter((task) => {
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
                getAssigneeName(task)
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
        if (!task.DueDate) return false;

        const status = String(
            task.Status || ""
        ).toLowerCase();

        if (status === "completed") return false;

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
        if (page < 1 || page > totalPages) return;

        setCurrentPage(page);
    };

    /* =========================================================
       HELPERS
    ========================================================= */

    function getAssigneeName(task) {
        if (
            Array.isArray(task.AssignedTo) &&
            task.AssignedTo.length > 0
        ) {
            return task.AssignedTo
                .map((user) => {
                    if (typeof user === "string") {
                        return user;
                    }

                    return (
                        user?.FullName ||
                        user?.fullName ||
                        ""
                    );
                })
                .filter(Boolean)
                .join(", ");
        }

        if (typeof task.AssignedTo === "string") {
            return task.AssignedTo;
        }

        return "-";
    }

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
        if (!date) return "-";

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

    const getProgressClass = (progress) => {
        if (progress >= 100) {
            return "task-progress-completed";
        }

        if (progress >= 50) {
            return "task-progress-good";
        }

        if (progress > 0) {
            return "task-progress-started";
        }

        return "task-progress-empty";
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

                    <button
                        onClick={loadTasks}
                    >
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
    onClick={() => navigate("/tasks/add")}
>
    <span>+</span>
    Add Task
</button>

                </div>


                {/* =================================================
                    FILTERS
                ================================================= */}

                <section className="tasks-toolbar">

                    <div className="tasks-search">

                        <span className="tasks-search-icon">
                            ⌕
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
                        className="clear-filters-btn"
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                    >
                        ↻
                        Clear Filters
                    </button>

                </section>


                {/* =================================================
                    STATISTICS
                ================================================= */}

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


                {/* =================================================
                    TABLE
                ================================================= */}

                <section className="tasks-table-panel">

                    <div className="tasks-table-wrapper">

                        <table className="tasks-table">

                            <thead>
                                <tr>

                                    <th>
                                        Task ID
                                    </th>

                                    <th>
                                        Task Title
                                    </th>

                                    <th>
                                        Project
                                    </th>

                                    <th>
                                        Stage
                                    </th>

                                    <th>
                                        Assignee
                                    </th>

                                    <th>
                                        Priority
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Department
                                    </th>

                                    <th>
                                        Due Date
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>
                            </thead>


                            <tbody>

                                {currentTasks.length ===
                                0 ? (

                                    <tr>

                                        <td
                                            colSpan="10"
                                            className="tasks-empty"
                                        >
                                            <strong>
                                                No tasks found
                                            </strong>

                                            <span>
                                                Try changing your search or filters.
                                            </span>
                                        </td>

                                    </tr>

                                ) : (

                                    currentTasks.map(
                                        (task) => {

                                            const progress = Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    Number(
                                                        task.ProgressPercent ||
                                                        0
                                                    )
                                                )
                                            );

                                            const assignee =
                                                getAssigneeName(
                                                    task
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        task.TaskID
                                                    }
                                                >

                                                    {/* TASK ID */}

                                                    <td>
                                                        <span className="task-id">
                                                            #
                                                            {
                                                                task.TaskID
                                                            }
                                                        </span>
                                                    </td>


                                                    {/* TASK TITLE */}

                                                    <td>

                                                        <div className="task-title-cell">

                                                            <strong
                                                                title={
                                                                    task.TaskTitle
                                                                }
                                                            >
                                                                {
                                                                    task.TaskTitle ||
                                                                    "-"
                                                                }
                                                            </strong>

                                                            {task.TaskDescription && (
                                                                <span
                                                                    title={
                                                                        task.TaskDescription
                                                                    }
                                                                >
                                                                    {
                                                                        task.TaskDescription
                                                                    }
                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>


                                                    {/* PROJECT */}

                                                    <td>
                                                        <span className="task-project-name">
                                                            {
                                                                task.ProjectName ||
                                                                "-"
                                                            }
                                                        </span>
                                                    </td>


                                                    {/* STAGE */}

                                                    <td>
                                                        <span className="task-stage-name">
                                                            {
                                                                task.StageName ||
                                                                "-"
                                                            }
                                                        </span>
                                                    </td>


                                                    {/* ASSIGNEE */}

                                                    <td>

                                                        <div className="task-assignee">

                                                            <div className="task-avatar">
                                                                {
                                                                    getInitials(
                                                                        assignee
                                                                    )
                                                                }
                                                            </div>

                                                            <span
                                                                title={
                                                                    assignee
                                                                }
                                                            >
                                                                {
                                                                    assignee
                                                                }
                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* PRIORITY */}

                                                    <td>

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

                                                    </td>


                                                    {/* STATUS */}

                                                    <td>

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

                                                    </td>


                                                   

{/* DEPARTMENT */}

<td>
    <div className="task-department-cell">
        <span>{task.DepartmentName}</span>
    </div>
</td>


                                                    {/* DUE DATE */}

                                                    <td>

                                                        <span
                                                            className={
                                                                task.DueDate &&
                                                                new Date(
                                                                    task.DueDate
                                                                ) <
                                                                    new Date() &&
                                                                String(
                                                                    task.Status ||
                                                                    ""
                                                                ).toLowerCase() !==
                                                                    "completed"
                                                                    ? "task-due-overdue"
                                                                    : "task-due-date"
                                                            }
                                                        >
                                                            {
                                                                formatDate(
                                                                    task.DueDate
                                                                )
                                                            }
                                                        </span>

                                                    </td>


                                                    {/* ACTIONS */}

                                                    <td>

                                                        <div className="task-actions">

                                                            <button
    type="button"
    title="View task"
    className="task-action-btn"
    onClick={() => {
        navigate(`/tasks/${task.TaskID}`);
    }}
>
    👁
</button>

<button

    type="button"

    title="Edit task"

    className="task-action-btn"

    onClick={(e) => {

        e.stopPropagation();

        navigate(`/tasks/${task.TaskID}/edit`);

    }}

>
                                                                ✎
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Delete task"
                                                                className="task-action-btn delete"
                                                            >
                                                                🗑
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>


                    {/* =================================================
                        TABLE FOOTER
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

                </section>

            </div>
        </DashboardLayout>
    );
}

export default Tasks;