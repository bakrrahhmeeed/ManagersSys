const sql = require("mssql");


const getdepartments = async () => {
    const result = await sql.query`SELECT
    DepartmentID,
    DepartmentName
FROM Departments
ORDER BY DepartmentName;`;
    return result.recordset;
};


const getDepartmentsByProject = async (projectId) => {

    const result = await sql.query`
        SELECT DISTINCT
            d.DepartmentID,
            d.DepartmentName
        FROM Departments d
        INNER JOIN ProjectDepartments pd
            ON d.DepartmentID = pd.DepartmentID
        WHERE pd.ProjectID = ${projectId}
        ORDER BY d.DepartmentName
    `;

    return result.recordset;
};


// const getDepartmentuser = async()=>{}

module.exports={
    getdepartments,
    getDepartmentsByProject
}