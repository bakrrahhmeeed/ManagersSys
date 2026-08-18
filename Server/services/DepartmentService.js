const sql = require("mssql");


const getdepartments = async () => {
    const result = await sql.query`SELECT
    DepartmentID,
    DepartmentName
FROM Departments
ORDER BY DepartmentName;`;
    return result.recordset;
};


const getDepartmentuser = async()=>{}

module.exports={
    getdepartments
}