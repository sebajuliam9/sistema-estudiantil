// controllers/estudiantesController.js
const db = require('../config/database');

const estudiantesController = {
    // Obtener todos los estudiantes
    getAll: async (req, res) => {
        try {
            const result = await db.query(
                `SELECT e.*, c.nombre as carrera_nombre 
                 FROM estudiantes e 
                 JOIN carreras c ON e.carrera_id = c.id 
                 ORDER BY e.apellido, e.nombre`
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error al obtener estudiantes:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Buscar estudiante por DNI
    buscarPorDNI: async (req, res) => {
        try {
            const { dni } = req.params;
            const result = await db.query(
                `SELECT e.*, c.nombre as carrera_nombre 
                 FROM estudiantes e 
                 JOIN carreras c ON e.carrera_id = c.id 
                 WHERE e.dni = $1`,
                [dni]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error al buscar estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener estudiante por ID
    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query(
                `SELECT e.*, c.nombre as carrera_nombre 
                 FROM estudiantes e 
                 JOIN carreras c ON e.carrera_id = c.id 
                 WHERE e.id = $1`,
                [id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            res.json({
                success: true,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Error al obtener estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Crear nuevo estudiante
    create: async (req, res) => {
        try {
            const { dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id } = req.body;

            // Validaciones
            if (!dni || !legajo || !nombre || !apellido || !domicilio || !anio_inicio || !carrera_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son obligatorios'
                });
            }

            // Verificar si ya existe un estudiante con el mismo DNI
            const dniExistente = await db.query(
                'SELECT id FROM estudiantes WHERE dni = $1',
                [dni]
            );

            if (dniExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe un estudiante con ese DNI'
                });
            }

            // Verificar si ya existe un estudiante con el mismo legajo
            const legajoExistente = await db.query(
                'SELECT id FROM estudiantes WHERE legajo = $1',
                [legajo]
            );

            if (legajoExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe un estudiante con ese número de legajo'
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

            const result = await db.query(
                `INSERT INTO estudiantes (dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id]
            );

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Estudiante creado correctamente'
            });
        } catch (error) {
            console.error('Error al crear estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Actualizar estudiante
    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id } = req.body;

            // Validaciones
            if (!dni || !legajo || !nombre || !apellido || !domicilio || !anio_inicio || !carrera_id) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos son obligatorios'
                });
            }

            // Verificar si el estudiante existe
            const estudianteExistente = await db.query(
                'SELECT id FROM estudiantes WHERE id = $1',
                [id]
            );

            if (estudianteExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // Verificar si ya existe otro estudiante con el mismo DNI
            const dniExistente = await db.query(
                'SELECT id FROM estudiantes WHERE dni = $1 AND id != $2',
                [dni, id]
            );

            if (dniExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe otro estudiante con ese DNI'
                });
            }

            // Verificar si ya existe otro estudiante con el mismo legajo
            const legajoExistente = await db.query(
                'SELECT id FROM estudiantes WHERE legajo = $1 AND id != $2',
                [legajo, id]
            );

            if (legajoExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe otro estudiante con ese número de legajo'
                });
            }

            const result = await db.query(
                `UPDATE estudiantes 
                 SET dni = $1, legajo = $2, nombre = $3, apellido = $4, 
                     domicilio = $5, anio_inicio = $6, carrera_id = $7,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8 RETURNING *`,
                [dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id, id]
            );

            res.json({
                success: true,
                data: result.rows[0],
                message: 'Estudiante actualizado correctamente'
            });
        } catch (error) {
            console.error('Error al actualizar estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Eliminar estudiante
    delete: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si el estudiante existe
            const estudianteExistente = await db.query(
                'SELECT id FROM estudiantes WHERE id = $1',
                [id]
            );

            if (estudianteExistente.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Estudiante no encontrado'
                });
            }

            // Verificar si el estudiante tiene notas
            const notasExistente = await db.query(
                'SELECT id FROM notas WHERE estudiante_id = $1',
                [id]
            );

            if (notasExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar el estudiante porque tiene notas asociadas'
                });
            }

            // Verificar si el estudiante tiene analíticos
            const analiticosExistente = await db.query(
                'SELECT id FROM analiticos WHERE estudiante_id = $1',
                [id]
            );

            if (analiticosExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se puede eliminar el estudiante porque tiene analíticos asociados'
                });
            }

            // Eliminar usuario si existe
            await db.query('DELETE FROM usuarios WHERE estudiante_id = $1', [id]);

            await db.query('DELETE FROM estudiantes WHERE id = $1', [id]);

            res.json({
                success: true,
                message: 'Estudiante eliminado correctamente'
            });
        } catch (error) {
            console.error('Error al eliminar estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Obtener notas del estudiante
    getNotas: async (req, res) => {
        try {
            const { id } = req.params;
            const result = await db.query(
                `SELECT n.*, m.nombre as materia_nombre, m.curso, m.regimen
                 FROM notas n
                 JOIN materias m ON n.materia_id = m.id
                 WHERE n.estudiante_id = $1
                 ORDER BY m.curso, m.nombre`,
                [id]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error al obtener notas del estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // Guardar notas del estudiante
    guardarNotas: async (req, res) => {
        const client = await db.getClient();
        
        try {
            const { id } = req.params;
            const { notas } = req.body;

            await client.query('BEGIN');

            // Eliminar notas existentes para este estudiante
            await client.query('DELETE FROM notas WHERE estudiante_id = $1', [id]);

            // Insertar nuevas notas
            for (const nota of notas) {
                await client.query(
                    `INSERT INTO notas (estudiante_id, materia_id, calificacion, fecha_aprobacion, condicion)
                     VALUES ($1, $2, $3, $4, $5)`,
                    [id, nota.materia_id, nota.calificacion, nota.fecha_aprobacion, nota.condicion]
                );
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Notas guardadas correctamente'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error al guardar notas:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        } finally {
            client.release();
        }
    }
    
};

// AGREGAR AL FINAL DEL ARCHIVO:

// ✅ AGREGA ESTOS MÉTODOS SI NO EXISTEN:
exports.login = async (req, res) => {
    try {
        const { usuario, password } = req.body;
        
        console.log('🔐 Login estudiante desde controlador:', usuario);
        
        if (!usuario || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Usuario y contraseña son requeridos' 
            });
        }
        
        // Usa tu conexión a la base de datos
        const result = await req.app.locals.pool.query(
            'SELECT * FROM estudiantes WHERE usuario = $1', 
            [usuario]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }
        
        const estudiante = result.rows[0];
        
        if (password !== estudiante.password) {
            return res.status(401).json({ 
                success: false, 
                error: 'Contraseña incorrecta' 
            });
        }
        
        console.log('✅ Login exitoso para:', usuario);
        res.json({ 
            success: true, 
            data: {
                id: estudiante.id,
                dni: estudiante.dni,
                usuario: estudiante.usuario,
                nombre: estudiante.nombre || estudiante.usuario
            }
        });
        
    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
};

exports.registro = async (req, res) => {
    try {
        const { dni, usuario, password } = req.body;
        
        console.log('📝 Registro estudiante desde controlador:', usuario);
        
        if (!dni || !usuario || !password) {
            return res.status(400).json({ 
                success: false, 
                error: 'Todos los campos son requeridos' 
            });
        }
        
        if (!/^\d{7,8}$/.test(dni)) {
            return res.status(400).json({ 
                success: false, 
                error: 'DNI debe contener 7 u 8 números' 
            });
        }
        
        // Verificar si ya existe
        const usuarioExistente = await req.app.locals.pool.query(
            'SELECT id FROM estudiantes WHERE usuario = $1 OR dni = $2', 
            [usuario, dni]
        );
        
        if (usuarioExistente.rows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                error: 'El usuario o DNI ya están registrados' 
            });
        }
        
        // Insertar nuevo estudiante
        const result = await req.app.locals.pool.query(
            'INSERT INTO estudiantes (dni, usuario, password) VALUES ($1, $2, $3) RETURNING id, dni, usuario',
            [dni, usuario, password]
        );
        
        res.status(201).json({ 
            success: true, 
            message: 'Registro exitoso',
            data: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
};
module.exports = estudiantesController;