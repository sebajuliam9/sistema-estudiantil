// middleware/auth.js - Middleware de autenticación y autorización
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Token de acceso requerido'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Token inválido o expirado'
        });
    }
};

// Middleware para verificar rol de administrador
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        // Para el admin demo, verificamos las credenciales directamente
        if (req.user.usuario === 'admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                error: 'Se requieren privilegios de administrador'
            });
        }
    } catch (error) {
        console.error('Error en middleware requireAdmin:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Middleware para verificar rol de estudiante
const requireEstudiante = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        // Verificar que el usuario sea estudiante
        if (req.user.rol === 'estudiante') {
            // Verificar que el estudiante exista en la base de datos
            const result = await db.query(
                'SELECT id FROM usuarios WHERE id = $1 AND rol = $2',
                [req.user.id, 'estudiante']
            );

            if (result.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    error: 'Usuario estudiante no válido'
                });
            }

            next();
        } else {
            return res.status(403).json({
                success: false,
                error: 'Se requiere ser estudiante para acceder a este recurso'
            });
        }
    } catch (error) {
        console.error('Error en middleware requireEstudiante:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Middleware para verificar que el estudiante acceda solo a sus propios datos
const requireOwnEstudiante = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no autenticado'
            });
        }

        // Si es admin, puede acceder a cualquier estudiante
        if (req.user.rol === 'admin') {
            return next();
        }

        // Si es estudiante, solo puede acceder a sus propios datos
        const estudianteId = req.params.estudianteId || req.body.estudiante_id;
        
        if (req.user.estudiante_id.toString() !== estudianteId.toString()) {
            return res.status(403).json({
                success: false,
                error: 'No tiene permisos para acceder a los datos de otro estudiante'
            });
        }

        next();
    } catch (error) {
        console.error('Error en middleware requireOwnEstudiante:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
};

// Middleware para validar datos de entrada
const validateCarrera = (req, res, next) => {
    const { resolucion, nombre, horas } = req.body;

    if (!resolucion || !nombre || !horas) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son obligatorios: resolucion, nombre, horas'
        });
    }

    if (typeof horas !== 'number' || horas < 1) {
        return res.status(400).json({
            success: false,
            error: 'Las horas deben ser un número mayor a 0'
        });
    }

    next();
};

// Middleware para validar datos de estudiante
const validateEstudiante = (req, res, next) => {
    const { dni, legajo, nombre, apellido, domicilio, anio_inicio, carrera_id } = req.body;

    if (!dni || !legajo || !nombre || !apellido || !domicilio || !anio_inicio || !carrera_id) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son obligatorios'
        });
    }

    // Validar formato de DNI
    if (!/^\d{7,8}$/.test(dni)) {
        return res.status(400).json({
            success: false,
            error: 'El DNI debe contener 7 u 8 números'
        });
    }

    // Validar año de inicio
    const currentYear = new Date().getFullYear();
    if (anio_inicio < 2000 || anio_inicio > currentYear + 1) {
        return res.status(400).json({
            success: false,
            error: `El año de inicio debe estar entre 2000 y ${currentYear + 1}`
        });
    }

    next();
};

// Middleware para validar datos de materia
const validateMateria = (req, res, next) => {
    const { carrera_id, nombre, curso, regimen } = req.body;

    if (!carrera_id || !nombre || !curso || !regimen) {
        return res.status(400).json({
            success: false,
            error: 'Todos los campos son obligatorios: carrera_id, nombre, curso, regimen'
        });
    }

    const cursosValidos = ['1er año', '2do año', '3er año', '4to año'];
    const regimenesValidos = ['anual', 'cuatrimestral'];

    if (!cursosValidos.includes(curso)) {
        return res.status(400).json({
            success: false,
            error: 'Curso no válido. Debe ser: 1er año, 2do año, 3er año o 4to año'
        });
    }

    if (!regimenesValidos.includes(regimen)) {
        return res.status(400).json({
            success: false,
            error: 'Régimen no válido. Debe ser: anual o cuatrimestral'
        });
    }

    next();
};

// Middleware para validar datos de notas
const validateNotas = (req, res, next) => {
    const { notas } = req.body;

    if (!Array.isArray(notas)) {
        return res.status(400).json({
            success: false,
            error: 'Las notas deben ser un array'
        });
    }

    for (const nota of notas) {
        const { materia_id, calificacion, fecha_aprobacion, condicion } = nota;

        if (!materia_id || !fecha_aprobacion || !condicion) {
            return res.status(400).json({
                success: false,
                error: 'Cada nota debe tener materia_id, fecha_aprobacion y condicion'
            });
        }

        if (calificacion && (calificacion < 1 || calificacion > 10)) {
            return res.status(400).json({
                success: false,
                error: 'La calificación debe estar entre 1 y 10'
            });
        }

        const condicionesValidas = ['aprobado', 'regular', 'libre'];
        if (!condicionesValidas.includes(condicion)) {
            return res.status(400).json({
                success: false,
                error: 'Condición no válida. Debe ser: aprobado, regular o libre'
            });
        }
    }

    next();
};

// Middleware para logging de requests
const requestLogger = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip}`);
    next();
};

// Middleware para manejo de errores global
const errorHandler = (err, req, res, next) => {
    console.error('Error no manejado:', err);

    // Error de validación de PostgreSQL
    if (err.code === '23505') { // unique_violation
        return res.status(400).json({
            success: false,
            error: 'Ya existe un registro con esos datos'
        });
    }

    if (err.code === '23503') { // foreign_key_violation
        return res.status(400).json({
            success: false,
            error: 'Referencia a registro inexistente'
        });
    }

    if (err.code === '23502') { // not_null_violation
        return res.status(400).json({
            success: false,
            error: 'Campo obligatorio no proporcionado'
        });
    }

    // Error genérico
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
    });
};

module.exports = {
    authenticateToken,
    requireAdmin,
    requireEstudiante,
    requireOwnEstudiante,
    validateCarrera,
    validateEstudiante,
    validateMateria,
    validateNotas,
    requestLogger,
    errorHandler
};