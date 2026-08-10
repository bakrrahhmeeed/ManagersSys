const sql = require("mssql");

const getAllRisks = async () => {
    const result = await sql.query`
        SELECT *
        FROM Risks
    `;

    return result.recordset;
};

const getRisk = async (id) => {

    const result = await sql.query`
        SELECT *
        FROM Risks
        WHERE RiskID = ${id}
    `;

    if (result.recordset.length === 0) {
        const error = new Error("Risk not found.");
        error.statusCode = 404;
        throw error;
    }

    return result.recordset[0];

};

const createRisk = async (riskData) => {

    const {
        projectID,
        riskTitle,
        riskDescription,
        riskLevel,
        impact,
        mitigationPlan,
        owner,
        status
    } = riskData;

  

    if (
        !projectID ||
        !riskTitle ||
        !riskDescription ||
        !riskLevel ||
        !impact ||
        !mitigationPlan ||
        !owner ||
        !status
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
        WHERE UserID = ${owner}
        AND IsActive = 1
    `;

    if (user.recordset.length === 0) {
        const error = new Error("Risk owner not found or inactive.");
        error.statusCode = 404;
        throw error;
    }


    const duplicateRisk = await sql.query`
        SELECT RiskID
        FROM Risks
        WHERE ProjectID = ${projectID}
        AND RiskTitle = ${riskTitle}
    `;

    if (duplicateRisk.recordset.length > 0) {
        const error = new Error("Risk already exists in this project.");
        error.statusCode = 400;
        throw error;
    }



    const validRiskLevels = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    if (!validRiskLevels.includes(riskLevel)) {
        const error = new Error("Invalid risk level.");
        error.statusCode = 400;
        throw error;
    }

   

    const validImpact = [
        "Low",
        "Medium",
        "High"
    ];

    if (!validImpact.includes(impact)) {
        const error = new Error("Invalid impact.");
        error.statusCode = 400;
        throw error;
    }



    const validStatus = [
        "Open",
        "Monitoring",
        "Mitigated",
        "Closed"
    ];

    if (!validStatus.includes(status)) {
        const error = new Error("Invalid risk status.");
        error.statusCode = 400;
        throw error;
    }



    const result = await sql.query`
        INSERT INTO Risks
        (
            ProjectID,
            RiskTitle,
            RiskDescription,
            RiskLevel,
            Impact,
            MitigationPlan,
            Owner,
            Status
        )

        OUTPUT
            INSERTED.RiskID,
            INSERTED.ProjectID,
            INSERTED.RiskTitle,
            INSERTED.RiskDescription,
            INSERTED.RiskLevel,
            INSERTED.Impact,
            INSERTED.MitigationPlan,
            INSERTED.Owner,
            INSERTED.Status

        VALUES
        (
            ${projectID},
            ${riskTitle},
            ${riskDescription},
            ${riskLevel},
            ${impact},
            ${mitigationPlan},
            ${owner},
            ${status}
        )
    `;

    return {
        message: "Risk created successfully",
        risk: result.recordset[0]
    };

};

const updateRisk = async (id, riskData) => {

    const {
        projectID,
        riskTitle,
        riskDescription,
        riskLevel,
        impact,
        mitigationPlan,
        owner,
        status
    } = riskData;



    const existingRisk = await sql.query`
        SELECT *
        FROM Risks
        WHERE RiskID = ${id}
    `;

    if (existingRisk.recordset.length === 0) {
        const error = new Error("Risk not found.");
        error.statusCode = 404;
        throw error;
    }

    const currentRisk = existingRisk.recordset[0];

   

    const finalProjectID = projectID ?? currentRisk.ProjectID;
    const finalTitle = riskTitle ?? currentRisk.RiskTitle;
    const finalRiskLevel = riskLevel ?? currentRisk.RiskLevel;
    const finalImpact = impact ?? currentRisk.Impact;
    const finalMitigationPlan = mitigationPlan ?? currentRisk.MitigationPlan;
    const finalOwner = owner ?? currentRisk.Owner;
    const finalStatus = status ?? currentRisk.Status;

  

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
        WHERE UserID = ${finalOwner}
        AND IsActive = 1
    `;

    if (user.recordset.length === 0) {
        const error = new Error("Risk owner not found or inactive.");
        error.statusCode = 404;
        throw error;
    }

   

    const duplicateRisk = await sql.query`
        SELECT RiskID
        FROM Risks
        WHERE ProjectID = ${finalProjectID}
        AND RiskTitle = ${finalTitle}
        AND RiskID <> ${id}
    `;

    if (duplicateRisk.recordset.length > 0) {
        const error = new Error("Risk already exists in this project.");
        error.statusCode = 400;
        throw error;
    }

   

    const validRiskLevels = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    if (!validRiskLevels.includes(finalRiskLevel)) {
        const error = new Error("Invalid risk level.");
        error.statusCode = 400;
        throw error;
    }

  

    const validImpact = [
        "Low",
        "Medium",
        "High"
    ];

    if (!validImpact.includes(finalImpact)) {
        const error = new Error("Invalid impact.");
        error.statusCode = 400;
        throw error;
    }



    const validStatus = [
        "Open",
        "Monitoring",
        "Mitigated",
        "Closed"
    ];

    if (!validStatus.includes(finalStatus)) {
        const error = new Error("Invalid risk status.");
        error.statusCode = 400;
        throw error;
    }



    if (finalStatus === "Closed" && !finalMitigationPlan) {
        const error = new Error("Mitigation plan is required before closing the risk.");
        error.statusCode = 400;
        throw error;
    }

  
    const result = await sql.query`
        UPDATE Risks
        SET
            ProjectID = COALESCE(${projectID}, ProjectID),
            RiskTitle = COALESCE(${riskTitle}, RiskTitle),
            RiskDescription = COALESCE(${riskDescription}, RiskDescription),
            RiskLevel = COALESCE(${riskLevel}, RiskLevel),
            Impact = COALESCE(${impact}, Impact),
            MitigationPlan = COALESCE(${mitigationPlan}, MitigationPlan),
            Owner = COALESCE(${owner}, Owner),
            Status = COALESCE(${status}, Status)

        OUTPUT
            INSERTED.RiskID,
            INSERTED.ProjectID,
            INSERTED.RiskTitle,
            INSERTED.RiskDescription,
            INSERTED.RiskLevel,
            INSERTED.Impact,
            INSERTED.MitigationPlan,
            INSERTED.Owner,
            INSERTED.Status

        WHERE RiskID = ${id}
    `;

    return {
        message: "Risk updated successfully",
        risk: result.recordset[0]
    };

};

const deleteRisk = async (id) => {

    const result = await sql.query`
        DELETE FROM Risks
        WHERE RiskID = ${id}
    `;

    if (result.rowsAffected[0] === 0) {
        const error = new Error("Risk not found.");
        error.statusCode = 404;
        throw error;
    }

    return {
        message: "Risk deleted successfully"
    };

};

module.exports = {
    getAllRisks,
    getRisk,
    createRisk,
    updateRisk,
    deleteRisk
};


