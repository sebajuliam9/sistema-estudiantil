// models/Nota.js - Modelo de Nota
const db = require('../config/database');

class Nota {
    // Obtener todas las notas
    static async getAll() {
        const result = await db.query(
            `SELECT n.*, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido,
                    m.nombre as materia_nombre, m.curso
             FROM notas n
             JOIN estudiantes e ON n.estudiante_id = e.id
             JOIN materias m ON n.materia_id = m.id
             ORDER BY e.apellido, e.nombre, m.curso`
        );
        return result.rows;
    }

    // Obtener nota por ID
    static async getById(id) {
        const result = await db.query(
            `SELECT n.*, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido,
                    m.nombre as materia_nombre, m.curso
             FROM notas n
             JOIN estudiantes e ON n.estudiante_id = e.id
             JOIN materias m ON n.materia_id = m.id
             WHERE n.id = $1`,
            [id]
        );
        return result.rows[0];
    }

    // Crear nueva nota
    static async create(notaData) {
        const { estudiante_id, materia_id, calificacion, fecha_aprobacion, condicion } = notaData;
        const result = await db.query(
            `INSERT INTO notas (estudiante_id, materia_id, calificacion, fecha_aprobacion, condicion)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [estudiante_id, materia_id, calificacion, fecha_aprobacion, condicion]
        );
        return result.rows[0];
    }

    // Actualizar nota
    static async update(id, notaData) {
        const { calificacion, fecha_aprobacion, condicion } = notaData;
        const result = await db.query(
            `UPDATE notas 
             SET calificacion = $1, fecha_aprobacion = $2, condicion = $3
             WHERE id = $4 RETURNING *`,
            [calificacion, fecha_aprobacion, condicion, id]
        );
        return result.rows[0];
    }

    // Eliminar nota
    static async delete(id) {
        const result = await db.query(
            'DELETE FROM notas WHERE id = $1 RETURNING *',
            [id]
        );
        return result.rows[0];
    }

    // Obtener notas por estudiante
    static async getByEstudiante(estudianteId) {
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

    // Obtener notas por materia
    static async getByMateria(materiaId) {
        const result = await db.query(
            `SELECT n.*, e.nombre as estudiante_nombre, e.apellido as estudiante_apellido
             FROM notas n
             JOIN estudiantes e ON n.estudiante_id = e.id
             WHERE n.materia_id = $1
             ORDER BY e.apellido, e.nombre`,
            [materiaId]
        );
        return result.rows;
    }

    // Verificar si existe nota para estudiante y materia
    static async existsForEstudianteMateria(estudianteId, materiaId) {
        const result = await db.query(
            'SELECT id FROM notas WHERE estudiante_id = $1 AND materia_id = $2',
            [estudianteId, materiaId]
        );
        return result.rows.length > 0;
    }
}

module.exports = Nota;