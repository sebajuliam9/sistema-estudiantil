// controllers/materiasController.js
const db = require('../config/database');

const materiasController = {
    // Obtener todas las materias
    getAll: async (req, res) => {
        try {
            const result = await db.query(
                `SELECT m.*, c.nombre as carrera_nombre 
                 FROM materias m 
                 JOIN carreras c ON m.carrera_id = c.id 
                 ORDER BY c.nombre, m.curso, m.nombre`
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error al obtener materias:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener materias por carrera
    getByCarrera: async (req, res) => {
        try {
            const { carreraId } = req.params;
            const result = await db.query(
                `SELECT m.*, c.nombre as carrera_nombre 
                 FROM materias m 
                 JOIN carreras c ON m.carrera_id = c.id 
                 WHERE m.carrera_id = $1 
                 ORDER BY m.curso, m.nombre`,
                [carreraId]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error al obtener materias por carrera:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener materia por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query(
                `SELECT m.*, c.nombre as carrera_nombre 
                 FROM materias m 
                 JOIN carreras c ON m.carrera_id = c.id 
                 WHERE m.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Materia no encontrada'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error al obtener materia:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Crear nueva materia
    create: async (req, res) => {
        try {
            const { carrera_id, nombre, curso, regimen } = req.body;

            // Validaciones
            if (!carrera_id || !nombre || !curso || !regimen) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son obligatorios'
                });
            }

            // Verificar que la carrera exista
            const carreraExistente = await db.query(
                'SELECT id FROM carreras WHERE id = $1',
                [carrera_id]
            );

            if (carreraExistente.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'La carrera seleccionada no existe'
                });
            }

            // Verificar si ya existe una materia con el mismo nombre en la misma carrera y curso
            const materiaExistente = await db.query(
                'SELECT id FROM materias WHERE carrera_id = $1 AND nombre = $2 AND curso = $3',
                [carrera_id, nombre, curso]
            );

            if (materiaExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe una materia con ese nombre en el mismo curso de esta carrera'
                });
            }

            const result = await db.query(
                `INSERT INTO materias (carrera_id, nombre, curso, regimen) 
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [carrera_id, nombre, curso, regimen]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Materia creada correctamente'
            });
        } catch (error) {
            console.error('Error al crear materia:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Actualizar materia
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { carrera_id, nombre, curso, regimen } = req.body;

            // Validaciones
            if (!carrera_id || !nombre || !curso || !regimen) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son obligatorios'
                });
            }

            // Verificar si la materia existe
            const materiaExistente = await db.query(
                'SELECT id FROM materias WHERE id = $1',
                [id]
            );

            if (materiaExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Materia no encontrada'
                });
            }

            // Verificar que la carrera exista
            const carreraExistente = await db.query(
                'SELECT id FROM carreras WHERE id = $1',
                [carrera_id]
            );

            if (carreraExistente.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'La carrera seleccionada no existe'
                });
            }

            // Verificar si ya existe otra materia con el mismo nombre en la misma carrera y curso
            const materiaDuplicada = await db.query(
                'SELECT id FROM materias WHERE carrera_id = $1 AND nombre = $2 AND curso = $3 AND id != $4',
                [carrera_id, nombre, curso, id]
            );

            if (materiaDuplicada.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe otra materia con ese nombre en el mismo curso de esta carrera'
                });
            }

            const result = await db.query(
                `UPDATE materias 
                 SET carrera_id = $1, nombre = $2, curso = $3, regimen = $4, 
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5 RETURNING *`,
                [carrera_id, nombre, curso, regimen, id]
            );

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Materia actualizada correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar materia:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Eliminar materia
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si la materia existe
            const materiaExistente = await db.query(
                'SELECT id FROM materias WHERE id = $1',
                [id]
            );

            if (materiaExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Materia no encontrada'
                });
            }

            // Verificar si la materia tiene notas asociadas
            const notasExistente = await db.query(
                'SELECT id FROM notas WHERE materia_id = $1',
                [id]
            );

            if (notasExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar la materia porque tiene notas asociadas'
                });
            }

            await db.query('DELETE FROM materias WHERE id = $1', [id]);

            res.json({
                success: true,
                message: 'Materia eliminada correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar materia:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener materias agrupadas por curso para una carrera
    getByCarreraAgrupadas: async (req, res) => {
        try {
            const { carreraId } = req.params;
            const result = await db.query(
                `SELECT m.*, c.nombre as carrera_nombre 
                 FROM materias m 
                 JOIN carreras c ON m.carrera_id = c.id 
                 WHERE m.carrera_id = $1 
                 ORDER BY 
                    CASE m.curso 
                        WHEN '1er año' THEN 1
                        WHEN '2do año' THEN 2
                        WHEN '3er año' THEN 3
                        WHEN '4to año' THEN 4
                        ELSE 5
                    END, m.nombre`,
                [carreraId]
            );

            // Agrupar materias por curso
            const materiasAgrupadas = result.rows.reduce((acc, materia) => {
                const curso = materia.curso;
                if (!acc[curso]) {
                    acc[curso] = [];
                }
                acc[curso].push(materia);
                return acc;
            }, {});

            res.json({
                success: true,
                data: materiasAgrupadas
            });
        } catch (error) {
            console.error('Error al obtener materias agrupadas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = materiasController;