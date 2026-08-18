import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaSave,
    FaTimes,
    FaExclamationTriangle,
    FaEdit,
} from "react-icons/fa";

import Header from "../components/Header";
import { getDepartments } from "../services/departmentservice";
import { getProjectManagers } from "../services/projectService";
import {
    getProjectDetails,
    updateProject,
} from "../services/projectDetailsService";
import "../styles/ProjectUpdate.css";

const getCurrentUserRole = () => {
    try {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            const user = JSON.parse(storedUser);

            return String(user.roleName || "")
                .trim()
                .toLowerCase();
        }

        const token = localStorage.getItem("token");

        if (!token) {
            return "";
        }

        const tokenPart = token.split(".")[1];

        if (!tokenPart) {
            return "";
        }

        const base64 = tokenPart
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(
                Math.ceil(tokenPart.length / 4) * 4,
                "="
            );

        const payload = JSON.parse(atob(base64));

        return String(payload.roleName || "")
            .trim()
            .toLowerCase();
    } catch {
        return "";
    }
};

const toDateInput = (value) => {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
};

const getDepartmentIds = (project) => {
    if (!project) {
        return [];
    }

    const projectDepartments =
        project.projectDepartments ||
        project.ProjectDepartments ||
        [];

    if (!Array.isArray(projectDepartments)) {
        return [];
    }

    return projectDepartments
        .map((department) => {
            return Number(
                department.DepartmentID ??
                department.departmentId ??
                department.DepartmentId
            );
        })
        .filter((id) => Number.isInteger(id) && id > 0);
};

const ProjectUpdate = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [departments, setDepartments] = useState([]);
    const [projectManagers, setProjectManagers] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState({
        projectName: "",
        projectDescription: "",
        projectType: "",
        priorityLevel: "",
        status: "Planning",
        targetEndDate: "",
        projectManagerId: "",
        departmentIds: [],
        isStrategic: false,
    });

    const canEditProject = [
        "administrator",
        "secretary",
    ].includes(getCurrentUserRole());

    useEffect(() => {
        const loadPage = async () => {
            try {
                setLoading(true);
                setError("");

                const [
                    details,
                    departmentsData,
                    managersData,
                ] = await Promise.all([
                    getProjectDetails(projectId),
                    getDepartments(),
                    getProjectManagers(),
                ]);

                const currentProject = details?.project;

                if (!currentProject) {
                    throw new Error(
                        "Project was not found."
                    );
                }

                setProject(currentProject);

                setDepartments(
                    Array.isArray(departmentsData)
                        ? departmentsData
                        : []
                );

                setProjectManagers(
                    Array.isArray(managersData)
                        ? managersData
                        : []
                );

                setForm({
                    projectName:
                        currentProject.ProjectName || "",

                    projectDescription:
                        currentProject.ProjectDescription || "",

                    projectType:
                        currentProject.ProjectType || "",

                    priorityLevel:
                        currentProject.PriorityLevel || "",

                    status:
                        currentProject.Status || "Planning",

                    targetEndDate:
                        toDateInput(
                            currentProject.TargetEndDate
                        ),

                    projectManagerId:
                        currentProject.ProjectManagerID ??
                        "",

                    departmentIds:
                        getDepartmentIds(
                            currentProject
                        ),

                    isStrategic:
                        Boolean(
                            currentProject.IsStrategic
                        ),
                });
            } catch (err) {
                console.error(
                    "Project update page error:",
                    err
                );

                setError(
                    err.message ||
                    "Failed to load project."
                );
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            loadPage();
        }
    }, [projectId]);

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

        setSuccess("");
    };

    const handleDepartmentChange = (
        departmentId
    ) => {
        const id = Number(departmentId);

        setForm((prev) => {
            const exists =
                prev.departmentIds.includes(id);

            return {
                ...prev,
                departmentIds: exists
                    ? prev.departmentIds.filter(
                          (currentId) =>
                              currentId !== id
                      )
                    : [
                          ...prev.departmentIds,
                          id,
                      ],
            };
        });

        setSuccess("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canEditProject) {
            setError(
                "You are not authorized to update projects."
            );
            return;
        }

        if (!form.projectName.trim()) {
            setError(
                "Project name is required."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const payload = {
                projectName:
                    form.projectName.trim(),

                projectDescription:
                    form.projectDescription,

                projectType:
                    form.projectType,

                priorityLevel:
                    form.priorityLevel,

                status:
                    form.status,

                targetEndDate:
                    form.targetEndDate || null,

                projectManagerId:
                    form.projectManagerId === ""
                        ? null
                        : Number(
                              form.projectManagerId
                          ),

                isStrategic:
                    Boolean(form.isStrategic),

                departmentIds:
                    form.departmentIds.map(
                        Number
                    ),
            };

            await updateProject(
                projectId,
                payload
            );

            setSuccess(
                "Project updated successfully."
            );

            setTimeout(() => {
                navigate(
                    `/projects/${projectId}`
                );
            }, 500);
        } catch (err) {
            console.error(
                "Update project error:",
                err
            );

            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Failed to update project."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate(`/projects/${projectId}`);
    };

    if (loading) {
        return (
            <div className="project-update-shell">
                <Header />

                <main className="project-update-content">
                    <div className="project-update-state">
                        <div className="update-spinner" />

                        <p>
                            Loading project...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !project) {
        return (
            <div className="project-update-shell">
                <Header />

                <main className="project-update-content">
                    <div className="project-update-state error">
                        <FaExclamationTriangle />

                        <h2>
                            Failed to load project
                        </h2>

                        <p>
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={handleBack}
                        >
                            <FaArrowLeft />

                            Back to Project
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    if (!canEditProject) {
        return (
            <div className="project-update-shell">
                <Header />

                <main className="project-update-content">
                    <div className="project-update-state error">
                        <FaExclamationTriangle />

                        <h2>
                            Access Denied
                        </h2>

                        <p>
                            Only Administrator and
                            Secretary can update projects.
                        </p>

                        <button
                            type="button"
                            onClick={handleBack}
                        >
                            <FaArrowLeft />

                            Back to Project
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="project-update-shell">
            <Header />

            <main className="project-update-content">
                <div className="project-update-inner">

                    <div className="update-topbar">
                        <button
                            type="button"
                            className="update-back-btn"
                            onClick={handleBack}
                        >
                            <FaArrowLeft />
                        </button>

                        <div className="update-breadcrumbs">
                            <span>
                                Projects
                            </span>

                            <span>
                                ›
                            </span>

                            <span>
                                {project?.ProjectName}
                            </span>

                            <span>
                                ›
                            </span>

                            <strong>
                                Update Project
                            </strong>
                        </div>
                    </div>

                    <section className="update-card">

                        <div className="update-card-header">
                            <div className="update-title-icon">
                                <FaEdit />
                            </div>

                            <div>
                                <h1>
                                    Update Project
                                </h1>

                                <p>
                                    Update the project
                                    information stored
                                    in the system.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <div className="update-alert error">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="update-alert success">
                                {success}
                            </div>
                        )}

                        <form
                            onSubmit={handleSubmit}
                        >
                            <div className="update-form-grid">

                                <div className="update-field full">
                                    <label>
                                        Project Name
                                    </label>

                                    <input
                                        name="projectName"
                                        value={
                                            form.projectName
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                    />
                                </div>

                                <div className="update-field full">
                                    <label>
                                        Project Description
                                    </label>

                                    <textarea
                                        name="projectDescription"
                                        value={
                                            form.projectDescription
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        rows="5"
                                    />
                                </div>

                                <div className="update-field">
                                    <label>
                                        Project Type
                                    </label>

                                    <select
                                        name="projectType"
                                        value={
                                            form.projectType
                                        }
                                        onChange={
                                            handleChange
                                        }
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

                                <div className="update-field">
                                    <label>
                                        Priority
                                    </label>

                                    <select
                                        name="priorityLevel"
                                        value={
                                            form.priorityLevel
                                        }
                                        onChange={
                                            handleChange
                                        }
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

                                <div className="update-field">
                                    <label>
                                        Status
                                    </label>

                                    <select
                                        name="status"
                                        value={
                                            form.status
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
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

                                <div className="update-field">
                                    <label>
                                        Target End Date
                                    </label>

                                    <input
                                        type="date"
                                        name="targetEndDate"
                                        value={
                                            form.targetEndDate
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />
                                </div>

                                <div className="update-field">
                                    <label>
                                        Project Manager
                                    </label>

                                    <select
                                        name="projectManagerId"
                                        value={
                                            form.projectManagerId
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    >
                                        <option value="">
                                            Unassigned
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

                                <div className="update-field full">
                                    <label>
                                        Departments
                                    </label>

                                    <div className="department-selection">
                                        {departments.map(
                                            (department) => {
                                                const id =
                                                    Number(
                                                        department.DepartmentID
                                                    );

                                                const checked =
                                                    form.departmentIds.includes(
                                                        id
                                                    );

                                                return (
                                                    <label
                                                        key={
                                                            department.DepartmentID
                                                        }
                                                        className={`department-option ${
                                                            checked
                                                                ? "selected"
                                                                : ""
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                checked
                                                            }
                                                            onChange={() =>
                                                                handleDepartmentChange(
                                                                    id
                                                                )
                                                            }
                                                        />

                                                        <span>
                                                            {
                                                                department.DepartmentName
                                                            }
                                                        </span>
                                                    </label>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>

                                <label className="strategic-toggle">
                                    <input
                                        type="checkbox"
                                        name="isStrategic"
                                        checked={
                                            form.isStrategic
                                        }
                                        onChange={
                                            handleChange
                                        }
                                    />

                                    <span>
                                        Strategic Project
                                    </span>
                                </label>
                            </div>

                            <div className="update-actions">

                                <button
                                    type="button"
                                    className="update-cancel-btn"
                                    onClick={
                                        handleBack
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
            </main>
        </div>
    );
};

export default ProjectUpdate;