/* Copy this file into MangersSys/Server, then run:
   node seed-dev-data.js
*/

require("dotenv").config();
const sql = require("mssql");
const bcrypt = require("bcrypt");

const cfg = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,

    options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
            process.env.DB_TRUST_SERVER_CERTIFICATE === "true",
    },
};

const ADMIN_ID = 2;
const ADMIN_ROLE = 1;

const plusDays = (date, days) => {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

const users = [
    ["nadia.pmo", "Nadia El Sherif", "nadia.elsherif@example.test", "IT", "PMO Manager"],
    ["youssef.pmo", "Youssef Nabil", "youssef.nabil@example.test", "Operations", "PMO Manager"],

    ["omar.salem", "Omar Salem", "omar.salem@example.test", "IT", "Project Manager"],
    ["layla.hassan", "Layla Hassan", "layla.hassan@example.test", "Engineering", "Project Manager"],
    ["karim.fawzy", "Karim Fawzy", "karim.fawzy@example.test", "Operations", "Project Manager"],

    ["mona.it", "Mona Adel", "mona.adel@example.test", "IT", "Department Manager"],
    ["tarek.eng", "Tarek Mostafa", "tarek.mostafa@example.test", "Engineering", "Department Manager"],
    ["reham.ops", "Reham Saad", "reham.saad@example.test", "Operations", "Department Manager"],

    ["sherif.exec", "Sherif Kamal", "sherif.kamal@example.test", "Finance", "Executive Manager"],
    ["dina.exec", "Dina Ayman", "dina.ayman@example.test", "HR", "Executive Manager"],

    ["salma.secretary", "Salma Hany", "salma.hany@example.test", "HR", "Secretary"],

    ["ahmed.dev", "Ahmed Magdy", "ahmed.magdy@example.test", "IT", "Employee"],
    ["sara.qa", "Sara Emad", "sara.emad@example.test", "IT", "Employee"],
    ["mostafa.net", "Mostafa Reda", "mostafa.reda@example.test", "IT", "Employee"],
    ["noor.backend", "Noor Samir", "noor.samir@example.test", "Engineering", "Employee"],
    ["hassan.frontend", "Hassan Ali", "hassan.ali@example.test", "Engineering", "Employee"],
    ["mariam.proc", "Mariam Tamer", "mariam.tamer@example.test", "Operations", "Employee"],
    ["ziad.proc", "Ziad Ashraf", "ziad.ashraf@example.test", "Operations", "Employee"],
    ["fatma.finance", "Fatma Wael", "fatma.wael@example.test", "Finance", "Employee"],
    ["mahmoud.buy", "Mahmoud Eid", "mahmoud.eid@example.test", "Purchasing", "Employee"],
];

const projects = [
    [
        "ERP System Upgrade",
        "Modernize finance, procurement, and reporting workflows.",
        "Internal",
        "High",
        "Completed",
        100,
        "2025-01-15",
        "2025-08-30",
        "2025-08-25",
        "omar.salem",
        true,
        ["IT", "Finance"],
    ],
    [
        "Customer Portal",
        "Launch a self-service portal for customer account and service requests.",
        "External",
        "High",
        "In Progress",
        68,
        "2026-02-01",
        "2026-11-30",
        null,
        "layla.hassan",
        true,
        ["Engineering", "Operations"],
    ],
    [
        "HR Management System",
        "Implement employee onboarding, leave, and performance workflows.",
        "Internal",
        "Medium",
        "Planning",
        10,
        "2026-09-01",
        "2027-04-30",
        null,
        "karim.fawzy",
        false,
        ["HR", "IT"],
    ],
    [
        "Network Infrastructure Upgrade",
        "Refresh core switching, Wi-Fi, and branch connectivity.",
        "Internal",
        "Critical",
        "In Progress",
        55,
        "2026-01-10",
        "2026-10-15",
        null,
        "omar.salem",
        true,
        ["IT", "Operations"],
    ],
    [
        "Mobile Application",
        "Deliver a mobile companion application for customers.",
        "External",
        "High",
        "In Progress",
        42,
        "2026-03-15",
        "2027-01-31",
        null,
        "layla.hassan",
        false,
        ["Engineering", "IT"],
    ],
    [
        "E-Commerce Platform",
        "Replace the legacy online sales channel with a scalable platform.",
        "External",
        "Critical",
        "Planning",
        5,
        "2026-10-01",
        "2027-08-31",
        null,
        "karim.fawzy",
        true,
        ["Engineering", "Finance"],
    ],
    [
        "Data Migration",
        "Migrate historical records into the consolidated data platform.",
        "Internal",
        "High",
        "Completed",
        100,
        "2025-03-01",
        "2025-12-15",
        "2025-12-10",
        "omar.salem",
        true,
        ["IT", "Finance"],
    ],
    [
        "Cybersecurity Improvement",
        "Strengthen identity, endpoint, and monitoring controls.",
        "Internal",
        "Critical",
        "In Progress",
        72,
        "2026-01-05",
        "2026-09-30",
        null,
        "omar.salem",
        true,
        ["IT", "Operations"],
    ],
    [
        "Internal Automation",
        "Automate purchase requests and operational approvals.",
        "Internal",
        "Medium",
        "In Progress",
        35,
        "2026-05-01",
        "2026-12-20",
        null,
        "karim.fawzy",
        false,
        ["Operations", "Purchasing"],
    ],
    [
        "CRM Integration",
        "Integrate CRM data with sales, support, and finance systems.",
        "Business",
        "High",
        "Planning",
        0,
        "2026-11-01",
        "2027-06-30",
        null,
        "layla.hassan",
        true,
        ["Engineering", "Finance"],
    ],
];

const employeeAliases = [
    "ahmed.dev",
    "sara.qa",
    "mostafa.net",
    "noor.backend",
    "hassan.frontend",
    "mariam.proc",
    "ziad.proc",
    "fatma.finance",
    "mahmoud.buy",
];

const taskTemplates = [
    "Validate business requirements",
    "Prepare solution configuration",
    "Build integration components",
    "Execute quality assurance testing",
    "Complete user acceptance review",
    "Prepare deployment checklist",
];

const issueTitles = [
    "Vendor interface specification delayed",
    "Data quality exceptions identified",
    "Environment access approval pending",
    "Performance test threshold not met",
    "Business owner feedback overdue",
    "Training attendance below target",
    "Integration endpoint timeout",
    "Requirements scope clarification needed",
    "UAT defect backlog elevated",
    "Reporting reconciliation variance",
    "Security review action open",
    "Procurement lead time extended",
    "Mobile device compatibility gap",
    "Master data ownership unclear",
    "Deployment window conflict",
];

const riskTitles = [
    "Supplier delivery dependency",
    "Data migration completeness risk",
    "Integration API availability risk",
    "Resource capacity constraint",
    "Cybersecurity compliance exposure",
    "Budget variance risk",
    "Change adoption risk",
    "Third-party licensing delay",
    "Performance scalability risk",
    "Scope creep risk",
    "Deployment rollback risk",
    "Network outage exposure",
    "Key-person availability risk",
    "Procurement approval delay",
    "Regulatory requirement change",
];

(async () => {
    let pool;
    let tx;
    let began = false;

    try {
        // Password for all seeded development users
        const HASH = await bcrypt.hash("MangersSys@123", 10);

        pool = await sql.connect(cfg);

        tx = new sql.Transaction(pool);

        const counts = {};

        const request = () => new sql.Request(tx);

        const query = async (text, values = {}) => {
            const r = request();

            for (const [key, value] of Object.entries(values)) {
                r.input(key, value);
            }

            return r.query(text);
        };

        const insert = async (table, text, values = {}) => {
            const r = await query(text, values);

            counts[table] =
                (counts[table] || 0) + (r.rowsAffected[0] || 0);

            return r;
        };

        await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        began = true;

        // --------------------------------------------------
        // Protect Admin
        // --------------------------------------------------

        const adminBefore = (
            await query(
                `SELECT
                    UserID,
                    FullName,
                    UserName,
                    Email,
                    PasswordHash,
                    DepartmentID,
                    BranchID,
                    IsActive,
                    CreatedAt
                 FROM dbo.Users
                 WHERE UserID=@id`,
                { id: ADMIN_ID }
            )
        ).recordset[0];

        const adminRoleBefore = (
            await query(
                `SELECT COUNT(*) AS c
                 FROM dbo.UserRoles
                 WHERE UserID=@u AND RoleID=@r`,
                {
                    u: ADMIN_ID,
                    r: ADMIN_ROLE,
                }
            )
        ).recordset[0].c;

        if (!adminBefore || adminRoleBefore !== 1) {
            throw new Error(
                "The protected Admin or UserRoles row is missing."
            );
        }

        // --------------------------------------------------
        // Roles
        // --------------------------------------------------

        const roleRows = (
            await query(
                "SELECT RoleID,RoleName FROM dbo.Roles"
            )
        ).recordset;

        const roles = Object.fromEntries(
            roleRows.map((x) => [x.RoleName, x.RoleID])
        );

        for (const role of [
            "PMO Manager",
            "Project Manager",
            "Department Manager",
            "Executive Manager",
            "Employee",
            "Secretary",
        ]) {
            if (!roles[role]) {
                throw new Error(`Missing role: ${role}`);
            }
        }

        // --------------------------------------------------
        // Departments
        // --------------------------------------------------

        const deptRows = (
            await query(
                "SELECT DepartmentID,DepartmentName FROM dbo.Departments"
            )
        ).recordset;

        const depts = Object.fromEntries(
            deptRows.map((x) => [
                x.DepartmentName,
                x.DepartmentID,
            ])
        );

        for (const department of [
            "IT",
            "Engineering",
            "Purchasing",
            "Operations",
            "Finance",
            "HR",
        ]) {
            if (!depts[department]) {
                throw new Error(
                    `Missing department: ${department}`
                );
            }
        }

        // --------------------------------------------------
        // Branch
        // --------------------------------------------------

        const branch = (
            await query(
                "SELECT TOP 1 BranchID FROM dbo.Branches ORDER BY BranchID"
            )
        ).recordset[0];

        if (!branch) {
            throw new Error(
                "A branch is required to create the development users."
            );
        }

        // --------------------------------------------------
        // Users
        // --------------------------------------------------

        const ids = {};

        for (const [
            alias,
            fullName,
            email,
            department,
            role,
        ] of users) {
            const duplicate = (
                await query(
                    `SELECT COUNT(*) AS c
                     FROM dbo.Users
                     WHERE UserName=@u OR Email=@e`,
                    {
                        u: alias,
                        e: email,
                    }
                )
            ).recordset[0].c;

            if (duplicate) {
                throw new Error(
                    `Duplicate username or email: ${alias}`
                );
            }

            const out = await insert(
                "Users",
                `INSERT dbo.Users
                (
                    FullName,
                    UserName,
                    Email,
                    PasswordHash,
                    DepartmentID,
                    BranchID,
                    IsActive,
                    CreatedAt
                )
                OUTPUT INSERTED.UserID
                VALUES
                (
                    @name,
                    @user,
                    @email,
                    @hash,
                    @department,
                    @branch,
                    1,
                    GETDATE()
                )`,
                {
                    name: fullName,
                    user: alias,
                    email,
                    hash: HASH,
                    department: depts[department],
                    branch: branch.BranchID,
                }
            );

            ids[alias] = out.recordset[0].UserID;

            await insert(
                "UserRoles",
                `INSERT dbo.UserRoles
                (
                    UserID,
                    RoleID
                )
                VALUES
                (
                    @user,
                    @role
                )`,
                {
                    user: ids[alias],
                    role: roles[role],
                }
            );
        }

        // --------------------------------------------------
        // Projects + Departments + Stages
        // --------------------------------------------------

        const projectIds = {};
        const stageIds = {};

        for (const [
            name,
            description,
            type,
            priority,
            status,
            progress,
            start,
            target,
            actual,
            manager,
            strategic,
            departments,
        ] of projects) {
            const out = await insert(
                "Projects",
                `INSERT dbo.Projects
                (
                    ProjectName,
                    ProjectDescription,
                    ProjectType,
                    PriorityLevel,
                    Status,
                    ProgressPercent,
                    StartDate,
                    TargetEndDate,
                    ActualEndDate,
                    ProjectManagerID,
                    IsStrategic,
                    CreatedBy,
                    CreatedAt
                )
                OUTPUT INSERTED.ProjectID
                VALUES
                (
                    @name,
                    @description,
                    @type,
                    @priority,
                    @status,
                    @progress,
                    @start,
                    @target,
                    @actual,
                    @manager,
                    @strategic,
                    @createdBy,
                    GETDATE()
                )`,
                {
                    name,
                    description,
                    type,
                    priority,
                    status,
                    progress,
                    start,
                    target,
                    actual,
                    manager: ids[manager],
                    strategic,
                    createdBy: ADMIN_ID,
                }
            );

            projectIds[name] = out.recordset[0].ProjectID;

            for (const department of departments) {
                await insert(
                    "ProjectDepartments",
                    `INSERT dbo.ProjectDepartments
                    (
                        ProjectID,
                        DepartmentID,
                        Status,
                        StartDate,
                        EndDate,
                        CreatedAt
                    )
                    VALUES
                    (
                        @project,
                        @department,
                        @status,
                        @start,
                        @end,
                        GETDATE()
                    )`,
                    {
                        project: projectIds[name],
                        department: depts[department],
                        status:
                            status === "Completed"
                                ? "Completed"
                                : status === "Planning"
                                ? "Not Started"
                                : "In Progress",
                        start,
                        end: actual || target,
                    }
                );
            }

            const owner =
                departments[0] === "IT"
                    ? "mona.it"
                    : departments[0] === "Engineering"
                    ? "tarek.eng"
                    : departments[0] === "Operations"
                    ? "reham.ops"
                    : manager;

            for (
                const [index, stageName] of [
                    "Discovery & Design",
                    "Configuration & Build",
                    "Testing & Readiness",
                    "Deployment & Handover",
                ].entries()
            ) {
                const stageStatus =
                    status === "Completed"
                        ? "Completed"
                        : status === "Planning"
                        ? "Not Started"
                        : index === 0
                        ? "Completed"
                        : index === 1
                        ? "In Progress"
                        : "Not Started";

                const stageStart = plusDays(
                    start,
                    index * 35
                );

                const stageEnd = plusDays(
                    start,
                    (index + 1) * 35 - 3
                );

                const stage = await insert(
                    "ProjectStages",
                    `INSERT dbo.ProjectStages
                    (
                        ProjectID,
                        StageName,
                        StageOrder,
                        Status,
                        ProgressPercent,
                        StartDate,
                        EndDate,
                        ActualEndDate,
                        ResponsibleUserID,
                        Notes,
                        DepartmentID
                    )
                    OUTPUT INSERTED.StageID
                    VALUES
                    (
                        @project,
                        @name,
                        @order,
                        @status,
                        @progress,
                        @start,
                        @end,
                        @actual,
                        @owner,
                        @notes,
                        @department
                    )`,
                    {
                        project: projectIds[name],
                        name: stageName,
                        order: index + 1,
                        status: stageStatus,
                        progress:
                            stageStatus === "Completed"
                                ? 100
                                : stageStatus === "In Progress"
                                ? Math.min(80, progress)
                                : 0,
                        start: stageStart,
                        end: stageEnd,
                        actual:
                            stageStatus === "Completed"
                                ? stageEnd
                                : null,
                        owner: ids[owner],
                        notes: `Seeded ${stageName} stage for ${name}.`,
                        department:
                            depts[
                                departments[
                                    index % departments.length
                                ]
                            ],
                    }
                );

                stageIds[`${name}|${index}`] =
                    stage.recordset[0].StageID;
            }
        }

        // --------------------------------------------------
        // Tasks
        // --------------------------------------------------

        for (let p = 0; p < projects.length; p++) {
            const [
                name,
                ,
                ,
                ,
                status,
                progress,
                start,
                ,
                ,
                manager,
            ] = projects[p];

            for (let i = 0; i < 6; i++) {
                const stage = [0, 0, 1, 1, 2, 3][i];

                let taskStatus;
                let taskProgress;
                let completedDate = null;
                let blocker = null;

                if (status === "Completed") {
                    taskStatus = "Completed";
                    taskProgress = 100;
                    completedDate = plusDays(
                        start,
                        25 + i * 18
                    );
                } else if (status === "Planning") {
                    taskStatus = "Not Started";
                    taskProgress = 0;
                } else if (stage === 0) {
                    taskStatus = "Completed";
                    taskProgress = 100;
                    completedDate = plusDays(
                        start,
                        28 + i * 4
                    );
                } else if (stage === 1) {
                    taskStatus =
                        i === 3
                            ? "Blocked"
                            : "In Progress";

                    taskProgress =
                        i === 3
                            ? 45
                            : Math.min(85, progress);

                    blocker =
                        i === 3
                            ? "Awaiting vendor technical specification."
                            : null;
                } else {
                    taskStatus = "Not Started";
                    taskProgress = 0;
                }

                await insert(
                    "ProjectTasks",
                    `INSERT dbo.ProjectTasks
                    (
                        ProjectID,
                        StageID,
                        TaskTitle,
                        TaskDescription,
                        AssignedTo,
                        PriorityLevel,
                        Status,
                        ProgressPercent,
                        DueDate,
                        CompletedDate,
                        Blocker,
                        CreatedBy,
                        CreatedAt
                    )
                    VALUES
                    (
                        @project,
                        @stage,
                        @title,
                        @description,
                        @assigned,
                        @priority,
                        @status,
                        @progress,
                        @due,
                        @completed,
                        @blocker,
                        @createdBy,
                        GETDATE()
                    )`,
                    {
                        project: projectIds[name],
                        stage: stageIds[`${name}|${stage}`],
                        title: `${taskTemplates[i]} — ${name}`,
                        description: `Deliver the agreed output for ${taskTemplates[
                            i
                        ].toLowerCase()} within the ${name} project.`,
                        assigned:
                            ids[
                                employeeAliases[
                                    (p + i) %
                                        employeeAliases.length
                                ]
                            ],
                        priority:
                            i === 0
                                ? "High"
                                : i === 3
                                ? "Critical"
                                : "Medium",
                        status: taskStatus,
                        progress: taskProgress,
                        due: plusDays(
                            start,
                            45 + i * 22
                        ),
                        completed: completedDate,
                        blocker,
                        createdBy: ids[manager],
                    }
                );
            }
        }

        // --------------------------------------------------
        // Issues
        // --------------------------------------------------

        for (let i = 0; i < 15; i++) {
            const project = projects[i % 10][0];

            const status =
                ["Open", "In Progress", "Resolved", "Closed"][
                    i % 4
                ];

            await insert(
                "Issues",
                `INSERT dbo.Issues
                (
                    ProjectID,
                    IssueTitle,
                    Description,
                    PriorityLevel,
                    Status,
                    AssignedTo,
                    Resolution
                )
                VALUES
                (
                    @project,
                    @title,
                    @description,
                    @priority,
                    @status,
                    @assigned,
                    @resolution
                )`,
                {
                    project: projectIds[project],
                    title: issueTitles[i],
                    description: `Tracked development issue for ${project}; owner is coordinating remediation with stakeholders.`,
                    priority:
                        ["Low", "Medium", "High", "Critical"][
                            i % 4
                        ],
                    status,
                    assigned:
                        ids[
                            employeeAliases[
                                i % employeeAliases.length
                            ]
                        ],
                    resolution: ["Resolved", "Closed"].includes(
                        status
                    )
                        ? "Corrective action completed and verified by the project manager."
                        : null,
                }
            );
        }

        // --------------------------------------------------
        // Risks
        // --------------------------------------------------

        for (let i = 0; i < 15; i++) {
            const project = projects[i % 10][0];

            await insert(
                "Risks",
                `INSERT dbo.Risks
                (
                    ProjectID,
                    RiskTitle,
                    Description,
                    RiskLevel,
                    ImpactLevel,
                    MitigationPlan,
                    OwnerID,
                    Status
                )
                VALUES
                (
                    @project,
                    @title,
                    @description,
                    @risk,
                    @impact,
                    @mitigation,
                    @owner,
                    @status
                )`,
                {
                    project: projectIds[project],
                    title: riskTitles[i],
                    description: `Potential delivery risk for ${project} monitored in the weekly governance review.`,
                    risk:
                        ["Low", "Medium", "High"][i % 3],
                    impact:
                        ["Medium", "High", "Low"][i % 3],
                    mitigation:
                        "Assign an owner, review mitigation actions weekly, and escalate if the threshold is exceeded.",
                    owner:
                        ids[
                            employeeAliases[
                                (i + 2) %
                                    employeeAliases.length
                            ]
                        ],
                    status:
                        ["Open", "Monitoring", "Closed"][
                            i % 3
                        ],
                }
            );
        }

        // --------------------------------------------------
        // Objectives
        // --------------------------------------------------

        const objectiveIds = [];

        for (let i = 0; i < 10; i++) {
            const p = projects[i];

            const out = await insert(
                "Objectives",
                `INSERT dbo.Objectives
                (
                    ProjectID,
                    ObjectiveTitle,
                    Description,
                    OwnerID,
                    StartDate,
                    EndDate,
                    Status
                )
                OUTPUT INSERTED.ObjectiveID
                VALUES
                (
                    @project,
                    @title,
                    @description,
                    @owner,
                    @start,
                    @end,
                    @status
                )`,
                {
                    project: projectIds[p[0]],
                    title: `Deliver measurable outcomes for ${p[0]}`,
                    description: `Achieve the target business and operational benefits defined for ${p[0]}.`,
                    owner: ids[p[9]],
                    start: p[6],
                    end: p[8] || p[7],
                    status: p[4],
                }
            );

            objectiveIds.push(
                out.recordset[0].ObjectiveID
            );
        }

        // --------------------------------------------------
        // Key Results
        // --------------------------------------------------

        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 3; j++) {
                const target = [100, 95, 90][j];

                const progress =
                    projects[i][4] === "Completed"
                        ? 100
                        : projects[i][5];

                await insert(
                    "KeyResults",
                    `INSERT dbo.KeyResults
                    (
                        ObjectiveID,
                        KeyResultTitle,
                        MeasurementMethod,
                        DataSource,
                        CurrentValue,
                        TargetValue,
                        ProgressPercent,
                        UpdateFrequency,
                        ResponsibleUserID
                    )
                    VALUES
                    (
                        @objective,
                        @title,
                        @method,
                        @source,
                        @current,
                        @target,
                        @progress,
                        @frequency,
                        @owner
                    )`,
                    {
                        objective: objectiveIds[i],
                        title: [
                            "Deliver approved scope",
                            "Achieve user adoption target",
                            "Meet service quality target",
                        ][j],
                        method: "Monthly KPI measurement",
                        source: "Project status reporting",
                        current: Math.round(
                            (target * progress) / 100
                        ),
                        target,
                        progress,
                        frequency: "Monthly",
                        owner:
                            ids[
                                employeeAliases[
                                    (i + j) %
                                        employeeAliases.length
                                ]
                            ],
                    }
                );
            }
        }

        // --------------------------------------------------
        // Notifications
        // --------------------------------------------------

        for (let i = 0; i < 30; i++) {
            await insert(
                "Notifications",
                `INSERT dbo.Notifications
                (
                    UserID,
                    Title,
                    Message,
                    NotificationType,
                    IsRead,
                    CreatedAt
                )
                VALUES
                (
                    @user,
                    @title,
                    @message,
                    @type,
                    @read,
                    @date
                )`,
                {
                    user:
                        ids[
                            employeeAliases[
                                i % employeeAliases.length
                            ]
                        ],
                    title:
                        i % 2
                            ? "Task status updated"
                            : "New task assigned",
                    message: `Development notification related to ${projects[
                        i % 10
                    ][0]}.`,
                    type: i % 2 ? "Update" : "Task",
                    read: i % 3 === 0,
                    date: plusDays(
                        "2026-06-01",
                        i
                    ),
                }
            );
        }

        // --------------------------------------------------
        // Comments
        // --------------------------------------------------

        for (let i = 0; i < 24; i++) {
            await insert(
                "Comments",
                `INSERT dbo.Comments
                (
                    ReferenceType,
                    ReferenceID,
                    CommentText,
                    CreatedBy,
                    CreatedAt
                )
                VALUES
                (
                    'Project',
                    @id,
                    @text,
                    @user,
                    @date
                )`,
                {
                    id: projectIds[projects[i % 10][0]],
                    text:
                        "Progress reviewed with stakeholders; next action is tracked in the current project plan.",
                    user:
                        ids[
                            employeeAliases[
                                i % employeeAliases.length
                            ]
                        ],
                    date: plusDays(
                        "2026-05-01",
                        i * 2
                    ),
                }
            );
        }

        // --------------------------------------------------
        // Project Updates
        // --------------------------------------------------

        for (let i = 0; i < 20; i++) {
            const p = projects[i % 10];

            await insert(
                "ProjectUpdates",
                `INSERT dbo.ProjectUpdates
                (
                    ProjectID,
                    StageID,
                    Update_Text,
                    ProgressPercent,
                    CreatedBy,
                    CreatedAt
                )
                VALUES
                (
                    @project,
                    @stage,
                    @text,
                    @progress,
                    @user,
                    @date
                )`,
                {
                    project: projectIds[p[0]],
                    stage:
                        stageIds[
                            `${p[0]}|${i % 4}`
                        ],
                    text: `Weekly update: delivery activities for ${p[0]} are progressing according to the current plan.`,
                    progress: p[5],
                    user: ids[p[9]],
                    date: plusDays(
                        "2026-05-15",
                        i * 3
                    ),
                }
            );
        }

        // --------------------------------------------------
        // Audit Logs
        // --------------------------------------------------

        for (let i = 0; i < 40; i++) {
            await insert(
                "AuditLogs",
                `INSERT dbo.AuditLogs
                (
                    TableName,
                    RecordID,
                    ActionType,
                    OldValue,
                    NewValue,
                    ActionBy,
                    ActionDate
                )
                VALUES
                (
                    @table,
                    @id,
                    @action,
                    @old,
                    @new,
                    @user,
                    @date
                )`,
                {
                    table:
                        i % 2
                            ? "ProjectTasks"
                            : "Projects",

                    id: i % 2
                        ? (i % 60) + 1
                        : projectIds[
                              projects[i % 10][0]
                          ],

                    action:
                        i % 3
                            ? "UPDATE"
                            : "INSERT",

                    old:
                        i % 3
                            ? "Status: Not Started"
                            : null,

                    new:
                        i % 3
                            ? "Status: In Progress"
                            : "Seeded development record",

                    user:
                        i % 2
                            ? ids[
                                  employeeAliases[
                                      i %
                                          employeeAliases.length
                                  ]
                              ]
                            : ADMIN_ID,

                    date: plusDays(
                        "2026-04-01",
                        i * 2
                    ),
                }
            );
        }

        // --------------------------------------------------
        // Attachments
        // --------------------------------------------------

        for (let i = 0; i < 6; i++) {
            await insert(
                "Attachments",
                `INSERT dbo.Attachments
                (
                    ReferenceType,
                    ReferenceID,
                    FileName,
                    FilePath,
                    UploadedBy,
                    UploadedAt
                )
                VALUES
                (
                    'Project',
                    @id,
                    @file,
                    @path,
                    @user,
                    @date
                )`,
                {
                    id: projectIds[projects[i][0]],
                    file: `${projects[i][0].replace(
                        / /g,
                        "_"
                    )}_brief.pdf`,
                    path: `seed://attachments/${projects[
                        i
                    ][0]
                        .replace(/ /g, "_")
                        .toLowerCase()}.pdf`,
                    user: ids[employeeAliases[i]],
                    date: plusDays(
                        "2026-05-10",
                        i
                    ),
                }
            );
        }

        // --------------------------------------------------
        // Verify counts
        // --------------------------------------------------

        const expected = {
            Users: 20,
            UserRoles: 20,
            Projects: 10,
            ProjectDepartments: 20,
            ProjectStages: 40,
            ProjectTasks: 60,
            Issues: 15,
            Risks: 15,
            Objectives: 10,
            KeyResults: 30,
            Notifications: 30,
            Comments: 24,
            ProjectUpdates: 20,
            AuditLogs: 40,
            Attachments: 6,
        };

        for (const [
            table,
            expectedCount,
        ] of Object.entries(expected)) {
            if (counts[table] !== expectedCount) {
                throw new Error(
                    `${table}: expected ${expectedCount}, inserted ${
                        counts[table] || 0
                    }`
                );
            }
        }

        // --------------------------------------------------
        // Verify Admin was not changed
        // --------------------------------------------------

        const adminAfter = (
            await query(
                `SELECT
                    UserID,
                    FullName,
                    UserName,
                    Email,
                    PasswordHash,
                    DepartmentID,
                    BranchID,
                    IsActive,
                    CreatedAt
                 FROM dbo.Users
                 WHERE UserID=@id`,
                {
                    id: ADMIN_ID,
                }
            )
        ).recordset[0];

        const adminRoleAfter = (
            await query(
                `SELECT COUNT(*) AS c
                 FROM dbo.UserRoles
                 WHERE UserID=@u AND RoleID=@r`,
                {
                    u: ADMIN_ID,
                    r: ADMIN_ROLE,
                }
            )
        ).recordset[0].c;

        if (
            JSON.stringify(adminBefore) !==
                JSON.stringify(adminAfter) ||
            adminRoleAfter !== 1
        ) {
            throw new Error(
                "Protected Admin data was modified."
            );
        }

        // --------------------------------------------------
        // Commit
        // --------------------------------------------------

        await tx.commit();

        console.log(
            JSON.stringify(
                {
                    status: "committed",
                    inserted: counts,
                    protectedAdmin: true,
                    protectedAdminUserRole: true,
                },
                null,
                2
            )
        );
    } catch (error) {
        try {
            if (began && tx) {
                await tx.rollback();
            }
        } catch (_) {}

        console.error(
            "SEED_ROLLED_BACK:",
            error.message
        );

        process.exitCode = 1;
    } finally {
        if (pool) {
            await pool.close();
        }
    }
})().catch((error) => {
    console.error(
        "SEED_CONNECTION_FAILURE:",
        error.message
    );

    process.exitCode = 1;
});