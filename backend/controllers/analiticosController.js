const Analitico = require('../models/Analitico');
const PDFGenerator = require('../services/pdfGenerator'); // ← Agrega esto al inicio

const analiticosController = {
    async solicitarAnalitico(req, res) {
        try {
            const { mensaje } = req.body;
            const estudiante_id = req.user.id;

            console.log('📥 Creando solicitud para estudiante:', estudiante_id);

            const solicitud = await Analitico.crearSolicitud({
                estudiante_id,
                mensaje
            });

            console.log('✅ Solicitud creada:', solicitud);

            res.json({ 
                success: true,
                message: 'Analítico solicitado. Espere 24 hs.',
                solicitud 
            });
        } catch (error) {
            console.error('❌ Error al solicitar analítico:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error del servidor al solicitar analítico' 
            });
        }
    },

    async obtenerHistorialPorId(req, res) {
        try {
            const { id } = req.params;
            
            console.log('🔍 Buscando historial para estudiante_id:', id);

            const historial = await Analitico.obtenerPorEstudiante(id);

            console.log('📊 Historial encontrado:', historial.length, 'registros');
            
            res.json({ 
                success: true,
                message: '✅ HISTORIAL FUNCIONANDO',
                historial 
            });
        } catch (error) {
            console.error('❌ Error al obtener historial por ID:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error del servidor al obtener historial' 
            });
        }
    },

    // ✅ NUEVO: Obtener solicitudes pendientes para el preceptor
    async obtenerSolicitudesPendientes(req, res) {
        try {
            console.log('🔍 Obteniendo solicitudes pendientes...');
            
            const solicitudes = await Analitico.obtenerSolicitudesPendientes();
            
            console.log('✅ Solicitudes encontradas:', solicitudes.length);
            
            res.json({
                success: true,
                solicitudes
            });
        } catch (error) {
            console.error('❌ Error al obtener solicitudes pendientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error del servidor al obtener solicitudes'
            });
        }
    },

    // ✅ NUEVO: Aprobar solicitud
    async aprobarSolicitud(req, res) {
        try {
            const { id } = req.params;
            const administrador_id = req.user.id;

            console.log('✅ Aprobando solicitud:', id);
            
            const solicitud = await Analitico.actualizarEstado(id, 'APROBADO', administrador_id);
            
            res.json({
                success: true,
                message: 'Solicitud aprobada correctamente',
                solicitud
            });
        } catch (error) {
            console.error('❌ Error al aprobar solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al aprobar solicitud'
            });
        }
    },

    // ✅ NUEVO: Rechazar solicitud
    async rechazarSolicitud(req, res) {
        try {
            const { id } = req.params;
            const administrador_id = req.user.id;

            console.log('❌ Rechazando solicitud:', id);
            
            const solicitud = await Analitico.actualizarEstado(id, 'RECHAZADO', administrador_id);
            
            res.json({
                success: true,
                message: 'Solicitud rechazada correctamente',
                solicitud
            });
        } catch (error) {
            console.error('❌ Error al rechazar solicitud:', error);
            res.status(500).json({
                success: false,
                message: 'Error al rechazar solicitud'
            });
        }
    },
///CODIGO AGREGAGO PARA GENERAR ANALITIC LO ULTMO ----JULIAN


async generarPDF(req, res) {
    try {
        const { id } = req.params; // ID de la solicitud de analítico
        const estudiante_id = req.user.id;

        console.log('📄 Generando PDF para solicitud:', id);

        // 1. Verificar que la solicitud existe y está aprobada
        const puedeDescargar = await Analitico.puedeDescargar(id, estudiante_id);
        
        if (!puedeDescargar) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para descargar este analítico o no está aprobado'
            });
        }

        // 2. Obtener todos los datos necesarios para el PDF
        const datosPDF = await Analitico.obtenerDatosParaPDF(id);
        
        if (!datosPDF) {
            return res.status(404).json({
                success: false,
                message: 'No se encontraron datos para generar el PDF'
            });
        }

        console.log('✅ Datos obtenidos para PDF:', {
            estudiante: `${datosPDF.datosBasicos.estudiante_nombre} ${datosPDF.datosBasicos.estudiante_apellido}`,
            carrera: datosPDF.datosBasicos.carrera_nombre,
            materias: datosPDF.materias.length
        });

        // 3. ✅ GENERAR PDF REAL (REEMPLAZA LA PARTE ANTERIOR)
        const PDFGenerator = require('../services/pdfGenerator');
        await PDFGenerator.generarAnalitico(datosPDF, res);
        // El PDF se envía directamente como respuesta para descargar

    } catch (error) {
        console.error('❌ Error al generar PDF:', error);
        
        // Si la respuesta ya fue enviada (por el PDF), no enviar otro response
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error del servidor al generar PDF: ' + error.message
            });
        }
    }
}

};

module.exports = analiticosController;