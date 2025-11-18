// backend/controllers/authController.js - VERSIÓN CORREGIDA
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authController = {
    // ================================
    // 🔐 LOGIN ADMINISTRADOR
    // ================================
    loginAdmin: async (req, res) => {
        try {
            const { usuario, password } = req.body;

            // Credenciales fijas para demo
            if (usuario === 'admin' && password === '1234') {
                // ✅ GENERAR TOKEN JWT
                const token = jwt.sign(
                    { 
                        id: 1, 
                        usuario: 'admin', 
                        nombre: 'Administrador', 
                        rol: 'admin' 
                    },
                    process.env.JWT_SECRET || 'secreto-temporal',
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    data: {
                        id: 1,
                        usuario: 'admin',
                        nombre: 'Administrador',
                        rol: 'admin',
                        token: token
                    },
                    message: 'Login exitoso'
                });
            } else {
                return res.status(401).json({
                    success: false,
                    error: 'Credenciales incorrectas'
                });
            }
        } catch (error) {
            console.error('Error en login admin:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // ================================
    // 🔍 VALIDAR ESTUDIANTE POR DNI
    // ================================
    validarEstudiantePorDNI: async (req, res) => {
        try {
            const { dni } = req.body;

            if (!dni) {
                return res.status(400).json({
                    success: false,
                    error: 'DNI es requerido'
                });
            }

            // Validar formato de DNI
            if (!/^\d{7,8}$/.test(dni)) {
                return res.status(400).json({
                    success: false,
                    error: 'DNI debe contener 7 u 8 dígitos numéricos'
                });
            }

            // Buscar estudiante en la base de datos
            const estudianteResult = await db.query(
                `SELECT e.id, e.dni, e.nombre, e.apellido, e.legajo, 
                        c.nombre as carrera_nombre
                 FROM estudiantes e 
                 JOIN carreras c ON e.carrera_id = c.id
                 WHERE e.dni = $1`,
                [dni]
            );

            if (estudianteResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Comuníquese con rectoría del IES N°2'
                });
            }

            const estudiante = estudianteResult.rows[0];

            // Verificar si el estudiante ya está registrado como usuario
            const usuarioExistente = await db.query(
                'SELECT id FROM usuarios WHERE estudiante_id = $1',
                [estudiante.id]
            );

            if (usuarioExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El estudiante ya tiene una cuenta registrada'
                });
            }

            res.json({
                success: true,
                existe: true,
                habilitado: true,
                estudiante: {
                    id: estudiante.id,
                    dni: estudiante.dni,
                    nombre: estudiante.nombre,
                    apellido: estudiante.apellido,
                    legajo: estudiante.legajo,
                    carrera_nombre: estudiante.carrera_nombre
                }
            });

        } catch (error) {
            console.error('Error validando estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // ================================
    // 👤 REGISTRAR ESTUDIANTE
    // ================================
    registroEstudiante: async (req, res) => {
        try {
            const { dni, usuario, password } = req.body;

            // Validar campos
            if (!dni || !usuario || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Todos los campos (DNI, Usuario, Contraseña) son obligatorios.'
                });
            }

            // Validar que el DNI existe en la tabla estudiantes
            const estudianteCheck = await db.query(
                'SELECT id FROM estudiantes WHERE dni = $1',
                [dni]
            );

            if (estudianteCheck.rows.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'No se encontró un estudiante con ese DNI. Contacte al administrador.'
                });
            }
            
            const estudianteId = estudianteCheck.rows[0].id;

            // Verificar que no tenga ya una cuenta (por estudiante_id)
            const cuentaExistente = await db.query(
                'SELECT id FROM usuarios WHERE estudiante_id = $1',
                [estudianteId]
            );

            if (cuentaExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Ya existe una cuenta asociada a este DNI. Intente iniciar sesión.'
                });
            }

            // Verificar que el nombre de usuario no exista
            const usuarioExistente = await db.query(
                'SELECT id FROM usuarios WHERE usuario = $1',
                [usuario]
            );

            if (usuarioExistente.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'El nombre de usuario ya está en uso. Por favor, elija otro.'
                });
            }

            // Hash de la contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Crear usuario
            await db.query(
                `INSERT INTO usuarios (estudiante_id, usuario, password, rol) 
                 VALUES ($1, $2, $3, 'estudiante')`,
                [estudianteId, usuario, hashedPassword]
            );

            res.status(201).json({
                success: true,
                message: 'Cuenta creada exitosamente. Ya puede iniciar sesión.'
            });

        } catch (error) {
            console.error('Error en registro estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // ================================
    // 🔐 LOGIN DE ESTUDIANTE - VERSIÓN CORREGIDA ✅
    // ================================
    loginEstudiante: async (req, res) => {
        try {
            const { usuario, password } = req.body;

            // Buscar usuario
            const result = await db.query(
                `SELECT u.*, e.id as estudiante_id, e.nombre, e.apellido, e.dni, e.legajo, e.carrera_id,
                        c.nombre as carrera_nombre
                 FROM usuarios u 
                 JOIN estudiantes e ON u.estudiante_id = e.id
                 JOIN carreras c ON e.carrera_id = c.id
                 WHERE u.usuario = $1`,
                [usuario]
            );

            if (result.rows.length === 0) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario o contraseña incorrectos'
                });
            }

            const user = result.rows[0];

            // Verificar contraseña
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    error: 'Usuario o contraseña incorrectos'
                });
            }

            // ✅ GENERAR TOKEN JWT para estudiante - CORREGIDO
            const token = jwt.sign(
                { 
                    id: user.estudiante_id,        // ✅ CORREGIDO: usar estudiante_id en vez de user.id
                    estudiante_id: user.estudiante_id,
                    usuario: user.usuario,
                    nombre: user.nombre,
                    apellido: user.apellido,
                    rol: 'estudiante'
                },
                process.env.JWT_SECRET || 'secreto-temporal',
                { expiresIn: '24h' }
            );

            // Eliminar password de la respuesta
            const { password: _, ...userWithoutPassword } = user;

            // ✅ RESPUESTA CORREGIDA - usar estudiante_id en todos los campos de ID
            res.json({
                success: true,
                data: {
                    id: user.estudiante_id,                    // ✅ CORREGIDO
                    estudiante_id: user.estudiante_id,         // ✅ CORREGIDO
                    nombre: user.nombre,
                    apellido: user.apellido,
                    dni: user.dni,
                    legajo: user.legajo,
                    carrera_id: user.carrera_id,
                    carrera_nombre: user.carrera_nombre,
                    usuario: user.usuario,
                    rol: 'estudiante',
                    token: token
                },
                message: 'Login exitoso'
            });

        } catch (error) {
            console.error('Error en login estudiante:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // ================================
    // 🔍 BUSCAR USUARIO POR DNI (PARA RECUPERACIÓN)
    // ================================
    buscarUsuarioPorDNI: async (req, res) => {
        try {
            const { dni } = req.body;

            if (!dni) {
                return res.status(400).json({
                    success: false,
                    error: 'DNI es requerido'
                });
            }

            // Buscar usuario con información del estudiante
            const result = await db.query(
                `SELECT u.usuario, e.nombre, e.apellido 
                 FROM usuarios u 
                 JOIN estudiantes e ON u.estudiante_id = e.id 
                 WHERE e.dni = $1`,
                [dni]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'No se encontró un usuario con ese DNI'
                });
            }

            const usuarioData = result.rows[0];

            res.json({
                success: true,
                usuario: usuarioData.usuario,
                estudiante: {
                    nombre: usuarioData.nombre,
                    apellido: usuarioData.apellido
                }
            });

        } catch (error) {
            console.error('Error buscando usuario por DNI:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    },

    // ================================
    // 🔑 ACTUALIZAR CONTRASEÑA (PARA RECUPERACIÓN)
    // ================================
    actualizarContraseña: async (req, res) => {
        try {
            const { dni, nuevaPassword } = req.body;

            if (!dni || !nuevaPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'DNI y nueva contraseña son requeridos'
                });
            }

            if (nuevaPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Buscar usuario por DNI del estudiante
            const usuarioResult = await db.query(
                `SELECT u.id 
                 FROM usuarios u 
                 JOIN estudiantes e ON u.estudiante_id = e.id 
                 WHERE e.dni = $1`,
                [dni]
            );

            if (usuarioResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Usuario no encontrado'
                });
            }

            const usuarioId = usuarioResult.rows[0].id;

            // Hashear nueva contraseña
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(nuevaPassword, saltRounds);

            // Actualizar contraseña
            await db.query(
                'UPDATE usuarios SET password = $1 WHERE id = $2',
                [hashedPassword, usuarioId]
            );

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando contraseña:', error);
            res.status(500).json({
                success: false,
                error: 'Error interno del servidor'
            });
        }
    }
};

module.exports = authController;