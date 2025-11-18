const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    timezone: '+00:00'
});

// Test connection
pool.getConnection()
    .then(connection => {
        console.log('Database pool created successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Database pool creation failed:', err);
    });

module.exports = pool;
