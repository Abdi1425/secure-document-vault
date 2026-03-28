/**
 * DATABASE CONFIGURATION
 * 
 * PURPOSE: Establishes and manages MySQL database connection
 * TECH: mysql package
 */

const mysql = require('mysql');

// Create connection pool (better for production)
const pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ MySQL Database connected successfully');
        connection.release();
    }
});

module.exports = pool;
