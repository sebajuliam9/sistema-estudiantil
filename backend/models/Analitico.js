const db = require('../config/database');

class Analitico {
    static async crearSolicitud({ estudiante_id, mensaje }) {
        const query = `
            INSERT INTO analiticos (estudiante_id, mensaje, estado, fecha_solicitud) 
            VALUES ($1, $2, 'PENDIENTE', NOW()) 
            RETURNING *
        `;
        const result = await db.query(query, [estudiante_id, mensaje]);
        return result.rows[0];
    }

    static async obtenerPorEstudiante(estudiante_id) {
        const query = `
            SELECT * FROM analiticos 
            WHERE estudiante_id = $1 
            ORDER BY fecha_solicitud DESC
        `;
        const result = await db.query(query, [estudiante_id]);
        return result.rows;
    }

    static async obtenerTodos() {
        const query = `SELECT * FROM analiticos ORDER BY fecha_solicitud DESC`;
        const result = await db.query(query);
        return result.rows;
    }

    static async actualizarEstado(id, estado, procesado_por) {
        const query = `
            UPDATE analiticos 
            SET estado = $1, procesado_por = $2, fecha_procesado = NOW() 
            WHERE id = $3 
            RETURNING *
        `;
        const result = await db.query(query, [estado, procesado_por, id]);
        return result.rows[0];
    }

    static async actualizarPDF(id, pdf_path) {
        const query = `
            UPDATE analiticos 
            SET pdf_path = $1, estado = 'COMPLETADO' 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await db.query(query, [pdf_path, id]);
        return result.rows[0];
    }

    // ✅ Obtener solicitudes pendientes
    static async obtenerSolicitudesPendientes() {
        try {
            const query = `
                SELECT 
                    a.*,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.dni as estudiante_dni,
                    c.nombre as carrera_nombre
                FROM analiticos a
                JOIN estudiantes e ON a.estudiante_id = e.id
                JOIN carreras c ON e.carrera_id = c.id
                WHERE a.estado = 'PENDIENTE'
                ORDER BY a.fecha_solicitud ASC
            `;
            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            console.error('❌ ERROR EN obtenerSolicitudesPendientes:', error);
            throw error;
        }
    }

    // ✅ Obtener datos para PDF ORGANIZADOS POR CURSO
    static async obtenerDatosParaPDF(solicitud_id) {
        try {
            console.log('📋 Obteniendo datos para PDF de solicitud:', solicitud_id);
            
            // 1. Obtener datos del estudiante y carrera
            const querySolicitud = `
                SELECT 
                    a.*,
                    e.nombre as estudiante_nombre,
                    e.apellido as estudiante_apellido,
                    e.dni as estudiante_dni,
                    e.legajo as estudiante_legajo,
                    e.domicilio as estudiante_domicilio,
                    e.anio_inicio as estudiante_anio_inicio,
                    c.nombre as carrera_nombre,
                    c.resolucion as carrera_resolucion
                FROM analiticos a
                JOIN estudiantes e ON a.estudiante_id = e.id
                JOIN carreras c ON e.carrera_id = c.id
                WHERE a.id = $1
            `;
            const solicitudResult = await db.query(querySolicitud, [solicitud_id]);
            
            if (solicitudResult.rows.length === 0) {
                throw new Error('Solicitud no encontrada');
            }

            const datosBasicos = solicitudResult.rows[0];
            const estudiante_id = datosBasicos.estudiante_id;

            // 2. Obtener materias CON CURSO incluido
            const queryMaterias = `
                SELECT 
                    m.nombre as materia_nombre,
                    m.regimen as materia_regimen,
                    m.curso as materia_curso,  -- ← INCLUIR CURSO
                    n.calificacion,
                    n.fecha_aprobacion,
                    n.condicion,
                    CASE 
                        WHEN n.calificacion >= 6 THEN 'Aprobado'
                        ELSE 'En Curso'
                    END as estado
                FROM notas n
                JOIN materias m ON n.materia_id = m.id
                WHERE n.estudiante_id = $1
                ORDER BY 
                    CASE 
                        WHEN m.curso = '1er año' THEN 1
                        WHEN m.curso = '2do año' THEN 2
                        WHEN m.curso = '3er año' THEN 3
                        WHEN m.curso = '4to año' THEN 4
                        ELSE 5
                    END,
                    m.nombre
            `;
            const materiasResult = await db.query(queryMaterias, [estudiante_id]);

            console.log('✅ Datos obtenidos para PDF:');
            console.log('- Estudiante:', datosBasicos.estudiante_nombre, datosBasicos.estudiante_apellido);
            console.log('- Carrera:', datosBasicos.carrera_nombre);
            console.log('- Materias encontradas:', materiasResult.rows.length);

            // 3. ORGANIZAR POR CURSO (1er año, 2do año, etc.)
            const materiasPorCurso = {
                "1er año": [],
                "2do año": [], 
                "3er año": [],
                "4to año": []
            };

            materiasResult.rows.forEach(materia => {
                const curso = materia.materia_curso;
                
                if (curso) {
                    // Si el curso existe en nuestra estructura, lo agregamos
                    if (materiasPorCurso[curso]) {
                        materiasPorCurso[curso].push(materia);
                    } else {
                        // Si es un curso nuevo, lo creamos
                        materiasPorCurso[curso] = [materia];
                    }
                } else {
                    // Si no tiene curso, lo ponemos en "1er año" por defecto
                    materiasPorCurso["1er año"].push(materia);
                }
            });

            // Eliminar cursos vacíos
            Object.keys(materiasPorCurso).forEach(curso => {
                if (materiasPorCurso[curso].length === 0) {
                    delete materiasPorCurso[curso];
                }
            });

            console.log('📊 Organización por cursos:');
            Object.keys(materiasPorCurso).forEach(curso => {
                console.log(`- ${curso}: ${materiasPorCurso[curso].length} materias`);
            });

            return {
                datosBasicos: datosBasicos,
                materias: materiasResult.rows,
                materiasPorAnio: materiasPorCurso  // ← Ahora organizado por curso
            };

        } catch (error) {
            console.error('❌ Error en obtenerDatosParaPDF:', error);
            throw error;
        }
    }

    // ✅ Aprobar solicitud
    static async aprobarSolicitud(id, administrador_id) {
        const query = `
            UPDATE analiticos 
            SET estado = 'APROBADO', 
                procesado_por = $1, 
                fecha_procesado = NOW()
            WHERE id = $2 
            RETURNING *
        `;
        const result = await db.query(query, [administrador_id, id]);
        return result.rows[0];
    }

    // ✅ Verificar permisos de descarga
    static async puedeDescargar(id, estudiante_id) {
        try {            
            const query = `
                SELECT * FROM analiticos 
                WHERE id = $1 
                AND estudiante_id = $2 
                AND estado = 'APROBADO'
            `;
            const result = await db.query(query, [id, estudiante_id]);
            return result.rows.length > 0;
            
        } catch (error) {
            console.error('❌ Error en puedeDescargar:', error);
            return false;
        }
    }
}

module.exports = Analitico;