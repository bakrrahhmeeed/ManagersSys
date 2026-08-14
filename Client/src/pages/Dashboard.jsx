import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";

import {
  getDashboardSummary,
  getDashboardProgress,
  getDashboardTaskStatus,
  getDashboardUpcomingDeadlines,
  getDashboardTaskPriority,
} from "../services/dashboardService";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState(null);
  const [taskStatus, setTaskStatus] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [taskPriority, setTaskPriority] = useState([]);
  const [projectSearch, setProjectSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryData,
        progressData,
        taskStatusData,
        deadlinesData,
        priorityData,
      ] = await Promise.all([
        getDashboardSummary(),
        getDashboardProgress(),
        getDashboardTaskStatus(),
        getDashboardUpcomingDeadlines(),
        getDashboardTaskPriority(),
      ]);

      setSummary(summaryData);
      setProgress(progressData);
      setTaskStatus(taskStatusData || []);
      setUpcomingDeadlines(deadlinesData || []);
      setTaskPriority(priorityData || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     TASK STATUS
  ========================================================= */

  const getStatusCount = (status) => {
    const item = taskStatus.find(
      (task) =>
        String(task.Status).toLowerCase() === status.toLowerCase()
    );

    return item ? Number(item.Count) : 0;
  };

  const completedTasks = getStatusCount("Completed");
  const overdueTasks = getStatusCount("Overdue");

  const totalTasks =
    summary?.stats?.tasks !== undefined
      ? Number(summary.stats.tasks)
      : taskStatus.reduce(
          (total, item) => total + Number(item.Count || 0),
          0
        );

  /* =========================================================
     TASK STATUS CHART
  ========================================================= */

  const statusChartData = useMemo(() => {
    return [
      {
        name: "Completed",
        value: getStatusCount("Completed"),
      },
      {
        name: "In Progress",
        value: getStatusCount("In Progress"),
      },
      {
        name: "On Hold",
        value: getStatusCount("On Hold"),
      },
      {
        name: "Overdue",
        value: getStatusCount("Overdue"),
      },
    ];
  }, [taskStatus]);

  const STATUS_COLORS = [
    "#22c55e",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
  ];

  /* =========================================================
     OVERALL PROJECT PROGRESS
  ========================================================= */

  const overallProgress = Number(
    progress?.overallProgress || 0
  );

  const overallProgressChartData = [
    {
      name: "Completed",
      value: overallProgress,
    },
    {
      name: "Remaining",
      value: Math.max(0, 100 - overallProgress),
    },
  ];

  /* =========================================================
     PRIORITY CHART
  ========================================================= */

  const priorityChartData = useMemo(() => {
    return taskPriority.map((item) => ({
      priority: item.PriorityLevel || "No Priority",
      count: Number(item.Count || 0),
    }));
  }, [taskPriority]);

  /* =========================================================
     RECENT PROJECTS
  ========================================================= */

  const recentProjects = useMemo(() => {
    const projects = progress?.projects || [];
    const latestProjects = summary?.latestProjects || [];

    const latestMap = new Map(
      latestProjects.map((project) => [
        Number(project.ProjectID),
        project,
      ])
    );

    return projects.map((project) => {
      const latest = latestMap.get(Number(project.projectId));

      return {
        ...project,
        manager:
          project.manager ||
          latest?.Manager ||
          latest?.ProjectManager ||
          "-",
        dueDate:
          project.dueDate ||
          project.TargetEndDate ||
          latest?.DueDate ||
          latest?.TargetEndDate ||
          null,
        startDate:
          project.startDate ||
          project.StartDate ||
          latest?.StartDate ||
          null,
        priority:
          project.priority ||
          project.priorityLevel ||
          project.PriorityLevel ||
          latest?.PriorityLevel ||
          "-",
        isStrategic:
          project.isStrategic ??
          project.IsStrategic ??
          latest?.IsStrategic ??
          false,
        totalTasks: Number(project.totalTasks || 0),
        completedTasks: Number(project.completedTasks || 0),
      };
    });
  }, [progress, summary]);

  const filteredRecentProjects = useMemo(() => {
    const query = projectSearch.trim();

    if (!query) {
      return recentProjects.slice(0, 4);
    }

    return recentProjects
      .filter((project) =>
        String(project.projectId || "").includes(query)
      )
      .slice(0, 4);
  }, [recentProjects, projectSearch]);

  /* =========================================================
     HELPERS
  ========================================================= */

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

  const getDaysLeft = (date) => {
    if (!date) return "";

    const today = new Date();
    const dueDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const difference = Math.ceil(
      (dueDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    if (difference < 0) {
      return `${Math.abs(difference)} days overdue`;
    }

    if (difference === 0) {
      return "Today";
    }

    if (difference === 1) {
      return "1 day left";
    }

    return `${difference} days left`;
  };

  const getPriorityClass = (priority) => {
    if (!priority) return "priority-default";

    switch (priority.toLowerCase()) {
      case "critical":
        return "priority-critical";

      case "high":
        return "priority-high";

      case "medium":
        return "priority-medium";

      case "low":
        return "priority-low";

      default:
        return "priority-default";
    }
  };

  const getStatusClass = (status) => {
    if (!status) return "";

    switch (status.toLowerCase()) {
      case "completed":
        return "status-completed";

      case "in progress":
        return "status-progress";

      case "overdue":
        return "status-overdue";

      case "on hold":
        return "status-hold";

      case "blocked":
        return "status-blocked";

      case "planning":
        return "status-planning";

      default:
        return "";
    }
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <DashboardLayout>
        <div className="dashboard-loading">
          <div className="dashboard-spinner"></div>
          <p>Loading dashboard...</p>
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
        <div className="dashboard-error">
          <h2>Dashboard</h2>
          <p>{error}</p>

          <button onClick={loadDashboard}>
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <DashboardLayout>
      <div className="dashboard-page">

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="dashboard-stats">

          <div className="stat-card">
            <div className="stat-icon projects-icon">
              📁
            </div>

            <div className="stat-content">
              <span>Total Projects</span>

              <strong>
                {summary?.stats?.projects ?? 0}
              </strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon tasks-icon">
              ☑
            </div>

            <div className="stat-content">
              <span>Total Tasks</span>

              <strong>
                {totalTasks}
              </strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon users-icon">
              👥
            </div>

            <div className="stat-content">
              <span>Total Users</span>

              <strong>
                {summary?.stats?.users ?? "—"}
              </strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon overdue-icon">
              ⚑
            </div>

            <div className="stat-content">
              <span>Overdue Tasks</span>

              <strong>
                {overdueTasks}
              </strong>
            </div>
          </div>


          <div className="stat-card">
            <div className="stat-icon completed-icon">
              ✓
            </div>

            <div className="stat-content">
              <span>Completed Tasks</span>

              <strong>
                {completedTasks}
              </strong>
            </div>
          </div>

        </div>


        {/* =====================================================
            MAIN DASHBOARD GRID
        ===================================================== */}

        <div className="dashboard-grid">

          {/* ===================================================
              OVERALL PROJECT PROGRESS
          =================================================== */}

          <section className="dashboard-panel progress-panel">

            <div className="panel-header">
              <h2>
                Overall Project Progress
              </h2>
            </div>


            <div className="overall-progress-content">

              <div className="overall-progress-chart">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={
                        overallProgressChartData
                      }
                      cx="50%"
                      cy="50%"
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={65}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >

                      <Cell
                        fill="#22c55e"
                      />

                      <Cell
                        fill="#e5e7eb"
                      />

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toFixed(0)}%`
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>


                <div className="overall-progress-center">

                  <strong>
                    {overallProgress.toFixed(0)}%
                  </strong>

                  <span>
                    Overall Progress
                  </span>

                </div>

              </div>


              <div className="overall-progress-info">

                <div className="progress-info-highlight">

                  <span className="progress-info-icon">
                    ↗
                  </span>

                  <div>
                    <strong>
                      Overall project performance
                    </strong>

                    <span>
                      Average progress across all visible projects
                    </span>
                  </div>

                </div>


                <div className="progress-summary-row">

                  <div>
                    <span className="summary-dot completed-dot"></span>
                    <span>Completed</span>
                  </div>

                  <strong>
                    {overallProgress.toFixed(0)}%
                  </strong>

                </div>


                <div className="progress-summary-row">

                  <div>
                    <span className="summary-dot remaining-dot"></span>
                    <span>Remaining</span>
                  </div>

                  <strong>
                    {(100 - overallProgress).toFixed(0)}%
                  </strong>

                </div>

              </div>

            </div>

          </section>


{/* ===================================================
    TASKS BY STATUS
=================================================== */}

<section className="dashboard-panel status-panel">

  <div className="panel-header">
    <h2>
      Tasks by Status
    </h2>
  </div>

  <div className="status-content">

    {/* =========================
        DONUT CHART
    ========================= */}

    <div className="status-chart">

      {totalTasks === 0 ? (
        <div className="empty-chart">
          No tasks available
        </div>
      ) : (

        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <PieChart>

            <Pie
              data={statusChartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >

              {statusChartData.map(
                (entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      STATUS_COLORS[index]
                    }
                  />
                )
              )}

            </Pie>

            <Tooltip />

          </PieChart>

        </ResponsiveContainer>

      )}

      {/* TOTAL TASKS IN CENTER */}

      <div className="status-total">

        <strong>
          {totalTasks}
        </strong>

        <span>
          Total Tasks
        </span>

      </div>

    </div>


    {/* =========================
        STATUS LIST
    ========================= */}

    <div className="status-list">

      {statusChartData.map(
        (item, index) => {

          const percentage =
            totalTasks > 0
              ? (
                  (item.value /
                    totalTasks) *
                  100
                ).toFixed(1)
              : 0;

          return (
            <div
              className="status-item"
              key={item.name}
            >

              <div className="status-name">

                <span
                  className="status-dot"
                  style={{
                    background:
                      STATUS_COLORS[index],
                  }}
                />

                <span>
                  {item.name}
                </span>

              </div>

              <strong>
                {item.value}
              </strong>

              <span>
                ({percentage}%)
              </span>

            </div>
          );
        }
      )}

    </div>

  </div>

</section>


          {/* ===================================================
              UPCOMING DEADLINES
          =================================================== */}

          <section className="dashboard-panel deadlines-panel">

            <div className="panel-header">

              <h2>
                Upcoming Deadlines
              </h2>

              <button
                className="view-all-btn"
                onClick={() =>
                  navigate("/tasks")
                }
              >
                View all
              </button>

            </div>


            <div className="deadline-list">

              {upcomingDeadlines.length === 0 ? (

                <div className="empty-state">
                  No upcoming deadlines
                </div>

              ) : (

                upcomingDeadlines.map(
                  (task) => (

                    <div
                      className="deadline-item"
                      key={task.TaskID}
                    >

                      <div
                        className={`deadline-dot ${getPriorityClass(
                          task.PriorityLevel
                        )}`}
                      />


                      <div className="deadline-info">

                        <strong>
                          {task.TaskTitle}
                        </strong>

                        <span>
                          {task.ProjectName}
                        </span>

                      </div>


                      <div className="deadline-date">

                        <strong>
                          {formatDate(
                            task.DueDate
                          )}
                        </strong>

                        <span
                          className={
                            task.Status ===
                            "Overdue"
                              ? "overdue-text"
                              : ""
                          }
                        >
                          {getDaysLeft(
                            task.DueDate
                          )}
                        </span>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </section>


          {/* ===================================================
              RECENT PROJECTS
          =================================================== */}

          <section className="dashboard-panel recent-projects-panel">

  <div className="panel-header recent-projects-header">

    <div>
      <h2>Recent Projects</h2>

      <span className="recent-projects-subtitle">
        Latest projects in the system
      </span>
    </div>

    <div className="recent-projects-actions">

      <div className="project-search-box">

        <span className="project-search-icon">
          ⌕
        </span>

        <input
          type="text"
          value={projectSearch}
          onChange={(e) =>
            setProjectSearch(e.target.value)
          }
          placeholder="Search by Project ID..."
          inputMode="numeric"
        />

        {projectSearch && (
          <button
            type="button"
            className="project-search-clear"
            onClick={() => setProjectSearch("")}
            aria-label="Clear project search"
          >
            ×
          </button>
        )}

      </div>

      <button
        type="button"
        className="view-all-btn"
        onClick={() => navigate("/projects")}
      >
        View all
      </button>

    </div>

  </div>


  {filteredRecentProjects.length === 0 ? (

    <div className="projects-cards-empty">

      <strong>
        No project found
      </strong>

      <span>
        {projectSearch
          ? "Try another Project ID."
          : "No projects available."}
      </span>

    </div>

  ) : (

    <div className="projects-table-wrapper">

      <table className="recent-projects-table">

        <thead>

          <tr>

            <th>Project ID</th>

            <th>Project Name</th>

            <th>Status</th>

            <th>Total Tasks</th>

            <th>Completed Tasks</th>

            <th>Total Issues</th>

            <th>Resolved Issues</th>

            <th>Total Risks</th>

            <th>Closed Risks</th>

            <th>Overall Progress</th>

          </tr>

        </thead>


        <tbody>

          {filteredRecentProjects.map(
            (project) => {

              const projectId =
                Number(project.projectId);

              const progressValue =
                Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      project.overallProgress || 0
                    )
                  )
                );

              const statusClass =
                getStatusClass(
                  project.status
                ) || "status-planning";


              return (

                <tr
                  key={projectId}
                  onClick={() =>
                    navigate(
                      `/projects/${projectId}`
                    )
                  }
                  className="recent-project-row"
                >

                  {/* PROJECT ID */}

                  <td>
                    <strong>
                      #{projectId}
                    </strong>
                  </td>


                  {/* PROJECT NAME */}

                  <td>
                    <strong
                      title={project.projectName}
                    >
                      {project.projectName || "-"}
                    </strong>
                  </td>


                  {/* STATUS */}

                  <td>

                    <span
                      className={`dashboard-project-status ${statusClass}`}
                    >
                      {project.status || "Planning"}
                    </span>

                  </td>


                  {/* TOTAL TASKS */}

                  <td>
                    {Number(
                      project.totalTasks || 0
                    )}
                  </td>


                  {/* COMPLETED TASKS */}

                  <td>
                    {Number(
                      project.completedTasks || 0
                    )}
                  </td>


                  {/* TOTAL ISSUES */}

                  <td>
                    {Number(
                      project.totalIssues || 0
                    )}
                  </td>


                  {/* RESOLVED ISSUES */}

                  <td>
                    {Number(
                      project.resolvedIssues || 0
                    )}
                  </td>


                  {/* TOTAL RISKS */}

                  <td>
                    {Number(
                      project.totalRisks || 0
                    )}
                  </td>


                  {/* CLOSED RISKS */}

                  <td>
                    {Number(
                      project.closedRisks || 0
                    )}
                  </td>


                  {/* OVERALL PROGRESS */}

                  <td>

                    <div className="project-progress-cell">

                      <div className="project-progress-bar">

                        <div
                          className="project-progress-fill"
                          style={{
                            width: `${progressValue}%`,
                          }}
                        />

                      </div>

                      <strong>
                        {progressValue.toFixed(0)}%
                      </strong>

                    </div>

                  </td>

                </tr>

              );

            }
          )}

        </tbody>

      </table>

    </div>

  )}


  <div className="projects-cards-footer">

    <span>

      {projectSearch

        ? `Showing ${filteredRecentProjects.length} matching project${
            filteredRecentProjects.length === 1
              ? ""
              : "s"
          }`

        : `Showing ${filteredRecentProjects.length} recent projects`}

    </span>


    <button
      type="button"
      onClick={() =>
        navigate("/projects")
      }
    >
      View all projects →
    </button>

  </div>

</section>
          {/* ===================================================
              TASKS BY PRIORITY
          =================================================== */}

          <section className="dashboard-panel priority-panel">

            <div className="panel-header">

              <h2>
                Tasks by Priority
              </h2>

            </div>


            <div className="priority-chart">

              {priorityChartData.length ===
              0 ? (

                <div className="empty-chart">
                  No priority data available
                </div>

              ) : (

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <BarChart
                    layout="vertical"
                    data={priorityChartData}
                    margin={{
                      top: 10,
                      right: 18,
                      left: 5,
                      bottom: 10,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                    />

                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <YAxis
                      type="category"
                      dataKey="priority"
                      width={65}
                      tick={{
                        fontSize: 12,
                      }}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      name="Tasks"
                      fill="#f59e0b"
                      radius={[
                        0,
                        6,
                        6,
                        0,
                      ]}
                    />

                  </BarChart>

                </ResponsiveContainer>

              )}

            </div>

          </section>

        </div>

      </div>
    </DashboardLayout>
  );
}

export default Dashboard;