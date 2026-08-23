import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaSave,
    FaTasks,
    FaUser,
    FaFlag,
    FaCalendarAlt,
    FaExclamationTriangle,
} from "react-icons/fa";

import { getTask, updateTask, getUsersByDepartment } from "../services/tasksService";
import "../styles/EditTask.css";

const EditTask = () => {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [isCompleted, setIsCompleted] = useState(false);

    const [task, setTask] = useState(null);
    const [departmentUsers, setDepartmentUsers] = useState([]);

    const [form, setForm] = useState({
        TaskTitle: "",
        TaskDescription: "",
        AssignedToUserID: "",
        priority: "",
        Status: "",
        DueDate: "",
        Blocker: "",
    });

    useEffect(() => {
        loadTask();
    }, [taskId]);

    const loadTask = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTask(taskId);

            const taskData = data?.[0]?.[0];

            if (!taskData) {
                throw new Error("Task not found.");
            }

            setTask(taskData);

if (taskData.Status === "Completed") {
    setIsCompleted(true);
}

            // Get active users from the task's department
            const users = await getUsersByDepartment(
                taskData.DepartmentID
            );

            setDepartmentUsers(users || []);
setForm({
    TaskTitle: taskData.TaskTitle || "",
    TaskDescription: taskData.TaskDescription || "",
    AssignedToUserID:
        taskData.AssignedToUserID ||
        taskData.AssignedTo ||
        "",
    priority:
        taskData.PriorityLevel || "",
    Status:
        taskData.Status || "",
    DueDate: taskData.DueDate
        ? taskData.DueDate.substring(0, 10)
        : "",
    Blocker: taskData.Blocker || "",
});
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to load task."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleStatusChange = (e) => {
        const value = e.target.value;

        setForm((prev) => ({
            ...prev,
            Status: value,

            // If task is no longer completed,
            // clear CompletedDate
            CompletedDate:
                value === "Completed"
                    ? prev.CompletedDate
                    : "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            if (!form.TaskTitle.trim()) {
                setError("Task title is required.");
                return;
            }

            if (!form.TaskDescription.trim()) {
                setError("Task description is required.");
                return;
            }

            if (!form.AssignedToUserID) {
                setError("Assigned user is required.");
                return;
            }

            if (!form.priority) {
                setError("Priority is required.");
                return;
            }

            if (!form.Status) {
                setError("Status is required.");
                return;
            }

            if (!form.DueDate) {
                setError("Due date is required.");
                return;
            }

            if (
                form.Status === "Completed" &&
                !form.CompletedDate
            ) {
                setError(
                    "Completed date is required when task is completed."
                );
                return;
            }

            const payload = {
                TaskTitle: form.TaskTitle.trim(),
                TaskDescription: form.TaskDescription.trim(),
                AssignedToUserID: Number(
                    form.AssignedToUserID
                ),
                priority: form.priority,
                Status: form.Status,
                DueDate: form.DueDate,
                CompletedDate:
                    form.Status === "Completed"
                        ? form.CompletedDate
                        : null,
                Blocker: form.Blocker.trim() || null,
            };

            await updateTask(taskId, payload);

            setSuccess("Task updated successfully.");

            setTimeout(() => {
                navigate(`/tasks/${taskId}`);
            }, 700);
        } catch (err) {
            console.error(err);

            setError(
                err?.response?.data?.message ||
                    err?.message ||
                    "Failed to update task."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="edit-task-page">
                <div className="edit-task-loading">
                    Loading task...
                </div>
            </div>
        );
    }

    if (error && !task) {
        return (
            <div className="edit-task-page">
                <div className="edit-task-error">
                    <FaExclamationTriangle />

                    <h2>Unable to load task</h2>

                    <p>{error}</p>

                    <button
                        type="button"
                        onClick={() => navigate("/tasks")}
                    >
                        <FaArrowLeft />
                        Back to Tasks
                    </button>
                </div>
            </div>
        );
    }



    if (isCompleted) {
    return (
        <div className="edit-task-page">
            <div className="edit-task-error">

                <FaExclamationTriangle />

                <h2>
                    Task Cannot Be Edited
                </h2>

                <p>
                    This task is already completed and cannot be modified.
                </p>

                <button
                    type="button"
                    onClick={() =>
                        navigate(`/tasks/${taskId}`)
                    }
                >
                    <FaArrowLeft />
                    Back to Task
                </button>

            </div>
        </div>
    );
}

    return (
        <div className="edit-task-page">

            {/* =========================
                HEADER
            ========================== */}

            <div className="edit-task-header">

                <button
                    type="button"
                    className="edit-task-back"
                    onClick={() =>
                        navigate(`/tasks/${taskId}`)
                    }
                >
                    <FaArrowLeft />
                    Back to Task
                </button>

                <div className="edit-task-title-row">

                    <div className="edit-task-icon">
                        <FaTasks />
                    </div>

                    <div>
                        <span>
                            Editing Task #{task?.TaskID}
                        </span>

                        <h1>
                            Edit Task
                        </h1>

                        <p>
                            Update the task information below.
                        </p>
                    </div>

                </div>
            </div>


            {/* =========================
                FORM
            ========================== */}

            <form
                className="edit-task-form"
                onSubmit={handleSubmit}
            >

                {/* =========================
                    BASIC INFORMATION
                ========================== */}

                <section className="edit-task-card">

                    <div className="edit-task-card-header">
                        <h2>
                            Task Information
                        </h2>
                    </div>

                    <div className="edit-task-form-grid">

                        {/* Title */}

                        <div className="edit-task-field full">

                            <label>
                                Task Title
                            </label>

                            <input
                                type="text"
                                name="TaskTitle"
                                value={form.TaskTitle}
                                onChange={handleChange}
                                placeholder="Enter task title"
                            />

                        </div>


                        {/* Description */}

                        <div className="edit-task-field full">

                            <label>
                                Description
                            </label>

                            <textarea
                                name="TaskDescription"
                                value={
                                    form.TaskDescription
                                }
                                onChange={handleChange}
                                placeholder="Enter task description"
                                rows="5"
                            />

                        </div>


                        {/* Assigned User */}

                        <div className="edit-task-field">

                            <label>
                                <FaUser />
                                Assigned To
                            </label>

                            <select
                                name="AssignedToUserID"
                                value={form.AssignedToUserID}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Select User
                                </option>

                                {departmentUsers.map((user) => (
                                    <option
                                        key={user.UserID}
                                        value={user.UserID}
                                    >
                                        {user.FullName}
                                    </option>
                                ))}
                            </select>

                        </div>


                        {/* Priority */}

                        <div className="edit-task-field">

                            <label>
                                <FaFlag />
                                Priority
                            </label>

                            <select
                                name="priority"
                                value={form.priority}
                                onChange={handleChange}
                            >
                                <option value="">
                                    Select Priority
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


                        {/* Status */}

                        <div className="edit-task-field">

                            <label>
                                Status
                            </label>

                            <select
                                name="Status"
                                value={form.Status}
                                onChange={
                                    handleStatusChange
                                }
                            >
                                <option value="">
                                    Select Status
                                </option>

                                <option value="Not Started">
                                    Not Started
                                </option>

                                <option value="In Progress">
                                    In Progress
                                </option>

                                <option value="Blocked">
                                    Blocked
                                </option>

                                <option value="Completed">
                                    Completed
                                </option>

                            </select>

                        </div>


                        {/* Due Date */}

                        <div className="edit-task-field">

                            <label>
                                <FaCalendarAlt />
                                Due Date
                            </label>

                            <input
                                type="date"
                                name="DueDate"
                                value={form.DueDate}
                                onChange={handleChange}
                            />

                        </div>


                        {/* Completed Date */}

                        <div className="edit-task-field">

                            <label>
                                <FaCalendarAlt />
                                Completed Date
                            </label>

                            <input
                                type="date"
                                name="CompletedDate"
                                value={
                                    form.CompletedDate
                                }
                                onChange={handleChange}
                                disabled={
                                    form.Status !==
                                    "Completed"
                                }
                            />

                        </div>


                        {/* Blocker */}

                        <div className="edit-task-field full">

                            <label>
                                <FaExclamationTriangle />
                                Blocker
                            </label>

                            <textarea
                                name="Blocker"
                                value={form.Blocker}
                                onChange={handleChange}
                                placeholder="Enter blocker if there is any..."
                                rows="3"
                            />

                        </div>

                    </div>

                </section>


                {/* =========================
                    ERROR / SUCCESS
                ========================== */}

                {error && (
                    <div className="edit-task-message error">
                        <FaExclamationTriangle />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="edit-task-message success">
                        {success}
                    </div>
                )}


                {/* =========================
                    ACTIONS
                ========================== */}

                <div className="edit-task-actions">

                    <button
                        type="button"
                        className="edit-task-cancel"
                        onClick={() =>
                            navigate(`/tasks/${taskId}`)
                        }
                        disabled={saving}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="edit-task-save"
                        disabled={saving}
                    >
                        <FaSave />

                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </form>
        </div>
    );
};

export default EditTask;