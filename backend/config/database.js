// config/database.js - Configuración PostgreSQL para Railway
const { Pool } = require('pg');
require('dotenv').config();

// Railway usa una sola variable: DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Mensajes de conexión
pool.on('connect', () => {
    console.log('🔥 Conectado a PostgreSQL en Railway');
});

pool.on('error', (err) => {
    console.error('❌ Error de conexión a la base de datos:', err);
});

// Función de consulta
const query = (text, params) => {
    return pool.query(text, params);
};

// Obtener cliente
const getClient = () => {
    return pool.connect();
};

module.exports = {
    query,
    getClient
};
