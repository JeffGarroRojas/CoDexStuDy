import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CoDexStuDy Database Client (Lightweight pg)
 * Optimizado para Neon Cloud con 1GB RAM.
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Limitado para no saturar el pooler en entornos de 1GB
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: {
        rejectUnauthorized: false
    }
});

// Health Check de conectividad
export const checkDatabaseHealth = async () => {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT version(), now()');
        console.log('✓ Conexión con Neon (AWS East-1) Certificada:', res.rows[0].now);
        return true;
    } catch (err) {
        console.error('❌ Error de conexión con Neon:', err);
        return false;
    } finally {
        client.release();
    }
};

export default pool;
