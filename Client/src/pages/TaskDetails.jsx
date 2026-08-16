import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaTasks,
    FaUser,
    FaProjectDiagram,
    FaLayerGroup,
    FaFlag,
    FaCalendarAlt,
    FaClock,
    FaCheckCircle,
    FaExclamationTriangle,
    FaComment,
} from "react-icons/fa";

import { getTask } from "../services/tasksService";
import "../styles/TaskDetails.css";

const TaskDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem("user"));


    const [task, setTask] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");




    useEffect(() => {
        const loadTask = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getTask(id);

 

                const taskData = data?.[0]?.[0];
                const commentsData = data?.[1] || [];

                if (!taskData) {
                    throw new Error("Task not found.");
                }

                setTask(taskData);
                setComments(commentsData);
            } catch (err) {
                console.error("Task details error:", err);

                setError(
                    err?.response?.data?.message ||
                        err?.message ||
                        "Failed to load task."
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadTask();
        }
    }, [id]);

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getPriorityClass = (priority) => {
        switch (priority) {
            case "Critical":
                return "task-details-priority critical";

            case "High":
                return "task-details-priority high";

            case "Medium":
                return "task-details-priority medium";

            case "Low":
                return "task-details-priority low";

            default:
                return "task-details-priority";
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "Completed":
                return "task-details-status completed";

            case "In Progress":
                return "task-details-status progress";

            case "Blocked":
                return "task-details-status blocked";

            case "Not Started":
                return "task-details-status not-started";

            default:
                return "task-details-status";
        }
    };

    if (loading) {
        return (
            <div className="task-details-page">
                <div className="task-details-loading">
                    Loading task details...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="task-details-page">
                <div className="task-details-error">
                    <FaExclamationTriangle />

                    <h2>Failed to load task</h2>

                    <p>{error}</p>

                    <button
                        className="task-details-back-btn"
                        onClick={() => navigate("/tasks")}
                    >
                        <FaArrowLeft />
                        Back to Tasks
                    </button>
                </div>
            </div>
        );
    }

    if (!task) {
        return null;
    }

    return (
        <div className="task-details-page">

            {/* =========================
                HEADER
            ========================== */}

            <div className="task-details-header">

                <button
                    className="task-details-back"
                    onClick={() => navigate("/tasks")}
                >
                    <FaArrowLeft />
                    Back to Tasks
                </button>

                <div className="task-details-title-row">

                    <div className="task-details-icon">
                        <FaTasks />
                    </div>

                    <div>
                        <div className="task-details-id">
                            Task #{task.TaskID}
                        </div>

                        <h1>{task.TaskTitle}</h1>

                        <p>
                            View detailed information about this task.
                        </p>
                    </div>

                </div>


                
            </div>


            {/* =========================
                MAIN CONTENT
            ========================== */}

            <div className="task-details-container">

                {/* =========================
                    TOP INFORMATION
                ========================== */}

                <div className="task-details-card">

                    <div className="task-details-card-header">
                        <h2>Task Information</h2>
                        <button
                        type="button"
                        title="Edit task"
                        className="task-action-btnn"
                            onClick={(e) => {

        e.stopPropagation();

        if (

            String(user?.roleName || "").toLowerCase() === "employee"

        ) {

            navigate(`/tasks/${task.TaskID}/edit-employee`);

        } else {

            navigate(`/tasks/${task.TaskID}/edit`);

        }

    }}>
                                    ✎  Edit Task
                        </button>
                        
                    </div>

                    <div className="task-details-info-grid">

                        {/* Project */}

                        <div className="task-details-info-item">
                            <div className="task-details-info-icon">
                                <FaProjectDiagram />
                            </div>

                            <div>
                                <span>Project</span>

                                <strong>
                                    {task.ProjectName || "—"}
                                </strong>

                                <small>
                                    Project ID: {task.ProjectID}
                                </small>
                            </div>
                        </div>


                        {/* Stage */}

                        <div className="task-details-info-item">
                            <div className="task-details-info-icon">
                                <FaLayerGroup />
                            </div>

                            <div>
                                <span>Stage</span>

                                <strong>
                                    {task.StageName || "—"}
                                </strong>

                                <small>
                                    Stage ID: {task.StageID}
                                </small>
                            </div>
                        </div>


                        {/* Assignee */}

                        <div className="task-details-info-item">
                            <div className="task-details-info-icon">
                                <FaUser />
                            </div>

                            <div>
                                <span>Assigned To</span>

                                <strong>
                                    {task.AssignedToName || "—"}
                                </strong>

                                <small>
                                    User ID:{" "}
                                    {task.AssignedToUserID || "—"}
                                </small>
                            </div>
                        </div>


                        {/* Priority */}

                        <div className="task-details-info-item">
                            <div className="task-details-info-icon">
                                <FaFlag />
                            </div>

                            <div>
                                <span>Priority</span>

                                <strong
                                    className={getPriorityClass(
                                        task.PriorityLevel
                                    )}
                                >
                                    {task.PriorityLevel || "—"}
                                </strong>
                            </div>
                        </div>


                        {/* Status */}

                        <div className="task-details-info-item">
                            <div className="task-details-info-icon">
                                <FaCheckCircle />
                            </div>

                            <div>
                                <span>Status</span>

                                <strong
                                    className={getStatusClass(
                                        task.Status
                                    )}
                                >
                                    {task.Status || "—"}
                                </strong>
                            </div>
                        </div>


                        {/* Due Date */}

                        <div className="task-details-info-item">
                            <div className="task-details-info-icon">
                                <FaCalendarAlt />
                            </div>

                            <div>
                                <span>Due Date</span>

                                <strong>
                                    {formatDate(task.DueDate)}
                                </strong>
                            </div>
                        </div>

                    </div>

                    {/* Department */}

<div className="task-details-info-item">
    <div className="task-details-info-icon">
        <FaProjectDiagram />
    </div>

    <div>
        <span>Department</span>

        <strong>
            {task.DepartmentName || "—"}
        </strong>

        <small>
            Department ID: {task.DepartmentID || "—"}
        </small>
    </div>
</div>
                </div>
               

                {/* =========================
                    DESCRIPTION + DATES
                ========================== */}

                <div className="task-details-two-columns">

                    {/* Description */}

                    <div className="task-details-card">

                        <div className="task-details-card-header">
                            <h2>Description</h2>
                        </div>

                        <div className="task-description">
                            {task.TaskDescription || "No description available."}
                        </div>

                    </div>


                    {/* Dates */}

                    <div className="task-details-card">

                        <div className="task-details-card-header">
                            <h2>Dates</h2>
                        </div>

                        <div className="task-date-list">

                            <div className="task-date-item">
                                <FaCalendarAlt />

                                <div>
                                    <span>Due Date</span>

                                    <strong>
                                        {formatDate(task.DueDate)}
                                    </strong>
                                </div>
                            </div>

                            <div className="task-date-item">
                                <FaCheckCircle />

                                <div>
                                    <span>Completed Date</span>

                                    <strong>
                                        {formatDate(task.CompletedDate)}
                                    </strong>
                                </div>
                            </div>

                            <div className="task-date-item">
                                <FaClock />

                                <div>
                                    <span>Created At</span>

                                    <strong>
                                        {formatDate(task.CreatedAt)}
                                    </strong>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>


                {/* =========================
                    BLOCKER
                ========================== */}

                {task.Blocker && (
                    <div className="task-details-card task-blocker-card">

                        <div className="task-details-card-header">
                            <h2>
                                <FaExclamationTriangle />
                                Blocker
                            </h2>
                        </div>

                        <p>{task.Blocker}</p>

                    </div>
                )}


                {/* =========================
                    COMMENTS
                ========================== */}

                <div className="task-details-card">

                    <div className="task-details-card-header">

                        <h2>
                            <FaComment />
                            Comments
                        </h2>

                        <span className="comments-count">
                            {comments.length}
                        </span>

                    </div>

                    {comments.length === 0 ? (
                        <div className="no-comments">
                            No comments available for this task.
                        </div>
                    ) : (
                        <div className="comments-list">

                            {comments.map((comment) => (
                                <div
                                    className="comment-item"
                                    key={comment.CommentID}
                                >

                                    <div className="comment-avatar">
                                        {String(
                                            comment.CreatedByName || "U"
                                        )
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div className="comment-content">

                                        <div className="comment-header">

                                            <strong>
                                                {comment.CreatedByName}
                                            </strong>

                                            <span>
                                                {formatDate(
                                                    comment.CreatedAt
                                                )}
                                            </span>

                                        </div>

                                        <p>
                                            {comment.CommentText ||
                                                comment.CommentContext ||
                                                "No comment text."}
                                        </p>

                                    </div>

                                </div>
                            ))}

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};

export default TaskDetails;