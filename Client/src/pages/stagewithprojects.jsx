import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaChevronRight,
    FaCalendarAlt,
    FaBuilding,
    FaPlus,
    FaSearch,
    FaLayerGroup
} from "react-icons/fa";

import { getProjectsWithStages } from "../services/stageService";
import { AuthContext } from "../context/AuthContext";
import DashboardLayout from "../layouts/DashboardLayout";

import "../styles/stagewithprojects.css";


const StageWithProjects = () => {

    const navigate = useNavigate();

    const { user } = useContext(AuthContext);

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProject, setSelectedProject] = useState("all");


    const rawRole = String(
        user?.roleName ||
        user?.RoleName ||
        user?.role ||
        user?.Role ||
        ""
    )
        .trim()
        .toLowerCase();


    const roleMap = {
        administrator: "administrator",
        admin: "administrator",

        "pmo manager": "pmo manager",
        pmomanager: "pmo manager",

        "project manager": "project manager",
        projectmanager: "project manager",

        "department manager": "department manager",
        departmentmanager: "department manager",

        secretary: "secretary",

        employee: "employee"
    };


    const role =
        roleMap[rawRole] || rawRole;


    const canAddStage =
        role === "administrator" ||
        role === "pmo manager" ||
        role === "project manager";


    useEffect(() => {

        const fetchProjectsWithStages = async () => {

            try {

                setLoading(true);
                setError("");

                const data =
                    await getProjectsWithStages();

                setProjects(data || []);

            } catch (err) {

                console.error(
                    "Failed to fetch projects with stages:",
                    err
                );

                setError(
                    err?.response?.data?.message ||
                    "Failed to load projects and stages."
                );

            } finally {

                setLoading(false);

            }

        };


        fetchProjectsWithStages();

    }, []);


    const formatDate = (date) => {

        if (!date) {
            return "N/A";
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "N/A";
        }

        return parsedDate.toLocaleDateString(
            "en-US",
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );

    };


    const getStatusClass = (status) => {

        if (!status) {
            return "not-started";
        }

        return String(status)
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-");

    };


    const getProgress = (progress) => {

        const value = Number(progress);

        if (Number.isNaN(value)) {
            return 0;
        }

        return Math.min(
            Math.max(value, 0),
            100
        );

    };


    const getProgressClass = (progress, status) => {

        const value =
            getProgress(progress);

        const normalizedStatus =
            String(status || "")
                .trim()
                .toLowerCase();

        if (
            normalizedStatus === "blocked"
        ) {
            return "blocked";
        }

        if (
            normalizedStatus === "completed" ||
            value >= 100
        ) {
            return "completed";
        }

        if (value > 0) {
            return "in-progress";
        }

        return "not-started";

    };


    // const handleStageClick = (stageId) => {

    //     navigate(
    //         `/stages/${stageId}`
    //     );

    // };


    const handleEditStage = (e, stageId) => {

    e.stopPropagation();

    navigate(
        `/stages/${stageId}/edit`
    );

};


    const handleAddStage = (projectId) => {

        navigate(
            `/stages/add?projectId=${projectId}`
        );

    };


    const handleViewAllStages = (projectId) => {

        navigate(
            `/stages/project/${projectId}`
        );

    };


    const sortedProjects = useMemo(() => {

        return [...projects].sort(
            (a, b) =>
                Number(b.ProjectID || 0) -
                Number(a.ProjectID || 0)
        );

    }, [projects]);


    const filteredProjects = useMemo(() => {

        const search =
            searchTerm.trim().toLowerCase();


        return sortedProjects.filter(
            (project) => {

                const matchesProject =
                    selectedProject === "all" ||
                    String(project.ProjectID) ===
                        String(selectedProject);


                if (!matchesProject) {
                    return false;
                }


                if (!search) {
                    return true;
                }


                const projectName =
                    String(
                        project.ProjectName || ""
                    ).toLowerCase();


                const manager =
                    String(
                        project.ProjectManager || ""
                    ).toLowerCase();


                const stages =
                    project.Stages || [];


                const stageMatches =
                    stages.some((stage) => {

                        const stageName =
                            String(
                                stage.StageName || ""
                            ).toLowerCase();


                        const department =
                            String(
                                stage.DepartmentName || ""
                            ).toLowerCase();


                        return (
                            stageName.includes(search) ||
                            department.includes(search)
                        );

                    });


                return (
                    projectName.includes(search) ||
                    manager.includes(search) ||
                    stageMatches
                );

            }
        );

    }, [
        sortedProjects,
        searchTerm,
        selectedProject
    ]);


    const pageContent = (

        <div className="stages-page">

            <div className="stages-page-header">

                <div>

                    <h1>
                        Stages by Project
                    </h1>

                    <p>
                        View and manage stages for each project.
                    </p>

                </div>

            </div>


            <div className="stages-toolbar">

                <div className="project-filter">

                    <select
                        value={selectedProject}
                        onChange={(e) =>
                            setSelectedProject(
                                e.target.value
                            )
                        }
                    >

                        <option value="all">
                            All Projects
                        </option>

                        {sortedProjects.map(
                            (project) => (

                                <option
                                    key={
                                        project.ProjectID
                                    }
                                    value={
                                        project.ProjectID
                                    }
                                >
                                    {project.ProjectName}
                                </option>

                            )
                        )}

                    </select>

                </div>


                <div className="stage-search">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search projects or stages..."
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="projects-count">

                    {filteredProjects.length}{" "}

                    {filteredProjects.length === 1
                        ? "Project"
                        : "Projects"}

                </div>

            </div>


            {filteredProjects.length === 0 ? (

                <div className="stages-empty">

                    <FaLayerGroup />

                    <h3>
                        No projects found
                    </h3>

                    <p>
                        Try changing your search or project filter.
                    </p>

                </div>

            ) : (

                <div className="projects-list">

                    {filteredProjects.map(
                        (project) => {

                            const projectProgress =
                                getProgress(
                                    project.ProgressPercent
                                );


                            const projectProgressClass =
                                getProgressClass(
                                    project.ProgressPercent,
                                    project.Status
                                );


                            const stages =
                                project.Stages || [];


                            return (

                                <section
                                    className="project-stage-card"
                                    key={
                                        project.ProjectID
                                    }
                                >

                                    <div className="project-main-header">

                                        <div className="project-identity">

                                            <div className="project-icon">
                                                <FaLayerGroup />
                                            </div>


                                            <div className="project-title">

                                                <div className="project-name-row">

                                                    <h2>
                                                        {
                                                            project.ProjectName
                                                        }
                                                    </h2>

                                                    <span
                                                        className={`project-status ${getStatusClass(
                                                            project.Status
                                                        )}`}
                                                    >
                                                        {
                                                            project.Status ||
                                                            "Not Started"
                                                        }
                                                    </span>

                                                </div>


                                                <div className="project-manager">

                                                    <span>
                                                        Project Manager:
                                                    </span>

                                                    <strong>
                                                        {
                                                            project.ProjectManager ||
                                                            "Not Assigned"
                                                        }
                                                    </strong>

                                                </div>


                                                <div className="project-dates">

                                                    <span>

                                                        <FaCalendarAlt />

                                                        <strong>
                                                            Start:
                                                        </strong>

                                                        {formatDate(
                                                            project.StartDate
                                                        )}

                                                    </span>


                                                    <span className="date-separator">
                                                        •
                                                    </span>


                                                    <span>

                                                        <strong>
                                                            End:
                                                        </strong>

                                                        {formatDate(
                                                            project.TargetEndDate
                                                        )}

                                                    </span>

                                                </div>

                                            </div>

                                        </div>


                                        <div className="project-progress">

                                            <div className="progress-top">

                                                <span>
                                                    Overall Progress
                                                </span>

                                                <strong
                                                    className={
                                                        projectProgressClass
                                                    }
                                                >
                                                    {projectProgress}%
                                                </strong>

                                            </div>


                                            <div className="progress-bar">

                                                <div
                                                    className={`progress-fill ${projectProgressClass}`}
                                                    style={{
                                                        width:
                                                            `${projectProgress}%`
                                                    }}
                                                />

                                            </div>

                                        </div>

                                    </div>


                                    <div className="project-stages-row">

                                        {stages.map(
                                            (stage) => {

                                                const stageProgress =
                                                    getProgress(
                                                        stage.ProgressPercent
                                                    );


                                                const stageEndDate =
                                                    stage.TargetEndDate ||
                                                    stage.EndDate;


                                                const stageProgressClass =
                                                    getProgressClass(
                                                        stage.ProgressPercent,
                                                        stage.Status
                                                    );


                                                return (

                                                    <div
                                                        type="button"
                                                        className="stage-card"
                                                        key={
                                                            stage.StageID
                                                        }
                                                        onClick={() =>
                                                            handleStageClick(
                                                                stage.StageID
                                                            )
                                                        }
                                                    >

                                                        <div className="stage-card-header">

    <div
        className={`stage-order ${stageProgressClass}`}
    >
        {
            stage.StageOrder
        }
    </div>

    <h4>
        {
            stage.StageName
        }
    </h4>

    <div className="stage-card-actions">

        <strong
            className={`stage-percentage ${stageProgressClass}`}
        >
            {
                stageProgress
            }%
        </strong>

        <button
            type="button"
            className="stage-edit-btn"
            onClick={(e) =>
                handleEditStage(
                    e,
                    stage.StageID
                )
            }
        >
            Edit
        </button>

    </div>

</div>


                                                        <div className="stage-date">

                                                            <FaCalendarAlt />

                                                            <span>

                                                                {formatDate(
                                                                    stage.StartDate
                                                                )}

                                                                {" - "}

                                                                {formatDate(
                                                                    stageEndDate
                                                                )}

                                                            </span>

                                                        </div>


                                                        <div className="stage-department">

                                                            <FaBuilding />

                                                            <span>
                                                                {
                                                                    stage.DepartmentName ||
                                                                    "No Department"
                                                                }
                                                            </span>

                                                        </div>



                                                    </div>

                                                );

                                            }
                                        )}


                                        {canAddStage && (

                                            <button
                                                type="button"
                                                className="add-stage-card"
                                                onClick={() =>
                                                    handleAddStage(
                                                        project.ProjectID
                                                    )
                                                }
                                            >

                                                <FaPlus />

                                                <span>
                                                    Add Stage
                                                </span>

                                            </button>

                                        )}

                                    </div>


                                    <div className="project-footer">

                                        <button
                                            type="button"
                                            className="view-all-stages"
                                            onClick={() =>
                                                handleViewAllStages(
                                                    project.ProjectID
                                                )
                                            }
                                        >

                                            <span>
                                                View All Stages (
                                                {stages.length}
                                                )
                                            </span>

                                            <FaChevronRight />

                                        </button>

                                    </div>

                                </section>

                            );

                        }
                    )}

                </div>

            )}

        </div>

    );


    if (loading) {

        return (

            <DashboardLayout>

                <div className="stages-page">

                    <div className="stages-page-header">

                        <div>

                            <h1>
                                Stages by Project
                            </h1>

                            <p>
                                View and manage stages for each project.
                            </p>

                        </div>

                    </div>


                    <div className="stages-loading">

                        Loading projects and stages...

                    </div>

                </div>

            </DashboardLayout>

        );

    }


    if (error) {

        return (

            <DashboardLayout>

                <div className="stages-page">

                    <div className="stages-page-header">

                        <div>

                            <h1>
                                Stages by Project
                            </h1>

                            <p>
                                View and manage stages for each project.
                            </p>

                        </div>

                    </div>


                    <div className="stages-error">

                        {error}

                    </div>

                </div>

            </DashboardLayout>

        );

    }


    return (

        <DashboardLayout>

            {pageContent}

        </DashboardLayout>

    );

};


export default StageWithProjects;