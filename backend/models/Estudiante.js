// models/Estudiante.js - Modelo de Estudiante
const db = require('../config/database');

class Estudiante {
    // Obtener todos los estudiantes
    static async getAll() {
        const result = await db.query(
            `SELECT e.*, c.nombre as carrera_nombre 
             FROM estudiantes e 
             JOIN carreras c ON e.carrera_id = c.id 
             ORDER BY e.apellido, e.nombre`
        );
        return result.rows;
    }

    // Obtener estudiante por ID
    static async getById(id) {
        const result = await db.query(
            `SELECT e.*, c.nombre as carrera_nombre 
             FROM estudiantes e 
             JOIN carreras c ON e.carrera_id = c.id 
             WHERE e.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Buscar estudiante por DNI
    static async getByDNI(dni) {
        const result = await db.query(
            `SELECT e.*, c.nombre as carrera_nombre 
             FROM estudiantes e 
             JOIN carreras c ON e.carrera_id = c.id 
             WHERE e.dni = $1`,
            [dni]
        );
        return result.rows[0];
    }

    // Crear nuevo estudiante
    static async create(estudianteData) {
        const { dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id } = estudianteData;
        const result = await db.query(
            `INSERT INTO estudiantes (dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id]
        );
        return result.rows[0];
    }

    // Actualizar estudiante
    static async update(id, estudianteData) {
        const { dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id } = estudianteData;
        const result = await db.query(
            `UPDATE estudiantes 
             SET dni = $1, legajo = $2, nombre = $3, apellido = $4, 
                 domicilio = $5, anio_inicio = $6, carrera_id = $7,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $8 RETURNING *`,
            [dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id, id]
        );
        return result.rows[0];
    }

    // Eliminar estudiante
    static async delete(id) {
        const result = await db.query(
            'DELETE FROM estudiantes WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }

    // Verificar si existe estudiante con DNI
    static async existsByDNI(dni, excludeId = null) {
        let query = 'SELECT id FROM estudiantes WHERE dni = $1';
        const params = [dni];
        
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        
        const result = await db.query(query, params);
        return result.rows.length > 0;
    }

    // Verificar si existe estudiante con legajo
    static async existsByLegajo(legajo, excludeId = null) {
        let query = 'SELECT id FROM estudiantes WHERE legajo = $1';
        const params = [legajo];
        
        if (excludeId) {
            query += ' AND id != $2';
            params.push(excludeId);
        }
        
        const result = await db.query(query, params);
        return result.rows.length > 0;
    }

    // Obtener notas del estudiante
    static async getNotas(estudianteId) {
        const result = await db.query(
            `SELECT n.*, m.nombre as materia_nombre, m.curso, m.regimen
             FROM notas n
             JOIN materias m ON n.materia_id = m.id
             WHERE n.estudiante_id = $1
             ORDER BY m.curso, m.nombre`,
            [estudianteId]
        );
        return result.rows;
    }

    // Guardar notas del estudiante
    static async saveNotas(estudianteId, notas) {
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');

            // Eliminar notas existentes
            await client.query('DELETE FROM notas WHERE estudiante_id = $1', [estudianteId]);

            // Insertar nuevas notas
            for (const nota of notas) {
                await client.query(
                    `INSERT INTO notas (estudiante_id, materia_id, calificacion, fecha_aprobacion, condicion)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [estudianteId, nota.materia_id, nota.calificacion, nota.fecha_aprobacion, nota.condicion]
                );
            }

            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = Estudiante;