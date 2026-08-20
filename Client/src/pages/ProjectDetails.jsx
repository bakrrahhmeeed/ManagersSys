import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaCalendarAlt,
    FaCheckCircle,
    FaExclamationTriangle,
    FaBullseye,
    FaShieldAlt,
    FaFileAlt,
    FaEllipsisV,
    FaEdit,
    FaDownload,
    FaChevronRight,
    FaTasks,
    FaSyncAlt,
    FaFlag,
    FaInfoCircle,
} from "react-icons/fa";

import { addcommentonProject } from "../services/commentService";

import Header from "../components/Header";
import "../styles/ProjectDetails.css";

const ProjectDetails = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeSection, setActiveSection] = useState("overview");

    const [showCommentInput, setShowCommentInput] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [isAddingComment, setIsAddingComment] = useState(false);

const handleAddComment = async () => {
    if (!newComment.trim()) {
        return;
    }

    try {
        setIsAddingComment(true);

        const result = await addcommentonProject({
            referenceId: projectId,
            commentText: newComment.trim()
        });

        console.log("Comment added:", result);

        setNewComment("");
        setShowCommentInput(false);

        await fetchComments();

    } catch (error) {
        console.error("Failed to add comment:", error);
    } finally {
        setIsAddingComment(false);
    }
};

    useEffect(() => {
        const fetchProjectDetails = async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");

                const response = await fetch(
                    `http://localhost:3001/api/project/${projectId}/details`,
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {}),
                        },
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Failed to load project details."
                    );
                }

                setData(result);
            } catch (err) {
                console.error("Project details error:", err);
                setError(err.message || "Failed to load project details.");
            } finally {
                setLoading(false);
            }
        };

        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId]);

    const project = data?.project;

    const getCurrentUserRole = () => {
        try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                const storedRole = user.roleName || "";
                if (storedRole) return storedRole;
            }

            const token = localStorage.getItem("token");
            if (!token) return "";

            const tokenPart = token.split(".")[1];
            if (!tokenPart) return "";

            const base64 = tokenPart
                .replace(/-/g, "+")
                .replace(/_/g, "/")
                .padEnd(Math.ceil(tokenPart.length / 4) * 4, "=");

            const payload = JSON.parse(atob(base64));

            return payload.roleName || "";
        } catch {
            return "";
        }
    };

    const currentUserRole = getCurrentUserRole();
    const canEditProject = [
        "administrator",
        "secretary",
    ].includes(String(currentUserRole).trim().toLowerCase());
    const stages = data?.stages || [];
    const updates = data?.updates || [];
    const issues = data?.issues || [];
    const risks = data?.risks || [];
    const objectives = data?.objectives || [];
    const comments = data?.comments || [];

    const totalTasks = useMemo(
        () =>
            stages.reduce(
                (total, stage) => total + (stage.tasks?.length || 0),
                0
            ),
        [stages]
    );

    const completedTasks = useMemo(
        () =>
            stages.reduce(
                (total, stage) =>
                    total +
                    (stage.tasks || []).filter(
                        (task) => task.Status === "Completed"
                    ).length,
                0
            ),
        [stages]
    );

    const completedStages = stages.filter(
        (stage) => stage.Status === "Completed"
    ).length;

    const openIssues = issues.filter(
        (issue) => issue.Status !== "Resolved"
    ).length;

    const highPriorityRisks = risks.filter(
        (risk) =>
            risk.RiskLevel === "High" || risk.ImpactLevel === "High"
    ).length;

    const totalKeyResults = objectives.reduce(
        (total, objective) =>
            total + (objective.keyResults?.length || 0),
        0
    );

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const getInitials = (name) => {
        if (!name) return "NA";

        return name
            .split(" ")
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    const getStatusClass = (status) =>
        status ? status.toLowerCase().replace(/\s+/g, "-") : "";

    const getPriorityClass = (priority) =>
        priority ? priority.toLowerCase().replace(/\s+/g, "-") : "";

    const scrollToSection = (id) => {
        setActiveSection(id);

        const element = document.getElementById(id);

        if (element) {
            element.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
    };

    const handleDownloadReport = () => {
        if (!project) return;

        const reportWindow = window.open("", "_blank", "width=1000,height=800");

        if (!reportWindow) {
            alert("Please allow pop-ups to generate the project report.");
            return;
        }

        const escapeHtml = (value) =>
            String(value ?? "-")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#039;");

        const statusClass = (status) =>
            String(status || "")
                .toLowerCase()
                .replace(/\s+/g, "-");

        const reportStages = stages
            .map(
                (stage, index) => `
                    <section class="report-card">
                        <div class="report-section-title">
                            <div>
                                <span class="stage-number">${index + 1}</span>
                                <div>
                                    <h3>${escapeHtml(stage.StageName)}</h3>
                                    <p>${escapeHtml(stage.ResponsibleUserName || `User #${stage.ResponsibleUserID}`)} · ${escapeHtml(stage.DepartmentName || "No Department")}</p>
                                </div>
                            </div>
                            <span class="badge ${statusClass(stage.Status)}">${escapeHtml(stage.Status)}</span>
                        </div>

                        <div class="report-grid report-grid-4">
                            <div><span>Progress</span><strong>${stage.progress || 0}%</strong></div>
                            <div><span>Start Date</span><strong>${escapeHtml(formatDate(stage.StartDate))}</strong></div>
                            <div><span>End Date</span><strong>${escapeHtml(formatDate(stage.EndDate))}</strong></div>
                            <div><span>Tasks</span><strong>${stage.tasks?.length || 0}</strong></div>
                        </div>

                        ${(stage.tasks || []).length ? `
                            <table>
                                <thead><tr><th>Task</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due Date</th></tr></thead>
                                <tbody>
                                    ${(stage.tasks || []).map(task => `
                                        <tr>
                                            <td>${escapeHtml(task.TaskTitle)}</td>
                                            <td>${escapeHtml(task.AssignedToName || `User #${task.AssignedTo}`)}</td>
                                            <td>${escapeHtml(task.PriorityLevel)}</td>
                                            <td><span class="badge ${statusClass(task.Status)}">${escapeHtml(task.Status)}</span></td>
                                            <td>${escapeHtml(formatDate(task.DueDate))}</td>
                                        </tr>
                                    `).join("")}
                                </tbody>
                            </table>
                        ` : "<p class=\"muted\">No tasks in this stage.</p>"}
                    </section>
                `
            )
            .join("");

        const reportUpdates = updates.length
            ? updates.map(update => `
                <div class="list-item">
                    <div class="list-item-head">
                        <strong>${escapeHtml(update.StageName || "Project Update")}</strong>
                        <span>${escapeHtml(formatDate(update.CreatedAt))}</span>
                    </div>
                    <p>${escapeHtml(update.Update_Text)}</p>
                    <small>${escapeHtml(update.CreatedByName || `User #${update.CreatedBy}`)} · ${update.ProgressPercent || 0}% progress</small>
                </div>
            `).join("")
            : '<p class="muted">No updates available.</p>';

        const reportComments = comments.length
            ? comments.map(comment => `
                <div class="list-item">
                    <div class="list-item-head">
                        <strong>${escapeHtml(comment.CreatedByName || `User #${comment.CreatedBy}`)}</strong>
                        <span>${escapeHtml(formatDate(comment.CreatedAt))}</span>
                    </div>
                    <p>${escapeHtml(comment.CommentText || comment.Comment || comment.Content || comment.Description || "")}</p>
                </div>
            `).join("")
            : '<p class="muted">No comments available.</p>';

        const reportIssues = issues.length
            ? issues.map(issue => `
                <div class="list-item">
                    <div class="list-item-head">
                        <strong>${escapeHtml(issue.IssueTitle)}</strong>
                        <span class="badge ${statusClass(issue.Status)}">${escapeHtml(issue.Status)}</span>
                    </div>
                    <p>${escapeHtml(issue.Description)}</p>
                    <small>${escapeHtml(issue.PriorityLevel)} Priority · Assigned to ${escapeHtml(issue.AssignedToName || `User #${issue.AssignedTo}`)}</small>
                    ${issue.Resolution ? `<small>Resolution: ${escapeHtml(issue.Resolution)}</small>` : ""}
                </div>
            `).join("")
            : '<p class="muted">No issues available.</p>';

        const reportRisks = risks.length
            ? risks.map(risk => `
                <div class="list-item">
                    <div class="list-item-head">
                        <strong>${escapeHtml(risk.RiskTitle)}</strong>
                        <span class="badge ${statusClass(risk.Status)}">${escapeHtml(risk.Status)}</span>
                    </div>
                    <p>${escapeHtml(risk.Description)}</p>
                    <small>${escapeHtml(risk.RiskLevel)} Risk · ${escapeHtml(risk.ImpactLevel)} Impact · Owner: ${escapeHtml(risk.OwnerName || `User #${risk.OwnerID}`)}</small>
                    <small>Mitigation: ${escapeHtml(risk.MitigationPlan)}</small>
                </div>
            `).join("")
            : '<p class="muted">No risks available.</p>';

        const reportObjectives = objectives.length
            ? objectives.map(objective => `
                <section class="report-card">
                    <div class="report-section-title">
                        <div>
                            <h3>${escapeHtml(objective.ObjectiveTitle)}</h3>
                            <p>${escapeHtml(objective.Description)}</p>
                        </div>
                        <span class="badge ${statusClass(objective.Status)}">${escapeHtml(objective.Status)}</span>
                    </div>
                    <p class="muted">Owner: ${escapeHtml(objective.OwnerName || `User #${objective.OwnerID}`)} · ${escapeHtml(formatDate(objective.StartDate))} – ${escapeHtml(formatDate(objective.EndDate))}</p>
                    ${(objective.keyResults || []).length ? `
                        <table>
                            <thead><tr><th>Key Result</th><th>Current / Target</th><th>Progress</th><th>Frequency</th><th>Owner</th></tr></thead>
                            <tbody>
                                ${(objective.keyResults || []).map(kr => `
                                    <tr>
                                        <td>${escapeHtml(kr.KeyResultTitle)}</td>
                                        <td>${escapeHtml(kr.CurrentValue)} / ${escapeHtml(kr.TargetValue)}</td>
                                        <td>${kr.ProgressPercent || 0}%</td>
                                        <td>${escapeHtml(kr.UpdateFrequency)}</td>
                                        <td>${escapeHtml(kr.ResponsibleUserName || `User #${kr.ResponsibleUserID}`)}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    ` : "<p class=\"muted\">No key results available.</p>"}
                </section>
            `).join("")
            : '<p class="muted">No objectives available.</p>';

        reportWindow.document.write(`<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8" />
    <title>Project Report - ${escapeHtml(project.ProjectName)}</title>
    <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #172033; background: #fff; font-size: 11px; line-height: 1.5; }
        .report { max-width: 900px; margin: 0 auto; }
        .report-header { border-bottom: 3px solid #e31b23; padding-bottom: 16px; margin-bottom: 18px; }
        .brand { color: #e31b23; font-size: 22px; font-weight: 800; letter-spacing: .04em; }
        .report-title { margin: 8px 0 2px; font-size: 25px; }
        .report-subtitle { color: #64748b; margin: 0; }
        .report-card { border: 1px solid #e5eaf0; border-radius: 10px; padding: 14px; margin: 0 0 14px; break-inside: avoid; }
        .report-section-title { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; margin-bottom: 12px; }
        .report-section-title > div:first-child { display: flex; gap: 9px; align-items: flex-start; }
        .report-section-title h3 { margin: 0; font-size: 14px; }
        .report-section-title p { margin: 3px 0 0; color: #64748b; }
        .stage-number { width: 26px; height: 26px; display: inline-flex; align-items: center; justify-content: center; border-radius: 7px; background: #fff1f2; color: #e31b23; font-weight: 800; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
        .summary div, .report-grid div { border: 1px solid #edf0f4; border-radius: 8px; padding: 9px; }
        .summary span, .report-grid span, .info-label { display: block; color: #94a3b8; font-size: 9px; margin-bottom: 2px; }
        .summary strong, .report-grid strong { font-size: 13px; }
        .report-grid { display: grid; gap: 8px; margin-bottom: 12px; }
        .report-grid-4 { grid-template-columns: repeat(4, 1fr); }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { padding: 7px 6px; text-align: left; border-bottom: 1px solid #edf0f4; vertical-align: top; }
        th { background: #f8fafc; color: #64748b; font-size: 9px; text-transform: uppercase; }
        td { font-size: 10px; }
        .badge { display: inline-flex; align-items: center; padding: 3px 7px; border-radius: 999px; font-size: 9px; font-weight: 700; white-space: nowrap; background: #f1f5f9; color: #475569; }
        .badge.completed { background: #dcfce7; color: #15803d; }
        .badge.in-progress { background: #dbeafe; color: #2563eb; }
        .badge.planning { background: #f3e8ff; color: #7c3aed; }
        .badge.on-hold { background: #fef3c7; color: #b45309; }
        .list-item { border-bottom: 1px solid #edf0f4; padding: 10px 0; break-inside: avoid; }
        .list-item:last-child { border-bottom: 0; }
        .list-item-head { display: flex; justify-content: space-between; gap: 10px; }
        .list-item p { margin: 5px 0; }
        .list-item small { display: block; color: #64748b; margin-top: 3px; }
        .muted { color: #94a3b8; }
        .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .info-grid > div { border: 1px solid #edf0f4; border-radius: 8px; padding: 9px; }
        .report-footer { margin-top: 18px; padding-top: 10px; border-top: 1px solid #e5eaf0; color: #94a3b8; font-size: 9px; display: flex; justify-content: space-between; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
    </style>
</head>
<body>
<div class="report">
    <header class="report-header">
        <div class="brand">RAYA</div>
        <h1 class="report-title">${escapeHtml(project.ProjectName)}</h1>
        <p class="report-subtitle">Project Report · Generated ${escapeHtml(formatDate(new Date()))}</p>
    </header>

    <section class="report-card">
        <div class="report-section-title">
            <div><h3>Project Overview</h3><p>${escapeHtml(project.ProjectDescription)}</p></div>
            <span class="badge ${statusClass(project.Status)}">${escapeHtml(project.Status)}</span>
        </div>
        <div class="summary">
            <div><span>Project Manager</span><strong>${escapeHtml(project.ProjectManagerName || `User #${project.ProjectManagerID}`)}</strong></div>
            <div><span>Project Type</span><strong>${escapeHtml(project.ProjectType)}</strong></div>
            <div><span>Priority</span><strong>${escapeHtml(project.PriorityLevel)}</strong></div>
            <div><span>Overall Progress</span><strong>${project.overallProgress || 0}%</strong></div>
        </div>
        <div class="info-grid">
            <div><span class="info-label">Start Date</span><strong>${escapeHtml(formatDate(project.StartDate))}</strong></div>
            <div><span class="info-label">Target End Date</span><strong>${escapeHtml(formatDate(project.TargetEndDate))}</strong></div>
            <div><span class="info-label">Actual End Date</span><strong>${escapeHtml(formatDate(project.ActualEndDate))}</strong></div>
            <div><span class="info-label">Strategic</span><strong>${project.IsStrategic ? "Yes" : "No"}</strong></div>
        </div>
    </section>

    <section class="report-card">
        <div class="report-section-title"><div><h3>Project Summary</h3></div></div>
        <div class="summary">
            <div><span>Stages</span><strong>${stages.length}</strong></div>
            <div><span>Tasks</span><strong>${totalTasks}</strong></div>
            <div><span>Issues</span><strong>${issues.length}</strong></div>
            <div><span>Risks</span><strong>${risks.length}</strong></div>
        </div>
    </section>

    <h2>Stages & Tasks</h2>
    ${reportStages || '<p class="muted">No stages available.</p>'}

    <h2>Recent Updates</h2>
    <section class="report-card">${reportUpdates}</section>

    <h2>Comments</h2>
    <section class="report-card">${reportComments}</section>

    <h2>Issues</h2>
    <section class="report-card">${reportIssues}</section>

    <h2>Risks</h2>
    <section class="report-card">${reportRisks}</section>

    <h2>Objectives & Key Results</h2>
    ${reportObjectives}

    <section class="report-card">
        <h3>Project Information</h3>
        <div class="info-grid">
            <div><span class="info-label">Project ID</span><strong>${escapeHtml(project.ProjectID)}</strong></div>
            <div><span class="info-label">Created By</span><strong>${escapeHtml(project.CreatedByName || `User #${project.CreatedBy}`)}</strong></div>
            <div><span class="info-label">Created At</span><strong>${escapeHtml(formatDate(project.CreatedAt))}</strong></div>
            <div><span class="info-label">Manager</span><strong>${escapeHtml(project.ProjectManagerName || `User #${project.ProjectManagerID}`)}</strong></div>
        </div>
    </section>

    <footer class="report-footer">
        <span>RAYA · Project Management System</span>
        <span>Project #${escapeHtml(project.ProjectID)}</span>
    </footer>
</div>
</body>
</html>`);

        reportWindow.document.close();
        reportWindow.focus();

        setTimeout(() => {
            reportWindow.print();
        }, 350);
    };

    if (loading) {
        return (
            <div className="project-details-shell">
                <Header />
                <div className="project-details-state">
                    <div className="loading-spinner" />
                    <p>Loading project details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="project-details-shell">
                <Header />
                <div className="project-details-state error">
                    <FaExclamationTriangle />
                    <h2>Failed to load project</h2>
                    <p>{error}</p>
                    <button onClick={() => navigate("/projects")}>
                        <FaArrowLeft />
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="project-details-shell">
                <Header />
                <div className="project-details-state error">
                    <FaInfoCircle />
                    <h2>Project not found</h2>
                    <button onClick={() => navigate("/projects")}>
                        <FaArrowLeft />
                        Back to Projects
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="project-details-shell">
            <Header />

            <div className="project-details-layout">
                <main className="project-details-content">
                    <div className="project-details-inner">
                        <div className="project-details-topbar">
                            <div className="project-breadcrumbs">
                                <button
                                    className="back-button"
                                    onClick={() => navigate("/projects")}
                                >
                                    <FaArrowLeft />
                                </button>

                                <span>Projects</span>
                                <FaChevronRight />
                                <span>{project.ProjectName}</span>
                                <FaChevronRight />
                                <strong>Details</strong>
                            </div>

                            <div className="project-actions">
                                {canEditProject && (
                                    <button
                                        className="edit-project-btn"
                                        onClick={() =>
                                            navigate(`/projects/${projectId}/edit`)
                                        }
                                    >
                                        <FaEdit />
                                        Edit Project
                                    </button>
                                )}

                                <button
                                    className="report-btn"
                                    onClick={handleDownloadReport}
                                >
                                    <FaDownload />
                                    Project Report
                                </button>

                                <button className="more-actions-btn">
                                    <FaEllipsisV />
                                </button>
                            </div>
                        </div>

                        <section
                            id="overview"
                            className="project-main-card details-section"
                        >
                            <div className="project-main-info">
                                <div className="project-icon">
                                    <FaFileAlt />
                                </div>

                                <div className="project-title-area">
                                    <div className="project-title-row">
                                        <h1>{project.ProjectName}</h1>

                                        <span
                                            className={`status-badge ${getStatusClass(
                                                project.Status
                                            )}`}
                                        >
                                            {project.Status}
                                        </span>
                                    </div>

                                    <p className="project-description">
                                        {project.ProjectDescription}
                                    </p>

                                    <div className="project-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">
                                                Project Manager
                                            </span>

                                            <div className="manager-info">
                                                <div className="avatar">
                                                    {getInitials(
                                                        project.ProjectManagerName
                                                    )}
                                                </div>

                                                <strong>
                                                    {project.ProjectManagerName ||
                                                        `User #${project.ProjectManagerID}`}
                                                </strong>
                                            </div>
                                        </div>

                                        <div className="meta-item">
                                            <span className="meta-label">
                                                Project Type
                                            </span>
                                            <strong>
                                                {project.ProjectType || "-"}
                                            </strong>
                                        </div>

                                        <div className="meta-item">
                                            <span className="meta-label">
                                                Priority
                                            </span>

                                            <strong
                                                className={`priority-text ${getPriorityClass(
                                                    project.PriorityLevel
                                                )}`}
                                            >
                                                <span className="priority-dot" />
                                                {project.PriorityLevel || "-"}
                                            </strong>
                                        </div>

                                        <div className="meta-item">
                                            <span className="meta-label">
                                                Strategic Project
                                            </span>
                                            <strong className="strategic-value">
                                                {project.IsStrategic
                                                    ? "✓ Yes"
                                                    : "No"}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="project-progress-area">
                                <div className="large-progress-circle">
                                    <svg
                                        className="large-progress-svg"
                                        viewBox="0 0 120 120"
                                        aria-label={`Overall progress ${project.overallProgress || 0}%`}
                                    >
                                        <circle
                                            className="progress-circle-track"
                                            cx="60"
                                            cy="60"
                                            r="50"
                                        />
                                        <circle
                                            className="progress-circle-value"
                                            cx="60"
                                            cy="60"
                                            r="50"
                                            pathLength="100"
                                            strokeDasharray={`${project.overallProgress || 0} 100`}
                                        />
                                    </svg>
                                    <div className="large-progress-content">
                                        <strong>{project.overallProgress || 0}%</strong>
                                        <span>Overall Progress</span>
                                    </div>
                                </div>
                            </div>

                            <div className="project-dates">
                                <div className="date-item">
                                    <FaCalendarAlt />
                                    <div>
                                        <span>Start Date</span>
                                        <strong>
                                            {formatDate(project.StartDate)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="date-item">
                                    <FaCalendarAlt />
                                    <div>
                                        <span>Target End Date</span>
                                        <strong>
                                            {formatDate(project.TargetEndDate)}
                                        </strong>
                                    </div>
                                </div>

                                <div className="date-item">
                                    <FaCalendarAlt />
                                    <div>
                                        <span>Actual End Date</span>
                                        <strong>
                                            {formatDate(project.ActualEndDate)}
                                        </strong>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="project-statistics">
                            <div className="stat-card blue">
                                <div>
                                    <span>Total Stages</span>
                                    <strong>{stages.length}</strong>
                                    <small>Completed: {completedStages}</small>
                                </div>
                                <div className="stat-icon">
                                    <FaTasks />
                                </div>
                            </div>

                            <div className="stat-card green">
                                <div>
                                    <span>Total Tasks</span>
                                    <strong>{totalTasks}</strong>
                                    <small>Completed: {completedTasks}</small>
                                </div>
                                <div className="stat-icon">
                                    <FaCheckCircle />
                                </div>
                            </div>

                            <div className="stat-card orange">
                                <div>
                                    <span>Issues</span>
                                    <strong>{issues.length}</strong>
                                    <small>Open: {openIssues}</small>
                                </div>
                                <div className="stat-icon">
                                    <FaExclamationTriangle />
                                </div>
                            </div>

                            <div className="stat-card red">
                                <div>
                                    <span>Risks</span>
                                    <strong>{risks.length}</strong>
                                    <small>
                                        High Priority: {highPriorityRisks}
                                    </small>
                                </div>
                                <div className="stat-icon">
                                    <FaShieldAlt />
                                </div>
                            </div>

                            <div className="stat-card purple">
                                <div>
                                    <span>Objectives</span>
                                    <strong>{objectives.length}</strong>
                                    <small>
                                        Key Results: {totalKeyResults}
                                    </small>
                                </div>
                                <div className="stat-icon">
                                    <FaBullseye />
                                </div>
                            </div>
                        </section>

                        <section
                            id="stages"
                            className="stages-section details-section"
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Stages & Tasks</h2>
                                    <p>
                                        Project delivery stages and their
                                        assigned tasks.
                                    </p>
                                </div>
                            </div>

                            <div className="stages-list">
                                {stages.map((stage, index) => (
                                    <div
                                        className="stage-card"
                                        key={stage.StageID}
                                    >
                                        <div className="stage-header">
                                            <div className="stage-number">
                                                {index + 1}
                                            </div>

                                            <div className="stage-title">
                                                <h3>{stage.StageName}</h3>
                                                <span>
                                                    {stage.ResponsibleUserName ||
                                                        `User #${stage.ResponsibleUserID}`}
                                                    {" • "}
                                                    {stage.DepartmentName || "No Department"}
                                                </span>
                                                <span>
                                                    {formatDate(
                                                        stage.StartDate
                                                    )}{" "}
                                                    –{" "}
                                                    {formatDate(
                                                        stage.EndDate
                                                    )}
                                                </span>
                                            </div>

                                            <span
                                                className={`status-badge ${getStatusClass(
                                                    stage.Status
                                                )}`}
                                            >
                                                {stage.Status}
                                            </span>

                                            <strong className="stage-progress-text">
                                                {stage.progress || 0}%
                                            </strong>

                                            <progress
                                                className="stage-progress"
                                                value={stage.ProgressPercent || 0}
                                                max="100"
                                            />

                                            <strong className="task-count">
                                                {stage.tasks?.length || 0}
                                                <small>Tasks</small>
                                            </strong>
                                        </div>

                                        <div className="tasks-table">
                                            <div className="task-table-header">
                                                <span>Task</span>
                                                <span>Assignee</span>
                                                <span>Priority</span>
                                                <span>Status</span>
                                                <span>Due Date</span>
                                            </div>

                                            {(stage.tasks || []).map((task) => (
                                                <div
                                                    className="task-row"
                                                    key={task.TaskID}
                                                >
                                                    <div className="task-name">
                                                        {task.Status ===
                                                        "Completed" ? (
                                                            <FaCheckCircle className="completed-icon" />
                                                        ) : (
                                                            <span className="task-circle" />
                                                        )}

                                                        <span>
                                                            {task.TaskTitle}
                                                        </span>
                                                    </div>

                                                    <div className="task-assignee">
                                                        <div className="small-avatar">
                                                            {getInitials(
                                                                task.AssignedToName
                                                            )}
                                                        </div>
                                                        <span>
                                                            {task.AssignedToName ||
                                                                `User #${task.AssignedTo}`}
                                                        </span>
                                                    </div>

                                                    <span
                                                        className={`priority-label ${getPriorityClass(
                                                            task.PriorityLevel
                                                        )}`}
                                                    >
                                                        {task.PriorityLevel}
                                                    </span>

                                                    <span
                                                        className={`status-badge small ${getStatusClass(
                                                            task.Status
                                                        )}`}
                                                    >
                                                        {task.Status}
                                                    </span>

                                                    <span className="task-date">
                                                        {formatDate(
                                                            task.DueDate
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                {stages.length === 0 && (
                                    <div className="empty-state">
                                        No stages available.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            id="updates"
                            className="details-section updates-section"
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Recent Updates</h2>
                                    <p>
                                        Latest project activity and progress
                                        updates.
                                    </p>
                                </div>
                            </div>

                            <div className="updates-list">
                                {updates.map((update) => (
                                    <div
                                        className="update-card"
                                        key={update.UpdateID}
                                    >
                                        <div className="update-top">
                                            <div className="avatar">
                                                {getInitials(
                                                    update.CreatedByName
                                                )}
                                            </div>

                                            <div className="update-stage">
                                                <strong>
                                                    {update.StageName ||
                                                        "Project Update"}
                                                </strong>
                                                <span>
                                                    {update.CreatedByName ||
                                                        `User #${update.CreatedBy}`}
                                                </span>
                                            </div>

                                            <time>
                                                {formatDate(update.CreatedAt)}
                                            </time>
                                        </div>

                                        <p>{update.Update_Text}</p>

                                        <div className="update-footer">
                                            <span>Progress</span>
                                            <strong>
                                                {update.ProgressPercent || 0}%
                                            </strong>
                                        </div>
                                    </div>
                                ))}

                                {updates.length === 0 && (
                                    <div className="empty-state">
                                        No recent updates.
                                    </div>
                                )}
                            </div>
                        </section>
<section
    id="comments"
    className="details-section comments-section"
>
    <div className="section-header">
        <div>
            <h2>
                Comments

                <button
                    type="button"
                    onClick={() =>
                        setShowCommentInput(prev => !prev)
                    }
                >
                    <FaEdit />
                    {showCommentInput
                        ? "Cancel"
                        : "Add Comment"}
                </button>
            </h2>

            <p>
                Comments related to this project.
            </p>
        </div>
    </div>


    {/* =========================
        ADD COMMENT INPUT
    ========================== */}

    {showCommentInput && (
        <div className="add-comment-box">

            <textarea
                value={newComment}
                onChange={(e) =>
                    setNewComment(e.target.value)
                }
                placeholder="Write your comment..."
                rows={4}
            />

            <div className="add-comment-actions">

                <button
                    type="button"
                    onClick={() => {
                        setShowCommentInput(false);
                        setNewComment("");
                    }}
                    disabled={isAddingComment}
                >
                    Cancel
                </button>

                <button
                    type="button"
                    disabled={
                        isAddingComment ||
                        !newComment.trim()
                    }
                    onClick={handleAddComment}
                >
                    {isAddingComment
                        ? "Adding..."
                        : "Add Comment"}
                </button>

            </div>

        </div>
    )}


    {/* =========================
        COMMENTS LIST
    ========================== */}

    <div className="comments-list">

        {comments.map((comment, index) => (

            <div
                className="comment-card"
                key={
                    comment.CommentID ||
                    comment.ID ||
                    index
                }
            >

                <div className="comment-avatar">

                    {getInitials(
                        comment.CreatedByName
                    )}

                </div>


                <div className="comment-body">

                    <div className="comment-head">

                        <strong>
                            {comment.CreatedByName ||
                                `User #${comment.CreatedBy}`}
                        </strong>

                        <time>
                            {formatDate(
                                comment.CreatedAt
                            )}
                        </time>

                    </div>


                    <p>
                        {comment.CommentText ||
                            comment.Comment ||
                            comment.Content ||
                            comment.Description ||
                            ""}
                    </p>

                </div>

            </div>

        ))}


        {comments.length === 0 && (
            <div className="empty-state">
                No comments available.
            </div>
        )}

    </div>

</section>

                        <section
                            id="issues"
                            className="details-section issue-risk-section"
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Issues</h2>
                                    <p>Project issues and their current status.</p>
                                </div>
                            </div>

                            <div className="issue-grid">
                                {issues.map((issue) => (
                                    <div
                                        className="issue-risk-card"
                                        key={issue.IssueID}
                                    >
                                        <div className="item-heading">
                                            <span
                                                className={
                                                    issue.Status === "Resolved"
                                                        ? "green-dot"
                                                        : "red-dot"
                                                }
                                            />
                                            <h3>{issue.IssueTitle}</h3>
                                        </div>

                                        <div className="issue-meta">
                                            {issue.PriorityLevel} Priority
                                            <span>•</span>
                                            <span
                                                className={`mini-status ${getStatusClass(
                                                    issue.Status
                                                )}`}
                                            >
                                                {issue.Status}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Assigned to:{" "}
                                                <strong>
                                                    {issue.AssignedToName ||
                                                        `User #${issue.AssignedTo}`}
                                                </strong>
                                            </span>
                                        </div>

                                        <p>{issue.Description}</p>

                                        {issue.Resolution && (
                                            <div className="resolution-box">
                                                <strong>Resolution</strong>
                                                <span>{issue.Resolution}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {issues.length === 0 && (
                                    <div className="empty-state">
                                        No issues.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            id="risks"
                            className="details-section issue-risk-section"
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Risks</h2>
                                    <p>
                                        Current risks, impact and mitigation
                                        plans.
                                    </p>
                                </div>
                            </div>

                            <div className="issue-grid">
                                {risks.map((risk) => (
                                    <div
                                        className="issue-risk-card"
                                        key={risk.RiskID}
                                    >
                                        <div className="item-heading">
                                            <span
                                                className={
                                                    risk.RiskLevel === "High"
                                                        ? "red-dot"
                                                        : "orange-dot"
                                                }
                                            />
                                            <h3>{risk.RiskTitle}</h3>
                                        </div>

                                        <div className="risk-meta">
                                            {risk.RiskLevel} Risk
                                            <span>•</span>
                                            {risk.ImpactLevel} Impact
                                            <span>•</span>
                                            <span>
                                                Owner:{" "}
                                                <strong>
                                                    {risk.OwnerName ||
                                                        `User #${risk.OwnerID}`}
                                                </strong>
                                            </span>
                                        </div>

                                        <span
                                            className={`mini-status ${getStatusClass(
                                                risk.Status
                                            )}`}
                                        >
                                            {risk.Status}
                                        </span>

                                        <p>{risk.Description}</p>

                                        <div className="resolution-box">
                                            <strong>Mitigation Plan</strong>
                                            <span>{risk.MitigationPlan}</span>
                                        </div>
                                    </div>
                                ))}

                                {risks.length === 0 && (
                                    <div className="empty-state">
                                        No risks.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section
                            id="objectives"
                            className="objectives-section details-section"
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Objectives & Key Results</h2>
                                    <p>
                                        Business objectives and measurable
                                        results for this project.
                                    </p>
                                </div>
                            </div>

                            {objectives.map((objective) => (
                                <div
                                    className="objective-card"
                                    key={objective.ObjectiveID}
                                >
                                    <div className="objective-header">
                                        <div className="objective-icon">
                                            <FaBullseye />
                                        </div>

                                        <div className="objective-info">
                                            <h3>{objective.ObjectiveTitle}</h3>
                                            <p>{objective.Description}</p>
                                            <span className="objective-owner">
                                                Owner:{" "}
                                                <strong>
                                                    {objective.OwnerName ||
                                                        `User #${objective.OwnerID}`}
                                                </strong>
                                            </span>
                                        </div>

                                        <span
                                            className={`status-badge ${getStatusClass(
                                                objective.Status
                                            )}`}
                                        >
                                            {objective.Status}
                                        </span>

                                        <span className="objective-dates">
                                            {formatDate(objective.StartDate)} –{" "}
                                            {formatDate(objective.EndDate)}
                                        </span>
                                    </div>

                                    <div className="key-results-table">
                                        <div className="kr-header">
                                            <span>Key Result</span>
                                            <span>Measurement</span>
                                            <span>Current / Target</span>
                                            <span>Progress</span>
                                            <span>Frequency</span>
                                            <span>Owner</span>
                                        </div>

                                        {(objective.keyResults || []).map(
                                            (keyResult) => (
                                                <div
                                                    className="kr-row"
                                                    key={keyResult.KeyResultID}
                                                >
                                                    <strong>
                                                        {
                                                            keyResult.KeyResultTitle
                                                        }
                                                    </strong>

                                                    <span>
                                                        {
                                                            keyResult.MeasurementMethod
                                                        }
                                                    </span>

                                                    <strong>
                                                        {
                                                            keyResult.CurrentValue
                                                        }{" "}
                                                        /{" "}
                                                        {
                                                            keyResult.TargetValue
                                                        }
                                                    </strong>

                                                    <div className="kr-progress">
                                                        <progress
                                                            className="kr-progress-bar"
                                                            value={keyResult.ProgressPercent || 0}
                                                            max="100"
                                                        />
                                                        <strong>
                                                            {keyResult.ProgressPercent ||
                                                                0}
                                                            %
                                                        </strong>
                                                    </div>

                                                    <span>
                                                        {
                                                            keyResult.UpdateFrequency
                                                        }
                                                    </span>

                                                    <div className="kr-owner">
                                                        <div className="small-avatar">
                                                            {getInitials(
                                                                keyResult.ResponsibleUserName
                                                            )}
                                                        </div>
                                                        <span>
                                                            {keyResult.ResponsibleUserName ||
                                                                `User #${keyResult.ResponsibleUserID}`}
                                                        </span>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            ))}

                            {objectives.length === 0 && (
                                <div className="empty-state">
                                    No objectives available.
                                </div>
                            )}
                        </section>

                        <section
                            id="information"
                            className="project-information details-section"
                        >
                            <div className="section-header">
                                <div>
                                    <h2>Project Information</h2>
                                    <p>
                                        Complete information returned by the
                                        project details API.
                                    </p>
                                </div>
                            </div>

                            <div className="information-grid">
                                <div>
                                    <span>Project ID</span>
                                    <strong>{project.ProjectID}</strong>
                                </div>

                                <div>
                                    <span>Created By</span>
                                    <strong>
                                        {project.CreatedByName ||
                                            `User #${project.CreatedBy}`}
                                    </strong>
                                </div>

                                <div>
                                    <span>Created At</span>
                                    <strong>
                                        {formatDate(project.CreatedAt)}
                                    </strong>
                                </div>

                                <div>
                                    <span>Project Manager</span>
                                    <strong>
                                        {project.ProjectManagerName ||
                                            `User #${project.ProjectManagerID}`}
                                    </strong>
                                </div>

                                <div>
                                    <span>Status</span>
                                    <strong className="green-text">
                                        {project.Status}
                                    </strong>
                                </div>

                                <div>
                                    <span>Priority</span>
                                    <strong className="red-text">
                                        {project.PriorityLevel}
                                    </strong>
                                </div>

                                <div>
                                    <span>Project Type</span>
                                    <strong>{project.ProjectType || "-"}</strong>
                                </div>

                                <div>
                                    <span>Strategic Project</span>
                                    <strong className="green-text">
                                        {project.IsStrategic ? "✓ Yes" : "No"}
                                    </strong>
                                </div>
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProjectDetails;