const sql = require('mssql');


const getObjectives = async () => {
    const result = await sql.query`select * from Objectives`;
    return result.recordset;
};

const getObjective = async (id) => {
    const result = await sql.query`select * from Objectives where ObjectiveID = ${id}`;
    if (result.recordset.length === 0) {
        throw new Error(`Objective with ID ${id} not found`);
    }
    return result.recordset[0];
};

const createObjective = async (data) => {
    
}

   
 

module.exports = {
    getObjectives,
    getObjective
};  