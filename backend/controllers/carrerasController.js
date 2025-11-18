// controllers/carrerasController.js
const db = require('../config/database');

const carrerasController = {
    // Obtener todas las carreras
    getAll: async (req, res) => {
        try {
            const result = await db.query(
                'SELECT * FROM carreras ORDER BY nombre'
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error al obtener carreras:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener carrera por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query(
                'SELECT * FROM carreras WHERE id = $1',
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Carrera no encontrada'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error al obtener carrera:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Crear nueva carrera
    create: async (req, res) => {
        try {
            const { resolucion, nombre, horas } = req.body;

            // Validaciones
            if (!resolucion || !nombre || !horas) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son obligatorios'
                });
            }

            // Verificar si ya existe una carrera con la misma resolución
            const carreraExistente = await db.query(
                'SELECT id FROM carreras WHERE resolucion = $1',
                [resolucion]
            );

            if (carreraExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe una carrera con esa resolución'
                });
            }

            const result = await db.query(
                `INSERT INTO carreras (resolucion, nombre, horas) 
                 VALUES ($1, $2, $3) RETURNING *`,
                [resolucion, nombre, horas]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Carrera creada correctamente'
            });
        } catch (error) {
            console.error('Error al crear carrera:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Actualizar carrera
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { resolucion, nombre, horas } = req.body;

            // Validaciones
            if (!resolucion || !nombre || !horas) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son obligatorios'
                });
            }

            // Verificar si la carrera existe
            const carreraExistente = await db.query(
                'SELECT id FROM carreras WHERE id = $1',
                [id]
            );

            if (carreraExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Carrera no encontrada'
                });
            }

            // Verificar si ya existe otra carrera con la misma resolución
            const resolucionExistente = await db.query(
                'SELECT id FROM carreras WHERE resolucion = $1 AND id != $2',
                [resolucion, id]
            );

            if (resolucionExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe otra carrera con esa resolución'
                });
            }

            const result = await db.query(
                `UPDATE carreras 
                 SET resolucion = $1, nombre = $2, horas = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4 RETURNING *`,
                [resolucion, nombre, horas, id]
            );

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Carrera actualizada correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar carrera:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Eliminar carrera - CORREGIDO
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si la carrera existe
            const carreraExistente = await db.query(
                'SELECT id FROM carreras WHERE id = $1',
                [id]
            );

            if (carreraExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Carrera no encontrada'
                });
            }

            // Verificar si hay estudiantes en esta carrera
            const estudiantesEnCarrera = await db.query(
                'SELECT id FROM estudiantes WHERE carrera_id = $1 LIMIT 1',
                [id]
            );

            if (estudiantesEnCarrera.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la carrera porque tiene estudiantes asociados'
                });
            }

            // Verificar si hay materias en esta carrera
            const materiasEnCarrera = await db.query(
                'SELECT id FROM materias WHERE carrera_id = $1 LIMIT 1',
                [id]
            );

            if (materiasEnCarrera.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la carrera porque tiene materias asociadas'
                });
            }

            // Eliminar la carrera
            await db.query('DELETE FROM carreras WHERE id = $1', [id]);

            res.json({
                success: true,
                message: 'Carrera eliminada correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar carrera:', error);
            
            // Manejar error de clave foránea
            if (error.code === '23503') { // Código de violación de clave foránea en PostgreSQL
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la carrera porque tiene registros relacionados'
                });
            }
            
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // NUEVO: Obtener estadísticas de la carrera
    getEstadisticas: async (req, res) => {
        try {
            const { id } = req.params;
            
            const estadisticas = await db.query(
                `SELECT 
                    COUNT(DISTINCT e.id) as total_estudiantes,
                    COUNT(DISTINCT m.id) as total_materias
                 FROM carreras c
                 LEFT JOIN estudiantes e ON c.id = e.carrera_id
                 LEFT JOIN materias m ON c.id = m.carrera_id
                 WHERE c.id = $1
                 GROUP BY c.id`,
                [id]
            );

            res.json({
                success: true,
                data: estadisticas.rows[0] || { total_estudiantes: 0, total_materias: 0 }
            });
        } catch (error) {
            console.error('Error al obtener estadísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = carrerasController;