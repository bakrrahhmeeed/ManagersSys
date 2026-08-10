const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    } 
}

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('done');
    } catch (err) {
        console.error('Database connection error:', err);
    }
}



module.exports = {
    sql,
    connectDB
};