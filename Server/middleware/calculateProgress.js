const sql = require("mssql");

const getStageProgress = async (stageId) => {
    const pool = await sql.connect();

    const stageResult = await pool.request()
        .input("stageId", sql.Int, stageId)
        .query(`
            SELECT
                StageID,
                Status
            FROM ProjectStages
            WHERE StageID = @stageId
        `);

    if (!stageResult.recordset.length) {
        throw new Error("Stage not found");
    }

    const stage = stageResult.recordset[0];

    if (stage.Status === "Completed") {
        return 100;
    }

    if (
        stage.Status === "Not Started" ||
        stage.Status === "Blocked"
    ) {
        return 0;
    }

    const taskResult = await pool.request()
        .input("stageId", sql.Int, stageId)
        .query(`
            SELECT
                COUNT(*) AS TotalTasks,
                SUM(
                    CASE
                        WHEN Status = 'Completed' THEN 1
                        ELSE 0
                    END
                ) AS CompletedTasks
            FROM ProjectTasks
            WHERE StageID = @stageId
        `);

    const totalTasks = taskResult.recordset[0].TotalTasks || 0;
    const completedTasks =
        taskResult.recordset[0].CompletedTasks || 0;

    if (totalTasks === 0) {
        return 0;
    }

    return Number(
        ((completedTasks / totalTasks) * 100).toFixed(2)
    );
};

const getProjectProgress = async (projectId) => {
    const pool = await sql.connect();

    const result = await pool.request()
        .input("projectId", sql.Int, projectId)
        .query(`
            SELECT StageID
            FROM ProjectStages
            WHERE ProjectID = @projectId
            ORDER BY StageOrder
        `);

    if (!result.recordset.length) {
        return 0;
    }

    const stageProgresses = await Promise.all(
        result.recordset.map(stage =>
            getStageProgress(stage.StageID)
        )
    );

    const totalProgress = stageProgresses.reduce(
        (sum, progress) => sum + progress,
        0
    );

    return Number(
        (totalProgress / stageProgresses.length).toFixed(2)
    );
};

module.exports = {
    getStageProgress,
    getProjectProgress
};