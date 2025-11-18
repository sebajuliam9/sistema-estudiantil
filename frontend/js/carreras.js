// js/carreras.js - Gestión de carreras
class CarrerasController {
    constructor() {
        this.apiUrl = '/api/carreras';
        this.init();
    }

    init() {
        // Asegurar que las funciones estén disponibles globalmente
        window.guardarCarrera = this.guardarCarrera.bind(this);
        window.eliminarCarrera = this.eliminarCarrera.bind(this);
    }

    // Obtener todas las carreras
    async obtenerCarreras() {
        try {
            const response = await fetch(this.apiUrl);
            const result = await response.json();
            
            if (result.success) {
                return result.data;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al obtener carreras:', error);
            this.mostrarMensaje('Error al cargar las carreras', 'error');
            return [];
        }
    }

    // Renderizar carreras en el grid
    async renderizarCarreras() {
        try {
            const carreras = await this.obtenerCarreras();
            const gridCarreras = document.getElementById('grid-carreras');
            
            if (!gridCarreras) {
                console.error('Elemento grid-carreras no encontrado');
                return;
            }

            if (carreras.length === 0) {
                gridCarreras.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <i class="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No hay carreras registradas</p>
                    </div>
                `;
                return;
            }

            gridCarreras.innerHTML = carreras.map(carrera => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm carrera-card">
                        <div class="card-header bg-primary text-white">
                            <h6 class="card-title mb-0">${this.escapeHtml(carrera.nombre)}</h6>
                        </div>
                        <div class="card-body">
                            <p class="card-text">
                                <strong>Resolución:</strong> ${this.escapeHtml(carrera.resolucion)}<br>
                                <strong>Horas:</strong> ${carrera.horas} horas
                            </p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-outline-warning btn-sm" 
                                        onclick="carreraController.editarCarrera('${carrera.id}')"
                                        title="Editar carrera">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="carreraController.eliminarCarreraConfirm('${carrera.id}', '${this.escapeHtml(carrera.nombre)}')"
                                        title="Eliminar carrera">
                                    <i class="fas fa-trash me-1"></i>Eliminar
                                </button>
                                <button class="btn btn-outline-info btn-sm" 
                                        onclick="carreraController.cargarMateriasCarrera('${carrera.id}', '${this.escapeHtml(carrera.nombre)}')"
                                        title="Gestionar materias">
                                    <i class="fas fa-book me-1"></i>Materias
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Error al renderizar carreras:', error);
            this.mostrarMensaje('Error al mostrar las carreras', 'error');
        }
    }

    // Cargar carreras para select en materias
    async cargarCarrerasParaMaterias() {
        try {
            const carreras = await this.obtenerCarreras();
            const select = document.getElementById('select-carrera-materias');
            
            if (select) {
                select.innerHTML = '<option value="">Seleccione una carrera</option>' +
                    carreras.map(carrera => 
                        `<option value="${carrera.id}">${this.escapeHtml(carrera.nombre)}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error al cargar carreras para materias:', error);
        }
    }

    // Cargar carreras para select en estudiantes
    async cargarCarrerasParaSelect() {
        try {
            const carreras = await this.obtenerCarreras();
            const select = document.getElementById('carrera-estudiante');
            
            if (select) {
                select.innerHTML = '<option value="">Seleccione una carrera</option>' +
                    carreras.map(carrera => 
                        `<option value="${carrera.id}">${this.escapeHtml(carrera.nombre)}</option>`
                    ).join('');
            }
        } catch (error) {
            console.error('Error al cargar carreras para select:', error);
        }
    }

    // Función para cargar materias de una carrera específica
    cargarMateriasCarrera(carreraId, nombreCarrera) {
        // Estas funciones deben estar definidas en main.js
        if (typeof mostrarSeccion === 'function') {
            mostrarSeccion('administrativo');
            mostrarSubseccion('gestion-materias');
        }
        
        setTimeout(() => {
            const selectCarrera = document.getElementById('select-carrera-materias');
            if (selectCarrera) {
                selectCarrera.value = carreraId;
                const event = new Event('change');
                selectCarrera.dispatchEvent(event);
            }
            
            const btnNuevaMateria = document.getElementById('btn-nueva-materia');
            if (btnNuevaMateria) {
                btnNuevaMateria.disabled = false;
            }
            
            this.mostrarMensaje(`Cargando materias de: ${nombreCarrera}`, 'info');
        }, 100);
    }

    // Abrir modal para nueva carrera
    abrirModalNuevaCarrera() {
        const form = document.getElementById('form-carrera');
        if (form) form.reset();
        
        const carreraId = document.getElementById('carrera-id');
        if (carreraId) carreraId.value = '';
        
        const titulo = document.getElementById('modalCarreraTitulo');
        if (titulo) titulo.textContent = 'Agregar Nueva Carrera';
        
        const btnEliminar = document.getElementById('btn-eliminar-carrera');
        if (btnEliminar) btnEliminar.style.display = 'none';
    }

    // Editar carrera
    async editarCarrera(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`);
            const result = await response.json();
            
            if (result.success) {
                const carrera = result.data;
                
                document.getElementById('carrera-id').value = carrera.id;
                document.getElementById('resolucion').value = carrera.resolucion;
                document.getElementById('nombre-carrera').value = carrera.nombre;
                document.getElementById('horas-carrera').value = carrera.horas;
                
                document.getElementById('modalCarreraTitulo').textContent = 'Editar Carrera';
                document.getElementById('btn-eliminar-carrera').style.display = 'inline-block';
                
                // Usar Bootstrap modal si está disponible
                const modalElement = document.getElementById('modalCarrera');
                if (modalElement && typeof bootstrap !== 'undefined') {
                    const modal = new bootstrap.Modal(modalElement);
                    modal.show();
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al cargar carrera para editar:', error);
            this.mostrarMensaje('Error al cargar la carrera', 'error');
        }
    }

    // Guardar carrera
    async guardarCarrera() {
        const form = document.getElementById('form-carrera');
        if (!form) {
            this.mostrarMensaje('Formulario no encontrado', 'error');
            return;
        }

        const carreraId = document.getElementById('carrera-id').value;
        
        const carreraData = {
            resolucion: document.getElementById('resolucion').value,
            nombre: document.getElementById('nombre-carrera').value,
            horas: parseInt(document.getElementById('horas-carrera').value)
        };

        if (!carreraData.resolucion || !carreraData.nombre || !carreraData.horas) {
            this.mostrarMensaje('Por favor complete todos los campos', 'warning');
            return;
        }

        try {
            const url = carreraId ? `${this.apiUrl}/${carreraId}` : this.apiUrl;
            const method = carreraId ? 'PUT' : 'POST';

            console.log('Enviando datos:', { url, method, data: carreraData });

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(carreraData)
            });

            const result = await response.json();
            console.log('Respuesta del servidor:', result);

            if (result.success) {
                this.mostrarMensaje(result.message, 'success');
                
                // Cerrar modal si existe
                const modalElement = document.getElementById('modalCarrera');
                if (modalElement && typeof bootstrap !== 'undefined') {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                await this.renderizarCarreras();
                await this.cargarCarrerasParaSelect();
                await this.cargarCarrerasParaMaterias();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al guardar carrera:', error);
            this.mostrarMensaje(error.message || 'Error al guardar la carrera', 'error');
        }
    }

    // Confirmar eliminación
    eliminarCarreraConfirm(id, nombre) {
        if (confirm(`¿Está seguro que desea eliminar la carrera "${nombre}"?\n\nEsta acción no se puede deshacer.`)) {
            this.eliminarCarrera(id);
        }
    }

    // Eliminar carrera - FUNCIÓN CORREGIDA
    async eliminarCarrera(id) {
        try {
            console.log('Eliminando carrera ID:', id);
            
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            console.log('Respuesta de eliminación:', result);

            if (result.success) {
                this.mostrarMensaje(result.message, 'success');
                
                // Cerrar modal si está abierto
                const modalElement = document.getElementById('modalCarrera');
                if (modalElement && typeof bootstrap !== 'undefined') {
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    if (modal) modal.hide();
                }
                
                // Recargar datos
                await this.renderizarCarreras();
                await this.cargarCarrerasParaSelect();
                await this.cargarCarrerasParaMaterias();
            } else {
                this.mostrarMensaje(result.error || 'Error al eliminar la carrera', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar carrera:', error);
            this.mostrarMensaje('Error de conexión al eliminar la carrera', 'error');
        }
    }

    // Función de escape HTML para seguridad
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Sistema de mensajes
    mostrarMensaje(mensaje, tipo = 'info') {
        // Intentar usar el sistema de mensajes global si existe
        if (typeof mostrarMensaje === 'function') {
            mostrarMensaje(mensaje, tipo);
            return;
        }
        
        // Fallback: usar alertas nativas
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-danger',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[tipo] || 'alert-info';

        // Crear mensaje temporal
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert ${alertClass} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        // Agregar al contenedor de mensajes o al body
        const contenedor = document.getElementById('contenedor-mensajes') || document.body;
        contenedor.appendChild(alertDiv);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }
}

// Instancia global - CORREGIDO
const carreraController = new CarrerasController();

// Hacer funciones disponibles globalmente
window.carreraController = carreraController;

// Funciones globales para los botones del modal
function guardarCarrera() {
    carreraController.guardarCarrera();
}

function eliminarCarrera() {
    const carreraId = document.getElementById('carrera-id').value;
    const nombreCarrera = document.getElementById('nombre-carrera').value;
    if (carreraId) {
        carreraController.eliminarCarreraConfirm(carreraId, nombreCarrera);
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('CarrerasController inicializado');
});