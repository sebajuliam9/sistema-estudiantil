class AnaliticosManager {
    constructor() {
        this.API_BASE = 'http://localhost:3003/api';
        this.init();
    }

    init() {
        this.cargarHistorial();
        this.configurarEventos();
        this.debugDatos();
    }

    obtenerEstudianteId() {
        console.log('🔍 Buscando estudiante_id...');
        
        const estudiante = JSON.parse(localStorage.getItem('estudiante') || '{}');
        console.log('📝 Datos de estudiante:', estudiante);
        
        const appState = JSON.parse(localStorage.getItem('appState') || '{}');
        console.log('📝 AppState:', appState);
        
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('📝 User data:', user);

        let estudiante_id = estudiante.id || 
                           estudiante.estudiante_id || 
                           appState.id || 
                           appState.estudiante_id ||
                           user.id ||
                           user.estudiante_id;

        console.log('🎯 ID encontrado:', estudiante_id);
        
        if (!estudiante_id) {
            console.error('❌ No se pudo encontrar estudiante_id');
        }
        
        return estudiante_id;
    }

 configurarEventos() {
    const btnSolicitar = document.getElementById('btnSolicitarAnalitico');
    if (btnSolicitar) {
        btnSolicitar.addEventListener('click', () => this.solicitarAnalitico());
    }
    
    // ✅ NUEVO: Configurar eventos para botones de descarga dinámicos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-descargar')) {
            const solicitudId = e.target.dataset.id;
            descargarPDF(solicitudId);
        }
    });
}

    async solicitarAnalitico() {
        const token = localStorage.getItem('token');
        const mensaje = document.getElementById('mensajeSolicitud')?.value || '';
        
        console.log('🔄 Iniciando solicitud de analítico...');
        console.log('🔍 Token disponible:', !!token);
        console.log('📝 Mensaje:', mensaje);

        if (!token) {
            this.mostrarAlerta('Error de autenticación. Por favor, inicie sesión nuevamente.', 'error');
            return;
        }

        try {
            const url = `${this.API_BASE}/solicitar-analitico`;
            console.log('🌐 URL de solicitud:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    mensaje: mensaje 
                })
            });

            console.log('📡 Status de respuesta:', response.status);

            const data = await response.json();
            console.log('📦 Datos recibidos del servidor:', data);

            if (data.success) {
                this.mostrarAlerta('Analítico solicitado. Espere 24 hs.', 'success');
                if (document.getElementById('mensajeSolicitud')) {
                    document.getElementById('mensajeSolicitud').value = '';
                }
                setTimeout(() => this.cargarHistorial(), 1000);
            } else {
                this.mostrarAlerta(data.message || 'Error al solicitar analítico', 'error');
            }
        } catch (error) {
            console.error('❌ Error al solicitar analítico:', error);
            this.mostrarAlerta('Error de conexión: ' + error.message, 'error');
        }
    }

    async cargarHistorial() {
        const token = localStorage.getItem('token');
        const estudiante_id = this.obtenerEstudianteId();

        console.log('📜 Cargando historial para estudiante_id:', estudiante_id);

        if (!estudiante_id) {
            console.warn('❌ No se puede cargar historial - no se encontró estudiante_id');
            this.mostrarAlerta('No se puede identificar al estudiante.', 'warning');
            return;
        }

        try {
            const url = `${this.API_BASE}/historial-analiticos/${estudiante_id}`;
            console.log('🌐 URL de historial:', url);
            
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Status de respuesta historial:', response.status);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();
            console.log('📦 Historial recibido:', data);

            if (data.success) {
                this.mostrarHistorial(data.historial);
            } else {
                this.mostrarAlerta(data.message || 'Error al cargar el historial', 'error');
            }
        } catch (error) {
            console.error('❌ Error al cargar historial:', error);
            this.mostrarAlerta('Error al cargar el historial: ' + error.message, 'error');
        }
    }

    mostrarHistorial(historial) {
        const tbody = document.getElementById('tablaHistorialBody');
        if (!tbody) {
            console.warn('❌ No se encontró la tabla para mostrar el historial');
            return;
        }

        tbody.innerHTML = '';

        if (!historial || historial.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center text-muted py-3">
                        <i class="fas fa-inbox"></i> No hay solicitudes registradas
                    </td>
                </tr>
            `;
            return;
        }

        historial.forEach(solicitud => {
            const fila = document.createElement('tr');
            
            const fecha = new Date(solicitud.fecha_solicitud).toLocaleDateString('es-AR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            const estado = this.obtenerBadgeEstado(solicitud.estado);
            const acciones = this.obtenerBotonesAccion(solicitud);

            fila.innerHTML = `
                <td>${fecha}</td>
                <td>${estado}</td>
                <td>${solicitud.mensaje || '<span class="text-muted">Sin mensaje</span>'}</td>
                <td>${acciones}</td>
            `;

            tbody.appendChild(fila);
        });

        console.log('✅ Tabla actualizada con', historial.length, 'registros');
    }

    obtenerBadgeEstado(estado) {
        const estadoLower = estado.toLowerCase();
        const estados = {
            'pendiente': '<span class="badge bg-warning"><i class="fas fa-clock"></i> Pendiente</span>',
            'procesando': '<span class="badge bg-info"><i class="fas fa-cog"></i> En Proceso</span>',
            'completado': '<span class="badge bg-success"><i class="fas fa-check"></i> Completado</span>',
            'rechazado': '<span class="badge bg-danger"><i class="fas fa-times"></i> Rechazado</span>',
            'aprobado': '<span class="badge bg-success"><i class="fas fa-check-circle"></i> Aprobado</span>'
        };

        return estados[estadoLower] || `<span class="badge bg-secondary">${estado}</span>`;
    }

    obtenerBotonesAccion(solicitud) {
    const estado = solicitud.estado ? solicitud.estado.toLowerCase() : '';
    
    console.log('🔍 Estado de solicitud:', estado, 'ID:', solicitud.id);
    
    if (estado === 'completado' || estado === 'aprobado') {
        return `
            <button class="btn btn-success btn-sm btn-descargar" 
                    data-id="${solicitud.id}" 
                    title="Descargar PDF"
                    onclick="descargarPDF(${solicitud.id})">
                <i class="fas fa-download"></i> Descargar PDF
            </button>
        `;
    } else {
        return `
            <span class="text-muted small">
                <i class="fas fa-clock"></i> En espera
            </span>
        `;
    }
}

    mostrarAlerta(mensaje, tipo = 'info') {
        alert(`[${tipo.toUpperCase()}] ${mensaje}`);
    }

    debugDatos() {
        console.log('🔍 DEBUG - Datos disponibles en localStorage:');
        console.log('Token:', localStorage.getItem('token'));
        console.log('Estudiante:', JSON.parse(localStorage.getItem('estudiante') || '{}'));
        console.log('AppState:', JSON.parse(localStorage.getItem('appState') || '{}'));
        console.log('User:', JSON.parse(localStorage.getItem('user') || '{}'));
        console.log('Estudiante ID encontrado:', this.obtenerEstudianteId());
    }
}

// ✅ CLASE CORREGIDA PARA EL PRECEPTOR/ADMINISTRADOR
class AdminAnaliticosManager {
    constructor() {
        this.API_BASE = 'http://localhost:3003/api';
        // QUITAMOS el init() del constructor para evitar errores
    }

    // Método separado para inicializar cuando sea necesario
    init() {
        this.configurarEventosAdmin();
        this.cargarSolicitudesPendientes();
    }

    configurarEventosAdmin() {
        console.log('⚙️ Configurando eventos del administrador...');
        // Los eventos de botones se configuran dinámicamente en mostrarSolicitudesPendientes
    }

    async cargarSolicitudesPendientes() {
        const token = localStorage.getItem('adminToken');
        
        console.log('🔐 Token administrativo:', token);
        
        if (!token) {
            console.warn('❌ No hay token de administrador - El preceptor debe iniciar sesión primero');
            return;
        }

        try {
            console.log('🔄 Cargando solicitudes pendientes...');
            const response = await fetch(`${this.API_BASE}/solicitudes-pendientes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log('📡 Status de respuesta:', response.status);

            // Verificar si la respuesta es JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                console.error('❌ La respuesta no es JSON:', text.substring(0, 200));
                throw new Error('El servidor no devolvió una respuesta JSON válida');
            }

            const data = await response.json();
            console.log('📦 Solicitudes pendientes recibidas:', data);

            if (data.success) {
                this.mostrarSolicitudesPendientes(data.solicitudes);
            } else {
                console.error('❌ Error del servidor:', data.message);
                this.mostrarAlertaAdmin(data.message || 'Error al cargar solicitudes', 'error');
            }
        } catch (error) {
            console.error('❌ Error al cargar solicitudes pendientes:', error);
            this.mostrarAlertaAdmin('Error al cargar solicitudes: ' + error.message, 'error');
        }
    }

    mostrarSolicitudesPendientes(solicitudes) {
        const tbody = document.getElementById('tabla-solicitudes-analiticos');
        if (!tbody) {
            console.warn('❌ No se encontró la tabla de solicitudes del preceptor');
            return;
        }

        tbody.innerHTML = '';

        if (!solicitudes || solicitudes.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted py-3">
                        <i class="fas fa-inbox"></i> No hay solicitudes pendientes
                    </td>
                </tr>
            `;
            return;
        }

        solicitudes.forEach(solicitud => {
            const fila = document.createElement('tr');
            
            const fecha = new Date(solicitud.fecha_solicitud).toLocaleDateString('es-AR');

            fila.innerHTML = `
                <td>${solicitud.estudiante_nombre} ${solicitud.estudiante_apellido}</td>
                <td>${solicitud.estudiante_dni}</td>
                <td>${solicitud.carrera_nombre}</td>
                <td>${fecha}</td>
                <td>
                    <span class="badge bg-warning">
                        <i class="fas fa-clock"></i> ${solicitud.estado}
                    </span>
                </td>
                <td>
                    <button class="btn btn-success btn-sm me-1 btn-aprobar" 
                            data-id="${solicitud.id}" title="Aprobar solicitud">
                        <i class="fas fa-check"></i> Aprobar
                    </button>
                    <button class="btn btn-danger btn-sm btn-rechazar" 
                            data-id="${solicitud.id}" title="Rechazar solicitud">
                        <i class="fas fa-times"></i> Rechazar
                    </button>
                </td>
            `;

            tbody.appendChild(fila);
        });

        // Configurar eventos de los botones
        this.configurarEventosBotones();
        
        console.log('✅ Tabla del preceptor actualizada con', solicitudes.length, 'solicitudes');
    }

    configurarEventosBotones() {
        // Botones aprobar
        document.querySelectorAll('.btn-aprobar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.btn-aprobar').dataset.id;
                this.aprobarSolicitud(id);
            });
        });

        // Botones rechazar
        document.querySelectorAll('.btn-rechazar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('.btn-rechazar').dataset.id;
                this.rechazarSolicitud(id);
            });
        });
    }

    async aprobarSolicitud(id) {
        if (!confirm('¿Está seguro de que desea APROBAR esta solicitud?')) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${this.API_BASE}/aprobar/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.mostrarAlertaAdmin('✅ Solicitud aprobada correctamente', 'success');
                this.cargarSolicitudesPendientes(); // Recargar tabla
            } else {
                this.mostrarAlertaAdmin('❌ Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error al aprobar solicitud:', error);
            this.mostrarAlertaAdmin('Error al aprobar solicitud', 'error');
        }
    }

    async rechazarSolicitud(id) {
        if (!confirm('¿Está seguro de que desea RECHAZAR esta solicitud?')) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${this.API_BASE}/rechazar/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            
            if (data.success) {
                this.mostrarAlertaAdmin('✅ Solicitud rechazada correctamente', 'success');
                this.cargarSolicitudesPendientes(); // Recargar tabla
            } else {
                this.mostrarAlertaAdmin('❌ Error: ' + data.message, 'error');
            }
        } catch (error) {
            console.error('❌ Error al rechazar solicitud:', error);
            this.mostrarAlertaAdmin('Error al rechazar solicitud', 'error');
        }
    }

    mostrarAlertaAdmin(mensaje, tipo = 'info') {
        alert(`[ADMIN - ${tipo.toUpperCase()}] ${mensaje}`);
    }
}

// ✅ FUNCIÓN PARA INICIALIZAR EL PANEL DEL PRECEPTOR
function inicializarPanelPreceptor() {
    console.log('🎯 Inicializando panel del preceptor...');
    
    // Verificar si hay token de administrador
    const adminToken = localStorage.getItem('adminToken');
    console.log('🔐 Token administrativo disponible:', !!adminToken);
    
    if (adminToken) {
        // Asegurarnos de que el manager existe
        if (!window.adminAnaliticosManager) {
            window.adminAnaliticosManager = new AdminAnaliticosManager();
        }
        
        console.log('✅ Cargando solicitudes pendientes...');
        window.adminAnaliticosManager.cargarSolicitudesPendientes();
    } else {
        console.warn('⚠️ No hay token de administrador - El preceptor debe iniciar sesión primero');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Inicializando sistema de analíticos...');
    
    // Inicializar manager de estudiantes
    window.analiticosManager = new AnaliticosManager();
    
    // Crear instancia del manager del preceptor (pero no inicializar aún)
    window.adminAnaliticosManager = new AdminAnaliticosManager();
    
    console.log('✅ Sistemas de analíticos inicializados');
});

// ✅ NUEVA FUNCIÓN PARA DESCARGAR PDF - VERSIÓN CORREGIDA
async function descargarPDF(solicitudId) {
    try {
        const token = localStorage.getItem('token');
        console.log('📄 Iniciando descarga de PDF para solicitud:', solicitudId);
        
        if (!token) {
            alert('Error: No hay token de autenticación. Por favor, inicie sesión nuevamente.');
            return;
        }

        // ✅ SOLUCIÓN: Usar fetch para obtener el PDF y luego descargarlo
        const url = `http://localhost:3003/api/descargar-pdf/${solicitudId}`;
        console.log('🌐 URL de descarga:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('📡 Status de respuesta PDF:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error del servidor');
        }

        // ✅ Convertir respuesta a blob y crear URL para descarga
        const pdfBlob = await response.blob();
        const pdfUrl = window.URL.createObjectURL(pdfBlob);
        
        // ✅ Crear enlace temporal para descarga
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `analitico-solicitud-${solicitudId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // ✅ Limpiar URL
        window.URL.revokeObjectURL(pdfUrl);
        
        console.log('✅ PDF descargado correctamente');
        
    } catch (error) {
        console.error('❌ Error al descargar PDF:', error);
        alert('Error al descargar el PDF: ' + error.message);
    }
}


// Exportar funciones globalmente
window.inicializarPanelPreceptor = inicializarPanelPreceptor;
window.AdminAnaliticosManager = AdminAnaliticosManager;
window.descargarPDF = descargarPDF;