// js/estudiantes.js - Gestión de estudiantes
class EstudiantesController {
    constructor() {
        this.apiUrl = '/api/estudiantes';
    }

    // Buscar estudiante por DNI
    async buscarEstudiante() {
        const dni = document.getElementById('buscar-dni').value;
        
        if (!dni) {
            mostrarMensaje('Por favor ingrese un DNI', 'warning');
            return;
        }

        if (!validarDNI(dni)) {
            mostrarMensaje('El DNI debe contener 7 u 8 números', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/buscar/${dni}`);
            const result = await response.json();

            const resultadoBusqueda = document.getElementById('resultado-busqueda');
            
            if (result.success && result.data) {
                const estudiante = result.data;
                resultadoBusqueda.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h5 class="card-title">${estudiante.nombre} ${estudiante.apellido}</h5>
                                    <p class="card-text">
                                        <strong>DNI:</strong> ${estudiante.dni}<br>
                                        <strong>Legajo:</strong> ${estudiante.legajo}<br>
                                        <strong>Domicilio:</strong> ${estudiante.domicilio}<br>
                                        <strong>Año de inicio:</strong> ${estudiante.anio_inicio}<br>
                                        <strong>Carrera:</strong> ${estudiante.carrera_nombre}
                                    </p>
                                </div>
                                <div class="btn-group-vertical">
                                    <button class="btn btn-outline-primary btn-sm" 
                                            onclick="estudianteController.editarEstudiante('${estudiante.id}')">
                                        <i class="fas fa-edit me-1"></i>Modificar
                                    </button>
                                    <button class="btn btn-outline-danger btn-sm" 
                                            onclick="estudianteController.eliminarEstudianteConfirm('${estudiante.id}', '${estudiante.nombre} ${estudiante.apellido}')">
                                        <i class="fas fa-trash me-1"></i>Eliminar
                                    </button>
                                    <button class="btn btn-outline-info btn-sm" 
                                            onclick="estudianteController.cargarNotasEstudiante('${estudiante.id}', '${estudiante.nombre} ${estudiante.apellido}')">
                                        <i class="fas fa-book me-1"></i>Cargar Notas
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                resultadoBusqueda.innerHTML = `
                    <div class="alert alert-warning">
                        <i class="fas fa-user-slash me-2"></i>
                        No se encontró ningún estudiante con DNI: ${dni}
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al buscar estudiante:', error);
            mostrarMensaje('Error al buscar el estudiante', 'error');
        }
    }

    // Abrir modal para nuevo estudiante++
    abrirModalNuevoEstudiante() {
        document.getElementById('form-estudiante').reset();
        document.getElementById('estudiante-id').value = '';
        document.getElementById('modalEstudianteTitulo').textContent = 'Agregar Nuevo Estudiante';
        document.getElementById('btn-eliminar-estudiante').style.display = 'none';
        
        // Cargar carreras en el select
        carreraController.cargarCarrerasParaSelect();
    }

    // Editar estudiante
    async editarEstudiante(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`);
            const result = await response.json();
            
            if (result.success) {
                const estudiante = result.data;
                
                document.getElementById('estudiante-id').value = estudiante.id;
                document.getElementById('dni').value = estudiante.dni;
                document.getElementById('legajo').value = estudiante.legajo;
                document.getElementById('nombre').value = estudiante.nombre;
                document.getElementById('apellido').value = estudiante.apellido;
                document.getElementById('domicilio').value = estudiante.domicilio;
                document.getElementById('anio-inicio').value = estudiante.anio_inicio;
                
                // Cargar carreras y seleccionar la del estudiante
                await carreraController.cargarCarrerasParaSelect();
                document.getElementById('carrera-estudiante').value = estudiante.carrera_id;
                
                document.getElementById('modalEstudianteTitulo').textContent = 'Editar Estudiante';
                document.getElementById('btn-eliminar-estudiante').style.display = 'inline-block';
                
                const modal = new bootstrap.Modal(document.getElementById('modalEstudiante'));
                modal.show();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al cargar estudiante para editar:', error);
            mostrarMensaje('Error al cargar el estudiante', 'error');
        }
    }

    // Guardar estudiante
    async guardarEstudiante() {
        const form = document.getElementById('form-estudiante');
        const estudianteId = document.getElementById('estudiante-id').value;
        
        const estudianteData = {
            dni: document.getElementById('dni').value,
            legajo: document.getElementById('legajo').value,
            nombre: document.getElementById('nombre').value,
            apellido: document.getElementById('apellido').value,
            domicilio: document.getElementById('domicilio').value,
            anio_inicio: parseInt(document.getElementById('anio-inicio').value),
            carrera_id: document.getElementById('carrera-estudiante').value
        };

        // Validaciones
        if (!estudianteData.dni || !estudianteData.legajo || !estudianteData.nombre || 
            !estudianteData.apellido || !estudianteData.domicilio || !estudianteData.anio_inicio || 
            !estudianteData.carrera_id) {
            mostrarMensaje('Por favor complete todos los campos', 'warning');
            return;
        }

        if (!validarDNI(estudianteData.dni)) {
            mostrarMensaje('El DNI debe contener 7 u 8 números', 'warning');
            return;
        }

        try {
            const url = estudianteId ? `${this.apiUrl}/${estudianteId}` : this.apiUrl;
            const method = estudianteId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(estudianteData)
            });

            const result = await response.json();

            if (result.success) {
                mostrarMensaje(result.message, 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstudiante'));
                modal.hide();
                
                // Limpiar búsqueda
                document.getElementById('resultado-busqueda').innerHTML = '';
                document.getElementById('buscar-dni').value = '';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al guardar estudiante:', error);
            mostrarMensaje('Error al guardar el estudiante', 'error');
        }
    }

    // Confirmar eliminación
    eliminarEstudianteConfirm(id, nombre) {
        if (confirm(`¿Está seguro que desea eliminar al estudiante "${nombre}"?`)) {
            this.eliminarEstudiante(id);
        }
    }

    // Eliminar estudiante
    async eliminarEstudiante(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                mostrarMensaje(result.message, 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstudiante'));
                if (modal) modal.hide();
                
                // Limpiar búsqueda
                document.getElementById('resultado-busqueda').innerHTML = '';
                document.getElementById('buscar-dni').value = '';
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al eliminar estudiante:', error);
            mostrarMensaje('Error al eliminar el estudiante', 'error');
        }
    }

    // Cargar notas de estudiante
    async cargarNotasEstudiante(estudianteId, nombreEstudiante) {
        try {
            // Obtener datos del estudiante
            const response = await fetch(`${this.apiUrl}/${estudianteId}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error('Error al cargar datos del estudiante');
            }

            const estudiante = result.data;
            
            // Obtener materias de la carrera del estudiante
            const materiasResponse = await fetch(`/api/materias/carrera/${estudiante.carrera_id}`);
            const materiasResult = await materiasResponse.json();
            
            // Obtener notas existentes del estudiante
            const notasResponse = await fetch(`${this.apiUrl}/${estudianteId}/notas`);
            const notasResult = await notasResponse.json();
            const notasExistentes = notasResult.success ? notasResult.data : [];

            // Configurar modal
            document.getElementById('nombre-estudiante-notas').textContent = nombreEstudiante;
            
            const contenedorNotas = document.getElementById('contenedor-notas');
            
            // Agrupar materias por curso
            const materiasPorCurso = this.agruparMateriasPorCurso(materiasResult.data || []);
            
            let html = '';
            
            for (const [curso, materias] of Object.entries(materiasPorCurso)) {
                html += `
                    <div class="card mb-4">
                        <div class="card-header bg-secondary text-white">
                            <h6 class="mb-0">${curso}</h6>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Materia</th>
                                            <th>Régimen</th>
                                            <th>Calificación</th>
                                            <th>Fecha Aprobación</th>
                                            <th>Condición</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${materias.map(materia => {
                                            const notaExistente = notasExistentes.find(n => n.materia_id === materia.id);
                                            return `
                                                <tr data-materia-id="${materia.id}">
                                                    <td>${materia.nombre}</td>
                                                    <td>${materia.regimen}</td>
                                                    <td>
                                                        <input type="number" class="form-control form-control-sm calificacion" 
                                                               min="1" max="10" step="0.1" 
                                                               value="${notaExistente ? notaExistente.calificacion : ''}"
                                                               placeholder="1-10">
                                                    </td>
                                                    <td>
                                                        <input type="date" class="form-control form-control-sm fecha-aprobacion"
                                                               value="${notaExistente ? notaExistente.fecha_aprobacion : ''}">
                                                    </td>
                                                    <td>
                                                        <select class="form-select form-select-sm condicion">
                                                            <option value="">Seleccionar</option>
                                                            <option value="aprobado" ${notaExistente && notaExistente.condicion === 'aprobado' ? 'selected' : ''}>Aprobado</option>
                                                            <option value="regular" ${notaExistente && notaExistente.condicion === 'regular' ? 'selected' : ''}>Regular</option>
                                                            <option value="libre" ${notaExistente && notaExistente.condicion === 'libre' ? 'selected' : ''}>Libre</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            contenedorNotas.innerHTML = html;
            
            // Guardar ID del estudiante en el contenedor
            contenedorNotas.setAttribute('data-estudiante-id', estudianteId);
            
            const modal = new bootstrap.Modal(document.getElementById('modalNotas'));
            modal.show();
            
        } catch (error) {
            console.error('Error al cargar notas:', error);
            mostrarMensaje('Error al cargar las notas del estudiante', 'error');
        }
    }

    // Agrupar materias por curso
    agruparMateriasPorCurso(materias) {
        return materias.reduce((grupos, materia) => {
            const curso = materia.curso;
            if (!grupos[curso]) {
                grupos[curso] = [];
            }
            grupos[curso].push(materia);
            return grupos;
        }, {});
    }

    // Guardar todas las notas
    async guardarTodasNotas() {
        const contenedorNotas = document.getElementById('contenedor-notas');
        const estudianteId = contenedorNotas.getAttribute('data-estudiante-id');
        
        if (!estudianteId) {
            mostrarMensaje('Error: No se encontró el ID del estudiante', 'error');
            return;
        }

        const filasNotas = contenedorNotas.querySelectorAll('tbody tr');
        const notasData = [];

        let hayErrores = false;

        filasNotas.forEach(fila => {
            const materiaId = fila.getAttribute('data-materia-id');
            const calificacion = fila.querySelector('.calificacion').value;
            const fechaAprobacion = fila.querySelector('.fecha-aprobacion').value;
            const condicion = fila.querySelector('.condicion').value;

            // Validar que si hay calificación, también haya fecha y condición
            if (calificacion || fechaAprobacion || condicion) {
                if (!calificacion || !fechaAprobacion || !condicion) {
                    hayErrores = true;
                    mostrarMensaje('Complete todos los campos para las materias con datos', 'warning');
                    return;
                }

                if (calificacion < 1 || calificacion > 10) {
                    hayErrores = true;
                    mostrarMensaje('La calificación debe estar entre 1 y 10', 'warning');
                    return;
                }

                notasData.push({
                    materia_id: materiaId,
                    calificacion: parseFloat(calificacion),
                    fecha_aprobacion: fechaAprobacion,
                    condicion: condicion
                });
            }
        });

        if (hayErrores) return;

        try {
            const response = await fetch(`${this.apiUrl}/${estudianteId}/notas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notas: notasData })
            });

            const result = await response.json();

            if (result.success) {
                mostrarMensaje('Notas guardadas correctamente', 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalNotas'));
                modal.hide();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al guardar notas:', error);
            mostrarMensaje('Error al guardar las notas', 'error');
        }
    }

    // Cargar información del estudiante (para panel estudiante)
    async cargarInfoEstudiante() {
        if (!AppState.currentStudent) return;

        try {
            const response = await fetch(`${this.apiUrl}/${AppState.currentStudent.id}`);
            const result = await response.json();

            if (result.success) {
                const estudiante = result.data;
                const infoEstudiante = document.getElementById('info-estudiante');
                
                infoEstudiante.innerHTML = `
                    <div class="col-md-6">
                        <p><strong>DNI:</strong> ${estudiante.dni}</p>
                        <p><strong>Legajo:</strong> ${estudiante.legajo}</p>
                        <p><strong>Nombre:</strong> ${estudiante.nombre} ${estudiante.apellido}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Domicilio:</strong> ${estudiante.domicilio}</p>
                        <p><strong>Año de inicio:</strong> ${estudiante.anio_inicio}</p>
                        <p><strong>Carrera:</strong> ${estudiante.carrera_nombre}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error al cargar información del estudiante:', error);
        }
    }
}

// Instancia global
const estudianteController = new EstudiantesController();

// Funciones globales
function buscarEstudiante() {
    estudianteController.buscarEstudiante();
}

function guardarEstudiante() {
    estudianteController.guardarEstudiante();
}

function eliminarEstudiante() {
    const estudianteId = document.getElementById('estudiante-id').value;
    if (estudianteId) {
        estudianteController.eliminarEstudiante(estudianteId);
    }
}

function guardarTodasNotas() {
    estudianteController.guardarTodasNotas();
}

// =============================================
// FUNCIONES NUEVAS PARA PANEL ESTUDIANTE
// =============================================

function cargarInformacionEstudiante(estudiante) {
    const contenedorInfo = document.getElementById('info-estudiante');
    
    if (contenedorInfo && estudiante) {
        contenedorInfo.innerHTML = `
            <div class="col-md-6">
                <p><strong>Nombre:</strong> ${estudiante.nombre || 'No disponible'} ${estudiante.apellido || ''}</p>
                <p><strong>DNI:</strong> ${estudiante.dni || 'No disponible'}</p>
                <p><strong>Legajo:</strong> ${estudiante.legajo || 'No disponible'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Carrera:</strong> ${estudiante.carrera_nombre || estudiante.carrera || 'No disponible'}</p>
                <p><strong>Año de inicio:</strong> ${estudiante.anio_inicio || 'No disponible'}</p>
                <p><strong>Domicilio:</strong> ${estudiante.domicilio || 'No disponible'}</p>
            </div>
        `;
    }
}

async function cargarMateriasYNotas(estudianteId) {
    try {
        // Obtener datos del estudiante para saber su carrera
        const responseEstudiante = await fetch(`/api/estudiantes/${estudianteId}`);
        const resultEstudiante = await responseEstudiante.json();
        
        if (!resultEstudiante.success) return;
        
        const estudiante = resultEstudiante.data;
        
        // Obtener materias de la carrera
        const responseMaterias = await fetch(`/api/materias/carrera/${estudiante.carrera_id}`);
        const resultMaterias = await responseMaterias.json();
        
        // Obtener notas del estudiante
        const responseNotas = await fetch(`/api/estudiantes/${estudianteId}/notas`);
        const resultNotas = await responseNotas.json();
        const notas = resultNotas.success ? resultNotas.data : [];
        
        // Aquí puedes crear una tabla para mostrar materias y notas
        console.log('Materias cargadas:', resultMaterias.data);
        console.log('Notas cargadas:', notas);
        
    } catch (error) {
        console.error('Error al cargar materias y notas:', error);
    }
}