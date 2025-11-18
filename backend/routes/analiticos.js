const express = require('express');
const router = express.Router();
const analiticosController = require('../controllers/analiticosController');
const { authenticateToken } = require('../middleware/auth');

// ✅ RUTA PARA SOLICITAR ANALÍTICO (CON AUTENTICACIÓN)
router.post('/solicitar-analitico', authenticateToken, analiticosController.solicitarAnalitico);

// ✅ RUTA PARA OBTENER HISTORIAL POR ID
router.get('/historial-analiticos/:id', analiticosController.obtenerHistorialPorId);

// ✅ NUEVO: RUTA PARA OBTENER SOLICITUDES PENDIENTES (PARA PRECEPTOR)
router.get('/solicitudes-pendientes', authenticateToken, analiticosController.obtenerSolicitudesPendientes);

// ✅ NUEVO: RUTA PARA APROBAR SOLICITUD
router.put('/aprobar/:id', authenticateToken, analiticosController.aprobarSolicitud);

// ✅ NUEVO: RUTA PARA RECHAZAR SOLICITUD
router.put('/rechazar/:id', authenticateToken, analiticosController.rechazarSolicitud);

// ✅ NUEVO: RUTA PARA DESCARGAR PDF
router.get('/descargar-pdf/:id', authenticateToken, analiticosController.generarPDF);


module.exports = router;