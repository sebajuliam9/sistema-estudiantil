// services/pdfGenerator.js
const PDFDocument = require('pdfkit');

class PDFGenerator {
    static async generarAnalitico(datosPDF, res) {
        return new Promise((resolve, reject) => {
            try {
                // Crear documento PDF
                const doc = new PDFDocument({ 
                    margin: 50,
                    size: 'A4'
                });

                // Configurar headers para descarga
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="analitico-${datosPDF.datosBasicos.estudiante_apellido}.pdf"`);

                // Pipe el PDF directamente a la respuesta
                doc.pipe(res);

                // ===== ENCABEZADO DEL DOCUMENTO =====
                doc.fontSize(16)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('IES N° 2 - HUMAHUACA', 50, 50, { align: 'center' });

                doc.fontSize(12)
                   .font('Helvetica')
                   .fillColor('#7f8c8d')
                   .text('Analítico de Estudios', 50, 70, { align: 'center' });

                // Línea separadora
                doc.moveTo(50, 90)
                   .lineTo(545, 90)
                   .strokeColor('#bdc3c7')
                   .lineWidth(1)
                   .stroke();

                // ===== DATOS DEL ESTUDIANTE =====
                doc.fontSize(14)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('DATOS DEL ESTUDIANTE', 50, 110);

                doc.fontSize(10)
                   .font('Helvetica')
                   .fillColor('#34495e');

                let yPosition = 135;
                
                // Datos personales
                doc.text(`Nombre: ${datosPDF.datosBasicos.estudiante_nombre} ${datosPDF.datosBasicos.estudiante_apellido}`, 50, yPosition);
                doc.text(`DNI: ${datosPDF.datosBasicos.estudiante_dni}`, 300, yPosition);
                yPosition += 20;

                doc.text(`Carrera: ${datosPDF.datosBasicos.carrera_nombre}`, 50, yPosition);
                yPosition += 20;

                doc.text(`Legajo: ${datosPDF.datosBasicos.estudiante_legajo || 'N/A'}`, 50, yPosition);
                doc.text(`Año de Inicio: ${datosPDF.datosBasicos.estudiante_anio_inicio || 'N/A'}`, 300, yPosition);
                yPosition += 30;

                // ===== TABLA DE MATERIAS =====
                doc.fontSize(12)
                   .font('Helvetica-Bold')
                   .fillColor('#2c3e50')
                   .text('HISTORIAL ACADÉMICO', 50, yPosition);
                
                yPosition += 25;

                // Recorrer cada grupo de materias
                for (const [grupo, materias] of Object.entries(datosPDF.materiasPorAnio)) {
                    // Título del grupo
                    doc.fontSize(11)
                       .font('Helvetica-Bold')
                       .fillColor('#e74c3c')
                       .text(grupo.toUpperCase(), 50, yPosition);
                    
                    yPosition += 15;

                    // ✅ ENCABEZADO DE TABLA CORREGIDO - CON RÉGIMEN Y ESTADO
                    doc.fontSize(8)
                       .font('Helvetica-Bold')
                       .fillColor('#2c3e50');
                    
                    doc.text('MATERIA', 50, yPosition, { width: 120 });
                    doc.text('RÉGIMEN', 180, yPosition, { width: 60 });
                    doc.text('CALIFICACIÓN', 250, yPosition, { width: 50 });
                    doc.text('FECHA APROB.', 310, yPosition, { width: 70 });
                    doc.text('CONDICIÓN', 390, yPosition, { width: 60 });
                    doc.text('ESTADO', 460, yPosition, { width: 50 });
                    
                    yPosition += 12;

                    // Línea de encabezado
                    doc.moveTo(50, yPosition)
                       .lineTo(545, yPosition)
                       .strokeColor('#bdc3c7')
                       .lineWidth(0.5)
                       .stroke();
                    
                    yPosition += 5;

                    // ✅ MATERIAS CON TODOS LOS DATOS
                    doc.fontSize(8)
                       .font('Helvetica')
                       .fillColor('#2c3e50');

                    materias.forEach(materia => {
                        // Verificar si hay espacio en la página
                        if (yPosition > 700) {
                            doc.addPage();
                            yPosition = 50;
                        }

                        // ✅ DATOS COMPLETOS - EXACTAMENTE LO QUE PIDES
                        doc.text(materia.materia_nombre || 'N/A', 50, yPosition, { width: 120 });
                        doc.text(materia.materia_regimen || 'N/A', 180, yPosition, { width: 60 });
                        doc.text(materia.calificacion?.toString() || '--', 250, yPosition, { width: 50 });
                        
                        // ✅ FECHA FORMATEADA CORRECTAMENTE
                        const fechaAprobacion = materia.fecha_aprobacion ? 
                            new Date(materia.fecha_aprobacion).toLocaleDateString('es-AR') : '--';
                        doc.text(fechaAprobacion, 310, yPosition, { width: 70 });
                        
                        doc.text(materia.condicion || '--', 390, yPosition, { width: 60 });
                        
                        // ✅ ESTADO CALCULADO
                        const estado = materia.estado || 
                            (materia.calificacion >= 6 ? 'Aprobado' : 'En Curso');
                        doc.text(estado, 460, yPosition, { width: 50 });
                        
                        yPosition += 15;
                    });

                    yPosition += 10; // Espacio entre grupos
                }

                // ===== PIE DE PÁGINA =====
                const footerY = 750;
                doc.fontSize(8)
                   .font('Helvetica-Oblique')
                   .fillColor('#7f8c8d')
                   .text('Documento oficial generado por el Sistema de Gestión Estudiantil - IES N° 2 Humahuaca', 50, footerY, { align: 'center' });

                doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')}`, 50, footerY + 12, { align: 'center' });

                // Finalizar documento
                doc.end();

                resolve(true);

            } catch (error) {
                console.error('❌ Error generando PDF:', error);
                reject(error);
            }
        });
    }
}

module.exports = PDFGenerator;