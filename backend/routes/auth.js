const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ================================
// RUTAS DE AUTENTICACIÓN
// ================================

// Registro y login de estudiantes
router.post('/registro-estudiante', authController.registroEstudiante);
router.post('/login-estudiante', authController.loginEstudiante);

// ✅ NUEVAS RUTAS AGREGADAS:

// 🔍 Validar estudiante por DNI (para registro)
router.post('/validar-estudiante', authController.validarEstudiantePorDNI);

// 🔍 Buscar usuario por DNI (para recuperación de contraseña)
router.post('/buscar-usuario-por-dni', authController.buscarUsuarioPorDNI);

// 🔑 Actualizar contraseña (para recuperación)
router.post('/actualizar-contraseña', authController.actualizarContraseña);

// Login de administrador
router.post('/login-admin', authController.loginAdmin);

module.exports = router;