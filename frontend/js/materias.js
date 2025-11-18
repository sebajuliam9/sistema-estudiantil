// js/materias.js - Gestión de materias
class MateriasController {
    constructor() {
        this.apiUrl = '/api/materias';
    }

    // Cargar materias de una carrera
    async cargarMateriasCarrera() {
        const carreraId = document.getElementById('select-carrera-materias').value;
        const listaMaterias = document.getElementById('lista-materias');
        const btnNuevaMateria = document.getElementById('btn-nueva-materia');

        if (!carreraId) {
            listaMaterias.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-book fa-3x mb-3"></i>
                    <p>Seleccione una carrera para ver sus materias</p>
                </div>
            `;
            btnNuevaMateria.disabled = true;
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/carrera/${carreraId}`);
            const result = await response.json();

            if (result.success) {
                const materias = result.data;
                
                if (materias.length === 0) {
                    listaMaterias.innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-book fa-3x mb-3"></i>
                            <p>No hay materias cargadas para esta carrera</p>
                            <button class="btn btn-warning mt-2" onclick="abrirModalMateria()">
                                <i class="fas fa-plus me-1"></i>Agregar Primera Materia
                            </button>
                        </div>
                    `;
                } else {
                    // Agrupar materias por curso
                    const materiasPorCurso = this.agruparMateriasPorCurso(materias);
                    
                    let html = '';
                    for (const [curso, materiasCurso] of Object.entries(materiasPorCurso)) {
                        html += `
                            <div class="card mb-4">
                                <div class="card-header bg-primary text-white">
                                    <h6 class="mb-0">${curso}</h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        ${materiasCurso.map(materia => `
                                            <div class="col-md-6 col-lg-4 mb-3">
                                                <div class="materia-item">
                                                    <div class="d-flex justify-content-between align-items-start">
                                                        <div>
                                                            <h6 class="mb-1">${materia.nombre}</h6>
                                                            <small class="text-muted">Régimen: ${materia.regimen}</small>
                                                        </div>
                                                        <div class="btn-group">
                                                            <button class="btn btn-outline-primary btn-sm" 
                                                                    onclick="materiaController.editarMateria('${materia.id}')"
                                                                    title="Editar materia">
                                                                <i class="fas fa-edit"></i>
                                                            </button>
                                                            <button class="btn btn-outline-danger btn-sm" 
                                                                    onclick="materiaController.eliminarMateriaConfirm('${materia.id}', '${escapeHtml(materia.nombre)}')"
                                                                    title="Eliminar materia">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        `;
                    }
                    
                    listaMaterias.innerHTML = html;
                }
                
                btnNuevaMateria.disabled = false;
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al cargar materias:', error);
            listaMaterias.innerHTML = `
                <div class="alert alert-danger">
                    Error al cargar las materias
                </div>
            `;
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

    // Abrir modal para nueva materia
    abrirModalMateria() {
        const carreraId = document.getElementById('select-carrera-materias').value;
        
        if (!carreraId) {
            mostrarMensaje('Por favor seleccione una carrera primero', 'warning');
            return;
        }

        document.getElementById('form-materia').reset();
        document.getElementById('materia-id').value = '';
        document.getElementById('materia-carrera-id').value = carreraId;
        document.getElementById('modalMateriaTitulo').textContent = 'Agregar Nueva Materia';
        document.getElementById('btn-eliminar-materia').style.display = 'none';
        
        const modal = new bootstrap.Modal(document.getElementById('modalMateria'));
        modal.show();
    }

    // Editar materia
    async editarMateria(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`);
            const result = await response.json();
            
            if (result.success) {
                const materia = result.data;
                
                document.getElementById('materia-id').value = materia.id;
                document.getElementById('materia-carrera-id').value = materia.carrera_id;
                document.getElementById('nombre-materia').value = materia.nombre;
                document.getElementById('curso-materia').value = materia.curso;
                document.getElementById('regimen-materia').value = materia.regimen;
                
                document.getElementById('modalMateriaTitulo').textContent = 'Editar Materia';
                document.getElementById('btn-eliminar-materia').style.display = 'inline-block';
                
                const modal = new bootstrap.Modal(document.getElementById('modalMateria'));
                modal.show();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al cargar materia para editar:', error);
            mostrarMensaje('Error al cargar la materia', 'error');
        }
    }

    // Guardar materia
    async guardarMateria() {
        const form = document.getElementById('form-materia');
        const materiaId = document.getElementById('materia-id').value;
        const carreraId = document.getElementById('materia-carrera-id').value;
        
        const materiaData = {
            carrera_id: carreraId,
            nombre: document.getElementById('nombre-materia').value,
            curso: document.getElementById('curso-materia').value,
            regimen: document.getElementById('regimen-materia').value
        };

        if (!materiaData.nombre || !materiaData.curso || !materiaData.regimen) {
            mostrarMensaje('Por favor complete todos los campos', 'warning');
            return;
        }

        try {
            const url = materiaId ? `${this.apiUrl}/${materiaId}` : this.apiUrl;
            const method = materiaId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(materiaData)
            });

            const result = await response.json();

            if (result.success) {
                mostrarMensaje(result.message, 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalMateria'));
                modal.hide();
                
                // Recargar la lista de materias
                await this.cargarMateriasCarrera();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al guardar materia:', error);
            mostrarMensaje('Error al guardar la materia', 'error');
        }
    }

    // Confirmar eliminación
    eliminarMateriaConfirm(id, nombre) {
        if (confirm(`¿Está seguro que desea eliminar la materia "${nombre}"?`)) {
            this.eliminarMateria(id);
        }
    }

    // Eliminar materia
    async eliminarMateria(id) {
        try {
            const response = await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                mostrarMensaje(result.message, 'success');
                
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalMateria'));
                if (modal) modal.hide();
                
                // Recargar la lista de materias
                await this.cargarMateriasCarrera();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error al eliminar materia:', error);
            mostrarMensaje('Error al eliminar la materia', 'error');
        }
    }
}

// Instancia global
const materiaController = new MateriasController();

// Funciones globales
function abrirModalMateria() {
    materiaController.abrirModalMateria();
}

function guardarMateria() {
    materiaController.guardarMateria();
}

function eliminarMateria() {
    const materiaId = document.getElementById('materia-id').value;
    if (materiaId) {
        materiaController.eliminarMateria(materiaId);
    }
}