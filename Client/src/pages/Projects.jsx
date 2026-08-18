import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaFolder,
    FaPlus,
    FaFileAlt,
    FaSearch,
    FaFilter,
    FaEllipsisV,
    FaEdit,
    FaTasks,
    FaComment,
    FaCalendarAlt,
    FaChevronLeft,
    FaChevronRight,
} from "react-icons/fa";

import DashboardLayout from "../layouts/DashboardLayout";
import { AuthContext } from "../context/AuthContext";
import { getDepartments } from "../services/departmentservice";
import {
    getProjects,
    createProject,
    getProjectManagers,
} from "../services/projectService";

import "../styles/Projects.css";
import "../styles/popup.css";

const initialFormData = {
    projectName: "",
    projectDescription: "",
    projectType: "",
    priorityLevel: "",
    status: "Planning",
    startDate: "",
    targetEndDate: "",
    projectManagerId: "",
    departmentIds: [],
    isStrategic: false,
};

const PROJECTS_PER_PAGE = 8;

const Projects = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(AuthContext);

    const role = String(user?.roleName || "").toLowerCase();

    const isAdmin = role === "administrator";
    const isSecretary = role === "secretary";
    const isProjectManager = role === "project manager";
    const isDepartmentManager = role === "department manager";

    const canCreateProject = isAdmin || isSecretary;
    const canEditProject = isAdmin || isSecretary;
    const canDeleteProject = isAdmin;
    const canAddTask =
        isAdmin || isProjectManager || isDepartmentManager;

    const [activeTab, setActiveTab] = useState("all");

    const [projects, setProjects] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [projectManagers, setProjectManagers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [managerFilter, setManagerFilter] = useState("All");
    const [sortBy, setSortBy] = useState("Newest First");

    const [openMenu, setOpenMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const [formData, setFormData] = useState(initialFormData);

    useEffect(() => {
        if (location.pathname === "/projects/add") {
            setActiveTab("new");
        } else {
            setActiveTab("all");
        }
    }, [location.pathname]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleDepartmentChange = (e) => {
        const id = Number(e.target.value);

        setFormData((prev) => ({
            ...prev,
            departmentIds: e.target.checked
                ? [...new Set([...prev.departmentIds, id])]
                : prev.departmentIds.filter(
                      (departmentId) => departmentId !== id
                  ),
        }));
    };

    const resetForm = () => {
        setFormData(initialFormData);
    };

    const handleCreate = async () => {
        if (!canCreateProject) return;

        try {
            const payload = {
                projectName: formData.projectName,
                projectDescription: formData.projectDescription,
                projectType: formData.projectType,
                priorityLevel: formData.priorityLevel,
                status: formData.status,
                startDate: formData.startDate,
                targetEndDate: formData.targetEndDate,
                projectManagerId: formData.projectManagerId,
                departmentIds: formData.departmentIds,
                isStrategic: formData.isStrategic,
            };

            await createProject(payload);

            alert("Project Created Successfully");

            const data = await getProjects();
            setProjects(data);

            resetForm();
            setCurrentPage(1);
            navigate("/projects");
        } catch (error) {
            console.error(error);
            alert("Failed To Create Project");
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            try {
                const projectsData = await getProjects();
                setProjects(projectsData);
            } catch (error) {
                console.error(error);
                setProjects([]);
            }

            try {
                const departmentsData = await getDepartments();
                setDepartments(departmentsData);
            } catch (error) {
                console.error(error);
                setDepartments([]);
            }

            try {
                const managersData = await getProjectManagers();
                setProjectManagers(managersData);
            } catch (error) {
                console.error(error);
                setProjectManagers([]);
            }

            setLoading(false);
        };

        fetchData();
    }, []);

    const normalizedProjects = useMemo(() => {
        if (Array.isArray(projects)) return projects;
        if (Array.isArray(projects?.data)) return projects.data;
        if (Array.isArray(projects?.projects)) return projects.projects;
        if (Array.isArray(projects?.data?.projects)) {
            return projects.data.projects;
        }
        if (Array.isArray(projects?.data?.data)) {
            return projects.data.data;
        }

        return [];
    }, [projects]);

    const getManagerName = (managerId) => {
        const manager = projectManagers.find(
            (item) => String(item.UserID) === String(managerId)
        );

        return manager?.FullName || "Unassigned";
    };

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

    const getStatusClass = (status) => {
        switch (status) {
            case "Completed":
                return "project-status completed";
            case "In Progress":
                return "project-status progress";
            case "Planning":
                return "project-status planning";
            case "On Hold":
                return "project-status hold";
            default:
                return "project-status";
        }
    };

    const getProjectIcon = (type) => {
        const normalizedType = String(type || "").toLowerCase();

        if (normalizedType.includes("software")) return "💻";
        if (normalizedType.includes("infrastructure")) return "🌐";
        if (normalizedType.includes("business")) return "📊";
        if (normalizedType.includes("internal")) return "⚙️";

        return "📁";
    };

    const getProgressColor = (status) => {
        switch (status) {
            case "Completed":
                return "#22c55e";
            case "In Progress":
                return "#22c55e";
            case "Planning":
                return "#8b5cf6";
            case "On Hold":
                return "#f59e0b";
            default:
                return "#22c55e";
        }
    };

    const filteredProjects = useMemo(() => {
        const result = normalizedProjects.filter((project) => {
            const name = project.ProjectName || "";
            const status = project.Status || "";
            const managerId = String(project.ProjectManagerID ?? "");
            const projectId = String(project.ProjectID ?? "");

            const matchesSearch =
                name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                projectId.includes(searchTerm.trim());

            const matchesStatus =
                statusFilter === "All" || status === statusFilter;

            const matchesManager =
                managerFilter === "All" ||
                managerId === String(managerFilter);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesManager
            );
        });

        return [...result].sort((a, b) => {
            if (sortBy === "Progress High") {
                return (
                    Number(b.overallProgress || 0) -
                    Number(a.overallProgress || 0)
                );
            }

            if (sortBy === "Progress Low") {
                return (
                    Number(a.overallProgress || 0) -
                    Number(b.overallProgress || 0)
                );
            }

            if (sortBy === "Due Date") {
                return (
                    new Date(a.TargetEndDate || "9999-12-31") -
                    new Date(b.TargetEndDate || "9999-12-31")
                );
            }

            if (sortBy === "Oldest First") {
                return (
                    new Date(a.CreatedAt || 0) -
                    new Date(b.CreatedAt || 0)
                );
            }

            return (
                new Date(b.CreatedAt || 0) -
                new Date(a.CreatedAt || 0)
            );
        });
    }, [
        normalizedProjects,
        searchTerm,
        statusFilter,
        managerFilter,
        sortBy,
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, managerFilter, sortBy]);

    const totalPages = Math.max(
        1,
        Math.ceil(
            filteredProjects.length / PROJECTS_PER_PAGE
        )
    );

    const safePage = Math.min(currentPage, totalPages);

    const paginatedProjects = filteredProjects.slice(
        (safePage - 1) * PROJECTS_PER_PAGE,
        safePage * PROJECTS_PER_PAGE
    );

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;

        setCurrentPage(page);
    };

    const handleMenuAction = (action, project) => {
        setOpenMenu(null);

        if (action === "update" && canEditProject) {
            navigate(
                `/projects/${project.ProjectID}?edit=true`
            );
        }

        if (action === "task" && canAddTask) {
            navigate(
                `/tasks/add?projectId=${project.ProjectID}`
            );
        }

        if (action === "comment") {
            alert(
                `Comments for "${project.ProjectName}" will be connected next.`
            );
        }

        if (action === "delete" && canDeleteProject) {
            alert(
                `Delete "${project.ProjectName}" will be connected next.`
            );
        }
    };

    return (
        <DashboardLayout>
            <div className="projects-layout">
                <main className="projects-main">
                    {activeTab === "all" && (
                        <section className="projects-content">
                            <div className="projects-filter-bar">
                                <div className="project-search">
                                    <FaSearch />

                                    <input
                                        type="text"
                                        placeholder="Search projects..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(
                                                e.target.value
                                            )
                                        }
                                    />
                                </div>

                                <div className="project-filter">
                                    <span>Status</span>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="All">
                                            All Status
                                        </option>

                                        <option value="Planning">
                                            Planning
                                        </option>

                                        <option value="In Progress">
                                            In Progress
                                        </option>

                                        <option value="Completed">
                                            Completed
                                        </option>

                                        <option value="On Hold">
                                            On Hold
                                        </option>
                                    </select>
                                </div>

                                <div className="project-filter">
                                    <span>
                                        Project Manager
                                    </span>

                                    <select
                                        value={managerFilter}
                                        onChange={(e) =>
                                            setManagerFilter(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="All">
                                            All Managers
                                        </option>

                                        {projectManagers.map(
                                            (manager) => (
                                                <option
                                                    key={
                                                        manager.UserID
                                                    }
                                                    value={
                                                        manager.UserID
                                                    }
                                                >
                                                    {
                                                        manager.FullName
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                <div className="project-filter">
                                    <span>Sort By</span>

                                    <select
                                        value={sortBy}
                                        onChange={(e) =>
                                            setSortBy(
                                                e.target.value
                                            )
                                        }
                                    >
                                        <option value="Newest First">
                                            Newest First
                                        </option>

                                        <option value="Oldest First">
                                            Oldest First
                                        </option>

                                        <option value="Progress High">
                                            Progress: High to Low
                                        </option>

                                        <option value="Progress Low">
                                            Progress: Low to High
                                        </option>

                                        <option value="Due Date">
                                            Due Date
                                        </option>
                                    </select>
                                </div>

                                <button className="projects-filter-btn">
                                    <FaFilter />
                                    Filters
                                </button>
                            </div>

                            {loading ? (
                                <div className="projects-loading">
                                    Loading projects...
                                </div>
                            ) : (
                                <>
                                    <div className="projects-grid">
                                        {paginatedProjects.length ===
                                        0 ? (
                                            <div className="projects-empty">
                                                <FaFolder />

                                                <h2>
                                                    No projects found
                                                </h2>

                                                <p>
                                                    Try changing your
                                                    search or filters.
                                                </p>
                                            </div>
                                        ) : (
                                            paginatedProjects.map(
                                                (project) => {
                                                    const progress =
                                                        Math.min(
                                                            100,
                                                            Math.max(
                                                                0,
                                                                Number(
                                                                    project.overallProgress ||
                                                                        0
                                                                )
                                                            )
                                                        );

                                                    const managerName =
                                                        getManagerName(
                                                            project.ProjectManagerID
                                                        );

                                                    const initials =
                                                        managerName !==
                                                        "Unassigned"
                                                            ? managerName
                                                                  .split(
                                                                      " "
                                                                  )
                                                                  .map(
                                                                      (
                                                                          word
                                                                      ) =>
                                                                          word[0]
                                                                  )
                                                                  .slice(
                                                                      0,
                                                                      2
                                                                  )
                                                                  .join(
                                                                      ""
                                                                  )
                                                                  .toUpperCase()
                                                            : "?";

                                                    const progressColor =
                                                        getProgressColor(
                                                            project.Status
                                                        );

                                                    return (
                                                        <article
                                                            className="project-card"
                                                            key={
                                                                project.ProjectID
                                                            }
                                                            onClick={() =>
                                                                navigate(
                                                                    `/projects/${project.ProjectID}`
                                                                )
                                                            }
                                                        >
                                                            <div className="project-card-top">
                                                                <div
                                                                    className={`project-type-icon type-${String(
                                                                        project.ProjectType ||
                                                                            ""
                                                                    )
                                                                        .toLowerCase()
                                                                        .replace(
                                                                            /\s+/g,
                                                                            "-"
                                                                        )}`}
                                                                >
                                                                    {getProjectIcon(
                                                                        project.ProjectType
                                                                    )}
                                                                </div>

                                                                <div className="project-menu-wrapper">
                                                                    <button
                                                                        className="project-menu-btn"
                                                                        onClick={(
                                                                            e
                                                                        ) => {
                                                                            e.stopPropagation();

                                                                            setOpenMenu(
                                                                                openMenu ===
                                                                                    project.ProjectID
                                                                                    ? null
                                                                                    : project.ProjectID
                                                                            );
                                                                        }}
                                                                    >
                                                                        <FaEllipsisV />
                                                                    </button>

                                                                    {openMenu ===
                                                                        project.ProjectID && (
                                                                        <div className="project-actions-menu">
{canEditProject && (
    <button
        onClick={(e) => {
            e.stopPropagation();

            navigate(`/projects/${project.ProjectID}/edit`);
        }}
    >
        <FaEdit />
        Edit
    </button>
)}

                                                                            {canAddTask && (
                                                                                <button
                                                                                    onClick={(
                                                                                        e
                                                                                    ) => {
                                                                                        e.stopPropagation();

                                                                                        handleMenuAction(
                                                                                            "task",
                                                                                            project
                                                                                        );
                                                                                    }}
                                                                                >
                                                                                    <FaTasks />
                                                                                    Add
                                                                                    Task
                                                                                </button>
                                                                            )}

                                                                            <button
                                                                                onClick={(
                                                                                    e
                                                                                ) => {
                                                                                    e.stopPropagation();

                                                                                    handleMenuAction(
                                                                                        "comment",
                                                                                        project
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <FaComment />
                                                                                Comment
                                                                            </button>

                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="project-card-body">
                                                                <h2>
                                                                    {
                                                                        project.ProjectName
                                                                    }
                                                                </h2>

                                                                <span className="project-id">
                                                                    ID :{" "}
                                                                    {
                                                                        project.ProjectID
                                                                    }
                                                                </span>

                                                                <p className="project-description">
                                                                    {project.ProjectDescription ||
                                                                        "No project description available."}
                                                                </p>

                                                                <div className="project-manager-info">
                                                                    <div className="project-manager-avatar">
                                                                        {
                                                                            initials
                                                                        }
                                                                    </div>

                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                managerName
                                                                            }
                                                                        </strong>

                                                                        <span>
                                                                            Project
                                                                            Manager
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="project-due-date">
                                                                    <FaCalendarAlt />

                                                                    <span>
                                                                        Due:{" "}
                                                                        <strong>
                                                                            {formatDate(
                                                                                project.TargetEndDate
                                                                            )}
                                                                        </strong>
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="project-card-footer">
                                                                <span
                                                                    className={getStatusClass(
                                                                        project.Status
                                                                    )}
                                                                >
                                                                    {project.Status ||
                                                                        "Unknown"}
                                                                </span>

                                                                <div
                                                                    className="project-progress-circle"
                                                                    style={{
                                                                        "--progress": `${progress * 3.6}deg`,
                                                                        "--progress-color":
                                                                            progressColor,
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <strong>
                                                                            {
                                                                                progress
                                                                            }
                                                                            %
                                                                        </strong>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                }
                                            )
                                        )}
                                    </div>

                                    <div className="projects-bottom">
                                        <span className="projects-results-info">
                                            Showing{" "}
                                            <strong>
                                                {filteredProjects.length ===
                                                0
                                                    ? 0
                                                    : (safePage - 1) *
                                                          PROJECTS_PER_PAGE +
                                                      1}
                                            </strong>{" "}
                                            to{" "}
                                            <strong>
                                                {Math.min(
                                                    safePage *
                                                        PROJECTS_PER_PAGE,
                                                    filteredProjects.length
                                                )}
                                            </strong>{" "}
                                            of{" "}
                                            <strong>
                                                {
                                                    filteredProjects.length
                                                }
                                            </strong>{" "}
                                            projects
                                        </span>

                                        {totalPages > 1 && (
                                            <div className="projects-pagination">
                                                <button
                                                    onClick={() =>
                                                        goToPage(
                                                            safePage - 1
                                                        )
                                                    }
                                                    disabled={
                                                        safePage === 1
                                                    }
                                                >
                                                    <FaChevronLeft />
                                                </button>

                                                {Array.from(
                                                    {
                                                        length: totalPages,
                                                    },
                                                    (_, index) =>
                                                        index + 1
                                                ).map((page) => (
                                                    <button
                                                        key={page}
                                                        className={
                                                            page ===
                                                            safePage
                                                                ? "active"
                                                                : ""
                                                        }
                                                        onClick={() =>
                                                            goToPage(
                                                                page
                                                            )
                                                        }
                                                    >
                                                        {page}
                                                    </button>
                                                ))}

                                                <button
                                                    onClick={() =>
                                                        goToPage(
                                                            safePage + 1
                                                        )
                                                    }
                                                    disabled={
                                                        safePage ===
                                                        totalPages
                                                    }
                                                >
                                                    <FaChevronRight />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {activeTab === "new" && canCreateProject && (
                        <section className="projects-content new-project-page">
                            <button
                                className="back-to-projects"
                                onClick={() =>
                                    navigate("/projects")
                                }
                            >
                                ← Back to Projects
                            </button>

                            <div className="project-form-card">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>
                                            Project Name{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            type="text"
                                            name="projectName"
                                            value={
                                                formData.projectName
                                            }
                                            onChange={handleChange}
                                            placeholder="Enter project name"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Project Manager{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="projectManagerId"
                                            value={
                                                formData.projectManagerId
                                            }
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select project manager
                                            </option>

                                            {projectManagers.map(
                                                (manager) => (
                                                    <option
                                                        key={
                                                            manager.UserID
                                                        }
                                                        value={
                                                            manager.UserID
                                                        }
                                                    >
                                                        {
                                                            manager.FullName
                                                        }
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Project Type{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="projectType"
                                            value={
                                                formData.projectType
                                            }
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select project type
                                            </option>

                                            <option value="Internal">
                                                Internal
                                            </option>

                                            <option value="External">
                                                External
                                            </option>

                                            <option value="Business">
                                                Business
                                            </option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Priority{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="priorityLevel"
                                            value={
                                                formData.priorityLevel
                                            }
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select priority
                                            </option>

                                            <option value="Low">
                                                Low
                                            </option>

                                            <option value="Medium">
                                                Medium
                                            </option>

                                            <option value="High">
                                                High
                                            </option>

                                            <option value="Critical">
                                                Critical
                                            </option>
                                        </select>
                                    </div>

                                    <div className="form-group full-width">
                                        <label>
                                            Description{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <div className="textarea-wrapper">
                                            <textarea
                                                name="projectDescription"
                                                value={
                                                    formData.projectDescription
                                                }
                                                maxLength={500}
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder="Enter project description..."
                                            />

                                            <span className="character-count">
                                                {
                                                    formData
                                                        .projectDescription
                                                        .length
                                                }{" "}
                                                / 500
                                            </span>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Status{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="">
                                                Select status
                                            </option>

                                            <option value="Planning">
                                                Planning
                                            </option>

                                            <option value="Not Started">
                                                Not Started
                                            </option>

                                            <option value="In Progress">
                                                In Progress
                                            </option>

                                            <option value="Completed">
                                                Completed
                                            </option>

                                            <option value="On Hold">
                                                On Hold
                                            </option>

                                            <option value="Cancelled">
                                                Cancelled
                                            </option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Department(s)
                                        </label>

                                        <div className="department-select-box">
                                            {departments.length ===
                                            0 ? (
                                                <span>
                                                    No departments
                                                    available
                                                </span>
                                            ) : (
                                                departments.map(
                                                    (
                                                        department
                                                    ) => (
                                                        <label
                                                            key={
                                                                department.DepartmentID
                                                            }
                                                            className="department-checkbox"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                value={
                                                                    department.DepartmentID
                                                                }
                                                                checked={formData.departmentIds.includes(
                                                                    department.DepartmentID
                                                                )}
                                                                onChange={
                                                                    handleDepartmentChange
                                                                }
                                                            />

                                                            {
                                                                department.DepartmentName
                                                            }
                                                        </label>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Start Date{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <div className="date-input-wrapper">
                                            <input
                                                type="date"
                                                name="startDate"
                                                value={
                                                    formData.startDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                            <FaCalendarAlt />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Target End Date{" "}
                                            <span className="required">
                                                *
                                            </span>
                                        </label>

                                        <div className="date-input-wrapper">
                                            <input
                                                type="date"
                                                name="targetEndDate"
                                                value={
                                                    formData.targetEndDate
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                            />

                                            <FaCalendarAlt />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>
                                            Strategic Project
                                        </label>

                                        <select
                                            name="isStrategic"
                                            value={String(
                                                formData.isStrategic
                                            )}
                                            onChange={(e) =>
                                                setFormData(
                                                    (prev) => ({
                                                        ...prev,
                                                        isStrategic:
                                                            e.target
                                                                .value ===
                                                            "true",
                                                    })
                                                )
                                            }
                                        >
                                            <option value="false">
                                                No
                                            </option>

                                            <option value="true">
                                                Yes
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="project-form-actions">
                                    <button
                                        type="button"
                                        className="project-cancel-btn"
                                        onClick={() => {
                                            resetForm();
                                            navigate(
                                                "/projects"
                                            );
                                        }}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="project-create-btn"
                                        onClick={handleCreate}
                                    >
                                        <FaPlus />
                                        Create Project
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === "detail" && (
                        <section className="projects-content">
                            <div className="projects-header">
                                <div>
                                    <h1>Project Details</h1>

                                    <p>
                                        Select a project to view its
                                        details.
                                    </p>
                                </div>
                            </div>

                            <div className="project-detail-placeholder">
                                <FaFileAlt />

                                <h2>Project Detail</h2>

                                <p>
                                    Project details will appear here
                                    when a project is selected.
                                </p>
                            </div>
                        </section>
                    )}
                </main>
            </div>
        </DashboardLayout>
    );
};

export default Projects;

