const sql = require('mssql');


const getissues = async () => {
    const result = await sql.query`select * from Issues`;
    return result.recordset;
};

const getissue = async (issueId) => {
    const result = await sql.query`select * from Issues where IssueID = ${issueId}`;
    if (result.recordset.length === 0) {
        const error = new Error("Issue not found.");
        error.statusCode = 404;
        throw error;
    }
    return result.recordset[0];
};

const createissue = async (issueData) => {

    const {
        issueTitle,
        projectID,
        issueDescription,
        issueStatus,
        issuePriority,
        assignedTo,
        resolution,
    } = issueData;

    

    if (
        !issueTitle ||
        !projectID ||
        !issueDescription ||
        !issueStatus ||
        !issuePriority ||
        !assignedTo
    ) {
        const error = new Error("Missing required fields.");
        error.statusCode = 400;
        throw error;
    }

  

    const project = await sql.query`
        SELECT ProjectID
        FROM Projects
        WHERE ProjectID = ${projectID}
    `;

    if (project.recordset.length === 0) {
        const error = new Error("Project not found.");
        error.statusCode = 404;
        throw error;
    }



    const user = await sql.query`
        SELECT UserID
        FROM Users
        WHERE UserID = ${assignedTo}
        AND IsActive = 1
    `;

    if (user.recordset.length === 0) {
        const error = new Error("Assigned user not found or inactive.");
        error.statusCode = 404;
        throw error;
    }


    const duplicateIssue = await sql.query`
        SELECT IssueID
        FROM Issues
        WHERE ProjectID = ${projectID}
        AND IssueTitle = ${issueTitle}
    `;

    if (duplicateIssue.recordset.length > 0) {
        const error = new Error("Issue already exists in this project.");
        error.statusCode = 400;
        throw error;
    }

 

    const validStatus = [
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    ];

    if (!validStatus.includes(issueStatus)) {
        const error = new Error("Invalid issue status.");
        error.statusCode = 400;
        throw error;
    }


    const validPriority = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    if (!validPriority.includes(issuePriority)) {
        const error = new Error("Invalid issue priority.");
        error.statusCode = 400;
        throw error;
    }



    if (issueStatus !== "Resolved" && resolution) {
        const error = new Error(
            "Resolution can only be provided when the issue is resolved."
        );
        error.statusCode = 400;
        throw error;
    }



    const result = await sql.query`
        INSERT INTO Issues
        (
            IssueTitle,
            ProjectID,
            IssueDescription,
            IssueStatus,
            IssuePriority,
            AssignedTo,
            Resolution
        )

        OUTPUT
            INSERTED.IssueID,
            INSERTED.IssueTitle,
            INSERTED.ProjectID,
            INSERTED.IssueDescription,
            INSERTED.IssueStatus,
            INSERTED.IssuePriority,
            INSERTED.AssignedTo,
            INSERTED.Resolution

        VALUES
        (
            ${issueTitle},
            ${projectID},
            ${issueDescription},
            ${issueStatus},
            ${issuePriority},
            ${assignedTo},
            ${resolution}
        )
    `;

    return {
        message: "Issue created successfully",
        issue: result.recordset[0]
    };

};

const updateissue = async (issueId, issueData) => {

    const {
        issueTitle,
        projectID,
        issueDescription,
        issueStatus,
        issuePriority,
        assignedTo,
        resolution,
    } = issueData;

  

    const existingIssue = await sql.query`
        SELECT *
        FROM Issues
        WHERE IssueID = ${issueId}
    `;

    if (existingIssue.recordset.length === 0) {
        const error = new Error("Issue not found.");
        error.statusCode = 404;
        throw error;
    }

    const currentIssue = existingIssue.recordset[0];


    const finalProjectID = projectID ?? currentIssue.ProjectID;
    const finalStatus = issueStatus ?? currentIssue.IssueStatus;
    const finalPriority = issuePriority ?? currentIssue.IssuePriority;
    const finalAssignedTo = assignedTo ?? currentIssue.AssignedTo;
    const finalResolution = resolution ?? currentIssue.Resolution;

   

    const project = await sql.query`
        SELECT ProjectID
        FROM Projects
        WHERE ProjectID = ${finalProjectID}
    `;

    if (project.recordset.length === 0) {
        const error = new Error("Project not found.");
        error.statusCode = 404;
        throw error;
    }

 

    const user = await sql.query`
        SELECT UserID
        FROM Users
        WHERE UserID = ${finalAssignedTo}
        AND IsActive = 1
    `;

    if (user.recordset.length === 0) {
        const error = new Error("Assigned user not found.");
        error.statusCode = 404;
        throw error;
    }


    const validStatus = [
        "Open",
        "In Progress",
        "Resolved",
        "Closed"
    ];

    if (!validStatus.includes(finalStatus)) {
        const error = new Error("Invalid issue status.");
        error.statusCode = 400;
        throw error;
    }



    const validPriority = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    if (!validPriority.includes(finalPriority)) {
        const error = new Error("Invalid issue priority.");
        error.statusCode = 400;
        throw error;
    }



    if (finalStatus !== "Resolved" && finalResolution) {
        const error = new Error(
            "Resolution can only be provided when the issue is resolved."
        );
        error.statusCode = 400;
        throw error;
    }

  

    const result = await sql.query`
        UPDATE Issues
        SET
            IssueTitle = COALESCE(${issueTitle}, IssueTitle),
            ProjectID = COALESCE(${projectID}, ProjectID),
            IssueDescription = COALESCE(${issueDescription}, IssueDescription),
            IssueStatus = COALESCE(${issueStatus}, IssueStatus),
            IssuePriority = COALESCE(${issuePriority}, IssuePriority),
            AssignedTo = COALESCE(${assignedTo}, AssignedTo),
            Resolution = COALESCE(${resolution}, Resolution)

        OUTPUT
            INSERTED.IssueID,
            INSERTED.IssueTitle,
            INSERTED.ProjectID,
            INSERTED.IssueDescription,
            INSERTED.IssueStatus,
            INSERTED.IssuePriority,
            INSERTED.AssignedTo,
            INSERTED.Resolution

        WHERE IssueID = ${issueId}
    `;

    return {
        message: "Issue updated successfully",
        issue: result.recordset[0]
    };

};

const deleteIssue = async (issueId) => {

    const result = await sql.query`
        DELETE FROM Issues
        WHERE IssueID = ${issueId}
    `;

    if (result.rowsAffected[0] === 0) {
        const error = new Error("Issue not found.");
        error.statusCode = 404;
        throw error;
    }

    return {
        message: "Issue deleted successfully"
    };

};

module.exports = {
    getissues,
    getissue,
    createissue,
    updateissue,
    deleteIssue
};