import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { getProjects } from "../services/projectService";
import { getUsersByDepartment } from "../services/tasksService";
import { getStagesByProject } from "../services/stageService";
import { createTask } from "../services/tasksService";

import "../styles/AddTask.css";

import {
    FaArrowLeft,
    FaTasks,
    FaSave,
    FaTimes,
} from "react-icons/fa";

const AddTask = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const projectIdFromUrl = searchParams.get("projectId");

    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [stages, setStages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [loadingStages, setLoadingStages] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        projectId: projectIdFromUrl
            ? Number(projectIdFromUrl)
            : "",
        StageID: "",
        TaskTitle: "",
        TaskDescription: "",
        AssignedToUserID: "",
        priority: "",
        dueDate: "",
    });

    /*
    =========================================================
        LOAD PROJECTS + USERS
    =========================================================
    */

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setLoading(true);
                setError("");

                const projectsResponse = await getProjects();

                /*
                Projects API:
                Admin / PMO -> { projects: [...] }
                Other roles -> [...]
                */

                const normalizedProjects = Array.isArray(
                    projectsResponse
                )
                    ? projectsResponse
                    : projectsResponse?.projects || [];

                setProjects(normalizedProjects);


            } catch (err) {
                console.error("Failed to load Add Task data:", err);

                setError(
                    err?.response?.data?.message ||
                        "Failed to load task data."
                );
            } finally {
                setLoading(false);
            }
        };

        loadInitialData();
    }, []);

    /*
    =========================================================
        LOAD STAGES WHEN PROJECT CHANGES
    =========================================================
    */

    useEffect(() => {
        const loadStages = async () => {
            if (!formData.projectId) {
                setStages([]);
                return;
            }

            try {
                setLoadingStages(true);
                setError("");

                const result = await getStagesByProject(
                    formData.projectId
                );

                setStages(
                    Array.isArray(result)
                        ? result
                        : result?.Stages || []
                );

                /*
                Every time Project changes:
                Stage must be reset.
                Department will also reset automatically.
                */

                setFormData((prev) => ({
                    ...prev,
                    StageID: "",
                }));
            } catch (err) {
                console.error("Failed to load stages:", err);

                setStages([]);

                setError(
                    err?.response?.data?.message ||
                        "Failed to load project stages."
                );
            } finally {
                setLoadingStages(false);
            }
        };

        loadStages();
    }, [formData.projectId]);

    /*
    =========================================================
        SELECTED STAGE
    =========================================================
    */

    const selectedStage = useMemo(() => {
        return stages.find(
            (stage) =>
                Number(stage.StageID) ===
                Number(formData.StageID)
        );
    }, [stages, formData.StageID]);

    /*
    =========================================================
        DEPARTMENT COMES FROM STAGE
    =========================================================
    */

    const selectedDepartment = selectedStage
        ? selectedStage.DepartmentName
        : "";






        useEffect(() => {
    const loadUsersByDepartment = async () => {

        if (!selectedStage?.DepartmentID) {
            setUsers([]);
            return;
        }

        try {
            const result = await getUsersByDepartment(
                selectedStage.DepartmentID
            );

            setUsers(
                Array.isArray(result)
                    ? result
                    : result?.users || []
            );

        } catch (err) {
            console.error(
                "Failed to load users by department:",
                err
            );

            setUsers([]);
        }
    };

    loadUsersByDepartment();

}, [selectedStage?.DepartmentID]);
    /*
    =========================================================
        HANDLE INPUT
    =========================================================
    */

    const handleChange = (e) => {
        const { name, value } = e.target;

        setError("");
        setSuccess("");

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    /*
    =========================================================
        HANDLE PROJECT CHANGE
    =========================================================
    */

    const handleProjectChange = (e) => {
        const projectId = e.target.value;

        setError("");
        setSuccess("");

        setFormData((prev) => ({
            ...prev,
            projectId: projectId
                ? Number(projectId)
                : "",
            StageID: "",
        }));

        setStages([]);
    };

    /*
    =========================================================
        SUBMIT
    =========================================================
    */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        /*
        Frontend validation
        */

        if (!formData.projectId) {
            setError("Please select a project.");
            return;
        }

        if (!formData.StageID) {
            setError("Please select a stage.");
            return;
        }

        if (!formData.TaskTitle.trim()) {
            setError("Please enter a task title.");
            return;
        }

        if (!formData.TaskDescription.trim()) {
            setError("Please enter a task description.");
            return;
        }

        if (!formData.AssignedToUserID) {
            setError("Please select an assignee.");
            return;
        }

        if (!formData.priority) {
            setError("Please select a priority.");
            return;
        }

        if (!formData.dueDate) {
            setError("Please select a due date.");
            return;
        }

        /*
        Do not allow completed stages
        */

        if (selectedStage?.Status === "Completed") {
            setError(
                "You cannot create a task in a completed stage."
            );
            return;
        }

        try {
            setSubmitting(true);

            /*
            IMPORTANT:
            DepartmentID is NOT sent.

            Backend gets it from Stage.DepartmentID.
            */

            const taskData = {
                projectId: Number(formData.projectId),
                StageID: Number(formData.StageID),
                TaskTitle: formData.TaskTitle.trim(),
                TaskDescription:
                    formData.TaskDescription.trim(),
                AssignedToUserID: Number(
                    formData.AssignedToUserID
                ),
                priority: formData.priority,
                dueDate: formData.dueDate,
            };

            await createTask(taskData);

            setSuccess("Task created successfully.");

            /*
            Small delay so user can see success message
            */

            setTimeout(() => {
                navigate("/tasks");
            }, 800);
        } catch (err) {
            console.error("Create task error:", err);

            setError(
                err?.response?.data?.message ||
                    err?.response?.data?.error ||
                    "Failed to create task."
            );
        } finally {
            setSubmitting(false);
        }
    };

    /*
    =========================================================
        CANCEL
    =========================================================
    */

    const handleCancel = () => {
        navigate("/tasks");
    };

    /*
    =========================================================
        LOADING
    =========================================================
    */

    if (loading) {
        return (
            <div className="add-task-page">
                <div className="add-task-loading">
                    Loading...
                </div>
            </div>
        );
    }

    /*
    =========================================================
        RENDER
    =========================================================
    */

    return (
        <div className="add-task-page">

            {/* =================================================
                TOP BAR
            ================================================= */}

            <div className="add-task-topbar">

                <button
                    type="button"
                    className="add-task-back-btn"
                    onClick={handleCancel}
                >
                    <FaArrowLeft />
                    Back to Tasks
                </button>

                <div className="add-task-heading">
                    <div className="add-task-icon">
                        <FaTasks />
                    </div>

                    <div>
                        <h1>Add Task</h1>

                        <p>
                            Create a new task and assign it
                            to a project stage.
                        </p>
                    </div>
                </div>
            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {error && (
                <div className="add-task-alert error">
                    {error}
                </div>
            )}

            {/* =================================================
                SUCCESS
            ================================================= */}

            {success && (
                <div className="add-task-alert success">
                    {success}
                </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
                className="add-task-form"
                onSubmit={handleSubmit}
            >

                {/* =================================================
                    PROJECT & STAGE
                ================================================= */}

                <section className="add-task-section">

                    <div className="add-task-section-header">
                        <h2>Task Assignment</h2>

                        <p>
                            Select the project and stage for
                            this task.
                        </p>
                    </div>

                    <div className="add-task-grid">

                        {/* PROJECT */}

                        <div className="add-task-field">

                            <label htmlFor="projectId">
                                Project
                                <span>*</span>
                            </label>

                            <select
                                id="projectId"
                                name="projectId"
                                value={formData.projectId}
                                onChange={handleProjectChange}
                            >
                                <option value="">
                                    Select project
                                </option>

                                {projects.map((project) => (
                                    <option
                                        key={
                                            project.ProjectID
                                        }
                                        value={
                                            project.ProjectID
                                        }
                                    >
                                        {project.ProjectName}
                                        {" "}
                                        (ID:{" "}
                                        {project.ProjectID})
                                    </option>
                                ))}
                            </select>

                        </div>

                        {/* STAGE */}

                        <div className="add-task-field">

                            <label htmlFor="StageID">
                                Stage
                                <span>*</span>
                            </label>

                            <select
                                id="StageID"
                                name="StageID"
                                value={formData.StageID}
                                onChange={handleChange}
                                disabled={
                                    !formData.projectId ||
                                    loadingStages
                                }
                            >

                                <option value="">
                                    {!formData.projectId
                                        ? "Select project first"
                                        : loadingStages
                                        ? "Loading stages..."
                                        : "Select stage"}
                                </option>

                                {stages.map((stage) => (
                                    <option
                                        key={stage.StageID}
                                        value={stage.StageID}
                                        disabled={
                                            stage.Status ===
                                            "Completed"
                                        }
                                    >
                                        {stage.StageName}
                                        {" — "}
                                        {stage.Status}
                                    </option>
                                ))}

                            </select>

                            {formData.projectId &&
                                !loadingStages &&
                                stages.length === 0 && (
                                    <small className="add-task-help">
                                        No stages found for
                                        this project.
                                    </small>
                                )}

                        </div>

                    </div>

                    {/* =================================================
                        DEPARTMENT
                    ================================================= */}

                    <div className="add-task-department-box">

                        <div>
                            <span className="add-task-info-label">
                                Department
                            </span>

                            <strong>
                                {selectedDepartment ||
                                    "Select a stage first"}
                            </strong>
                        </div>

                        {selectedStage && (
                            <div>
                                <span className="add-task-info-label">
                                    Department ID
                                </span>

                                <strong>
                                    {
                                        selectedStage.DepartmentID
                                    }
                                </strong>
                            </div>
                        )}

                    </div>

                </section>

                {/* =================================================
                    TASK DETAILS
                ================================================= */}

                <section className="add-task-section">

                    <div className="add-task-section-header">
                        <h2>Task Details</h2>

                        <p>
                            Enter the information for the
                            task.
                        </p>
                    </div>

                    <div className="add-task-grid">

                        {/* TASK TITLE */}

                        <div className="add-task-field full">

                            <label htmlFor="TaskTitle">
                                Task Title
                                <span>*</span>
                            </label>

                            <input
                                id="TaskTitle"
                                name="TaskTitle"
                                type="text"
                                placeholder="Enter task title..."
                                value={
                                    formData.TaskTitle
                                }
                                onChange={handleChange}
                                maxLength={200}
                            />

                        </div>

                        {/* DESCRIPTION */}

                        <div className="add-task-field full">

                            <label htmlFor="TaskDescription">
                                Task Description
                                <span>*</span>
                            </label>

                            <textarea
                                id="TaskDescription"
                                name="TaskDescription"
                                placeholder="Enter task description..."
                                value={
                                    formData.TaskDescription
                                }
                                onChange={handleChange}
                                rows={5}
                                maxLength={1000}
                            />

                        </div>

                    </div>

                </section>

                {/* =================================================
                    ASSIGNMENT
                ================================================= */}

                <section className="add-task-section">

                    <div className="add-task-section-header">
                        <h2>Assignment & Schedule</h2>

                        <p>
                            Assign the task and define its
                            priority and due date.
                        </p>
                    </div>

                    <div className="add-task-grid">

                        {/* ASSIGNEE */}

                        <div className="add-task-field">

                            <label htmlFor="AssignedToUserID">
                                Assigned To
                                <span>*</span>
                            </label>

                            <select
                                id="AssignedToUserID"
                                name="AssignedToUserID"
                                value={
                                    formData.AssignedToUserID
                                }
                                onChange={handleChange}
                            >

                                <option value="">
                                    Select user
                                </option>

                                {users
                                    .filter(
                                        (user) =>
                                            user.IsActive !==
                                                false &&
                                            user.IsActive !==
                                                0
                                    )
                                    .map((user) => (
                                        <option
                                            key={user.UserID}
                                            value={user.UserID}
                                        >
                                            {user.FullName}
                                            {" "}
                                            (ID:{" "}
                                            {user.UserID})
                                        </option>
                                    ))}

                            </select>

                        </div>

                        {/* PRIORITY */}

                        <div className="add-task-field">

                            <label htmlFor="priority">
                                Priority
                                <span>*</span>
                            </label>

                            <select
                                id="priority"
                                name="priority"
                                value={
                                    formData.priority
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

                        {/* DUE DATE */}

                        <div className="add-task-field">

                            <label htmlFor="dueDate">
                                Due Date
                                <span>*</span>
                            </label>

                            <input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                min={
                                    new Date()
                                        .toISOString()
                                        .split("T")[0]
                                }
                                value={
                                    formData.dueDate
                                }
                                onChange={handleChange}
                            />

                        </div>

                    </div>

                </section>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <div className="add-task-form-footer">

                    <button
                        type="button"
                        className="add-task-cancel-btn"
                        onClick={handleCancel}
                        disabled={submitting}
                    >
                        <FaTimes />
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="add-task-submit-btn"
                        disabled={submitting}
                    >
                        <FaSave />

                        {submitting
                            ? "Creating..."
                            : "Create Task"}
                    </button>

                </div>

            </form>
        </div>
    );
};

export default AddTask;