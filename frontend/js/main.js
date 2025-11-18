// js/main.js - SISTEMA COMPLETO IES N° 2 HUMAHUACA
// =================================================

// Estado global de la aplicación
const AppState = {
    adminLoggedIn: false,
    studentLoggedIn: false,
    currentStudent: null,
    currentAdmin: null,
    carreras: [],
    estudiantes: [],
    materias: [],
    analiticos: []
};

// =================================================
// FUNCIONES PRINCIPALES DEL SISTEMA
// =================================================

// Función para mostrar mensajes
function mostrarMensaje(mensaje, tipo = 'info') {
    let contenedor = document.getElementById('contenedor-mensajes');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'contenedor-mensajes';
        contenedor.style.position = 'fixed';
        contenedor.style.top = '20px';
        contenedor.style.right = '20px';
        contenedor.style.zIndex = '9999';
        contenedor.style.minWidth = '300px';
        document.body.appendChild(contenedor);
    }

    const alertClass = {
        'success': 'alert-success',
        'error': 'alert-danger',
        'warning': 'alert-warning',
        'info': 'alert-info'
    }[tipo] || 'alert-info';

    const iconClass = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    }[tipo] || 'fa-info-circle';

    const mensajeHTML = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="fas ${iconClass} me-2"></i>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    contenedor.innerHTML = mensajeHTML;
    
    setTimeout(() => {
        const alert = contenedor.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

// Función para mostrar secciones principales
function mostrarSeccion(seccionId, event = null) {
    document.querySelectorAll('.seccion').forEach(seccion => {
        seccion.style.display = 'none';
    });
    
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const seccion = document.getElementById(seccionId);
    if (seccion) {
        seccion.style.display = 'block';
        
        switch(seccionId) {
            case 'inicio':
                cargarDatosInicio();
                break;
            case 'administrativo':
                if (!AppState.adminLoggedIn) {
                    mostrarLoginAdmin();
                } else {
                    mostrarPanelAdmin();
                    cargarCarrerasReales();
                }
                break;
            case 'analiticos':
                if (!AppState.studentLoggedIn) {
                  //  mostrarLoginEstudiante();
                }
                break;
        }
    }
}

// Función para mostrar subsecciones del panel administrativo
function mostrarSubseccion(subseccionId, event = null) {
    document.querySelectorAll('.subseccion').forEach(subseccion => {
        subseccion.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-tabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    const subseccion = document.getElementById(subseccionId);
    if (subseccion) {
        subseccion.style.display = 'block';
        
        switch(subseccionId) {
            case 'gestion-carreras':
                cargarCarrerasReales();
                break;
            case 'gestion-estudiantes':
                // Solo cargar carreras para el select
                cargarCarrerasParaSelect();
                break;
            case 'gestion-materias':
                cargarCarrerasParaMaterias();
                break;
            case 'gestion-analiticos':
                cargarSolicitudesAnaliticos();
                break;
        }
    }
}

// =================================================
// AUTENTICACIÓN
// =================================================

function mostrarLoginAdmin() {
    document.getElementById('login-admin').style.display = 'block';
    document.getElementById('panel-admin').style.display = 'none';
}

function mostrarPanelAdmin() {
    document.getElementById('login-admin').style.display = 'none';
    document.getElementById('panel-admin').style.display = 'block';
}

// ================================
// ⚙️ Inicializar botones y eventos
// ================================
function inicializarEventos() {
  const btnLogin = document.getElementById('btnLogin');
  const btnRegistro = document.getElementById('btnRegistro');

  if (btnLogin) btnLogin.addEventListener('click', loginEstudiante);
  if (btnRegistro) btnRegistro.addEventListener('click', registrarEstudiante);
}


// ================================
// 🚪 Cerrar sesión (opcional)
// ================================
function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('estudiante');
  alert('👋 Sesión cerrada');
  window.location.href = '/index.html';
}

// ================================
// 🔍 Verificar si hay sesión activa
// ================================
function verificarSesion() {
  const token = localStorage.getItem('token');
  const estudiante = localStorage.getItem('estudiante');

  if (token && estudiante) {
    console.log('🟢 Sesión activa para:', JSON.parse(estudiante).nombre);
    return true;
  }

  console.log('🔴 No hay sesión activa');
  return false;
}

function mostrarPanelEstudiante() {
    // Ocultar formulario de login
    const loginEstudiante = document.getElementById('login-estudiante');
    if (loginEstudiante) {
        loginEstudiante.style.display = 'none';
    }
    
    // Mostrar panel del estudiante
    const panelEstudiante = document.getElementById('panel-estudiante');
    if (panelEstudiante) {
        panelEstudiante.style.display = 'block';
    }
    
    // Cargar información del estudiante después del login
    cargarInfoEstudiante();
    cargarAnaliticosEstudiante();
}

// FUNCIÓN NUEVA - Cargar información del estudiante en panel de solicitud de analitico
async function cargarInfoEstudiante() {
    if (!AppState.currentStudent) {
        console.error('❌ No hay estudiante logueado');
        return;
    }

    try {
        const estudiante = AppState.currentStudent;
        const infoEstudiante = document.getElementById('info-estudiante');
        
        if (infoEstudiante) {
            infoEstudiante.innerHTML = `
                <div class="row">
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-primary text-white">
                                <h6 class="mb-0"><i class="fas fa-user me-2"></i>Información Personal</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Nombre:</strong> ${estudiante.nombre || 'No disponible'}</p>
                                <p><strong>Apellido:</strong> ${estudiante.apellido || 'No disponible'}</p>
                                <p><strong>DNI:</strong> ${estudiante.dni || 'No disponible'}</p>
                                <p><strong>Legajo:</strong> ${estudiante.legajo || 'No disponible'}</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card mb-3">
                            <div class="card-header bg-success text-white">
                                <h6 class="mb-0"><i class="fas fa-graduation-cap me-2"></i>Información Académica</h6>
                            </div>
                            <div class="card-body">
                                <p><strong>Carrera:</strong> ${estudiante.carrera_nombre || 'No disponible'}</p>
                                <p><strong>Año de inicio:</strong> ${estudiante.anio_inicio || 'No disponible'}</p>
                                <p><strong>Domicilio:</strong> ${estudiante.domicilio || 'No disponible'}</p>
                                <p><strong>Estado:</strong> <span class="badge bg-success">Activo</span></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="materias-estudiante-container">
                    <!-- Aquí se cargarán las materias -->
                </div>
            `;
        }

        // Cargar materias del estudiante
        await cargarMateriasEstudiante(estudiante.id, estudiante.carrera_id);

    } catch (error) {
        console.error('❌ Error al cargar información del estudiante:', error);
        mostrarMensaje('Error al cargar la información del estudiante', 'error');
    }
}

// AGREGA ESTO INMEDIATAMENTE DESPUÉS de cargarInfoEstudiante
async function cargarMateriasEstudiante(estudianteId, carreraId) {
    try {
        console.log('📚 Cargando materias para estudiante:', estudianteId, 'carrera:', carreraId);
        
        // 1. Obtener materias de la carrera
        const materiasResponse = await fetch(`/api/materias/carrera/${carreraId}`);
        const materiasResult = await materiasResponse.json();

        // 2. Obtener notas del estudiante
        const notasResponse = await fetch(`/api/estudiantes/${estudianteId}/notas`);
        const notasResult = await notasResponse.json();
        const notasEstudiante = notasResult.success ? notasResult.data : [];

        const contenedorMaterias = document.getElementById('materias-estudiante-container');
        
        if (!materiasResult.success || !materiasResult.data.length) {
            contenedorMaterias.innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    No hay materias cargadas para esta carrera.
                </div>
            `;
            return;
        }

        // Agrupar materias por curso
        const materiasPorCurso = materiasResult.data.reduce((grupos, materia) => {
            const curso = materia.curso || 'Sin curso asignado';
            if (!grupos[curso]) {
                grupos[curso] = [];
            }
            
            // Buscar nota para esta materia
            const notaMateria = notasEstudiante.find(nota => nota.materia_id === materia.id);
            materia.nota = notaMateria;
            
            grupos[curso].push(materia);
            return grupos;
        }, {});

        let html = `
            <div class="card mt-4">
                <div class="card-header bg-warning text-dark">
                    <h6 class="mb-0"><i class="fas fa-book me-2"></i>Materias por Curso</h6>
                </div>
                <div class="card-body">
        `;

        for (const [curso, materias] of Object.entries(materiasPorCurso)) {
            html += `
                <div class="mb-4">
                    <h6 class="text-primary border-bottom pb-2">${curso}</h6>
                    <div class="table-responsive">
                        <table class="table table-sm table-striped">
                            <thead class="table-light">
                                <tr>
                                    <th>Materia</th>
                                    <th>Régimen</th>
                                    <th>Calificación</th>
                                    <th>Fecha Aprobación</th>
                                    <th>Condición</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${materias.map(materia => {
                                    const nota = materia.nota;
                                    const estado = nota ? 
                                        `<span class="badge bg-success">Cursada</span>` : 
                                        `<span class="badge bg-secondary">Pendiente</span>`;
                                    
                                    return `
                                        <tr>
                                            <td>${materia.nombre}</td>
                                            <td>${materia.regimen}</td>
                                            <td>${nota ? nota.calificacion : '-'}</td>
                                            <td>${nota ? new Date(nota.fecha_aprobacion).toLocaleDateString('es-AR') : '-'}</td>
                                            <td>${nota ? nota.condicion : '-'}</td>
                                            <td>${estado}</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;

        contenedorMaterias.innerHTML = html;
        console.log('✅ Materias cargadas correctamente');

    } catch (error) {
        console.error('❌ Error al cargar materias del estudiante:', error);
        const contenedorMaterias = document.getElementById('materias-estudiante-container');
        contenedorMaterias.innerHTML = `
            <div class="alert alert-danger mt-4">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Error al cargar las materias del estudiante.
            </div>
        `;
    }
}


function cerrarSesionEstudiante() {
    console.log('🔐 Cerrando sesión de estudiante...');
    
    try {
        // 1. Limpiar estado de la aplicación
        AppState.studentLoggedIn = false;
        AppState.currentStudent = null;
        
        // 2. Limpiar localStorage
        localStorage.removeItem('estudianteLogueado');
        localStorage.removeItem('token');
        
        // 3. Ocultar panel del estudiante
        const panelEstudiante = document.getElementById('panel-estudiante');
        if (panelEstudiante) {
            panelEstudiante.style.display = 'none';
            console.log('✅ Panel del estudiante ocultado');
        }
        
        // 4. Mostrar formulario de login
        const loginEstudiante = document.getElementById('login-estudiante');
        if (loginEstudiante) {
            loginEstudiante.style.display = 'block';
            console.log('✅ Formulario de login mostrado');
        }
        
        // 5. Limpiar campos del formulario
        const usuarioInput = document.getElementById('usuario');
        const passwordInput = document.getElementById('password');
        if (usuarioInput) usuarioInput.value = '';
        if (passwordInput) passwordInput.value = '';
        
        // 6. Mostrar mensaje
        mostrarMensaje('Sesión cerrada exitosamente', 'success');
        console.log('✅ Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('❌ Error al cerrar sesión:', error);
        // Fallback: recargar la página
        window.location.reload();
    }
}

// Y AGREGA esta función que falta:
function mostrarLoginEstudiante() {
    const loginEstudiante = document.getElementById('login-estudiante');
    const panelEstudiante = document.getElementById('panel-estudiante');
    
    if (loginEstudiante) loginEstudiante.style.display = 'block';
    if (panelEstudiante) panelEstudiante.style.display = 'none';
    
    // Limpiar campos
    const usuarioInput = document.getElementById('usuario');
    const passwordInput = document.getElementById('password');
    if (usuarioInput) usuarioInput.value = '';
    if (passwordInput) passwordInput.value = '';
    
    console.log('🔐 Mostrando formulario de login');
}

function loginAdmin() {
    const usuario = document.getElementById('usuario-admin').value;
    const password = document.getElementById('password-admin').value;

    if (usuario === 'admin' && password === '1234') {
        AppState.adminLoggedIn = true;
        mostrarPanelAdmin();
        cargarCarrerasReales();
        mostrarMensaje('Bienvenido al panel administrativo', 'success');
    } else {
        mostrarMensaje('Usuario o contraseña incorrectos', 'error');
    }
}

function cerrarSesionAdmin() {
    AppState.adminLoggedIn = false;
    mostrarLoginAdmin();
    mostrarMensaje('Sesión cerrada correctamente', 'info');
}

// =================================================
// SOLICITUD DE ANALÍTICOS - ESTUDIANTE
// =================================================
/*
async function solicitarNuevoAnalitico() {
    if (!AppState.currentStudent) {
        mostrarMensaje('Debe estar logueado para solicitar un analítico', 'warning');
        return;
    }

    if (!confirm('¿Está seguro que desea solicitar un nuevo analítico?')) {
        return;
    }

    try {
        const response = await fetch('/api/analiticos/solicitar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estudiante_id: AppState.currentStudent.id
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje('Solicitud de analítico creada correctamente', 'success');
            cargarAnaliticosEstudiante(); // Recargar la lista
        } else {
            mostrarMensaje(result.error || 'Error al crear la solicitud', 'error');
        }
    } catch (error) {
        console.error('Error al solicitar analítico:', error);
        mostrarMensaje('Error al conectar con el servidor', 'error');
    }
}
async function cargarAnaliticosEstudiante() {
    if (!AppState.currentStudent) {
        console.error('❌ No hay estudiante logueado');
        return;
    }

    try {
        const response = await fetch(`/api/analiticos/estudiante/${AppState.currentStudent.id}`);
        const result = await response.json();

        const tablaAnaliticos = document.getElementById('tabla-analiticos');
        
        if (result.success && result.data.length > 0) {
            tablaAnaliticos.innerHTML = result.data.map(analitico => `
                <tr>
                    <td>${formatearFecha(analitico.fecha_solicitud)}</td>
                    <td>
                        <span class="badge ${analitico.estado === 'aprobado' ? 'bg-success' : 
                                          analitico.estado === 'pendiente' ? 'bg-warning' : 
                                          'bg-secondary'}">
                            ${analitico.estado}
                        </span>
                    </td>
                    <td>
                        ${analitico.estado === 'aprobado' ? 
                            `<button class="btn btn-success btn-sm" onclick="descargarAnaliticoPDF('${analitico.id}')">
                                <i class="fas fa-download me-1"></i>Descargar PDF
                            </button>` : 
                            `<button class="btn btn-outline-secondary btn-sm" disabled>
                                <i class="fas fa-clock me-1"></i>Pendiente
                            </button>`
                        }
                        <button class="btn btn-info btn-sm ms-1" onclick="verDetallesAnaliticoEstudiante('${analitico.id}')">
                            <i class="fas fa-eye me-1"></i>Ver
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tablaAnaliticos.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center text-muted py-4">
                        <i class="fas fa-file-alt fa-2x mb-3"></i>
                        <p>No hay solicitudes de analíticos</p>
                        <button class="btn btn-warning btn-sm" onclick="solicitarNuevoAnalitico()">
                            <i class="fas fa-plus me-1"></i>Solicitar Primer Analítico
                        </button>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error al cargar analíticos:', error);
        mostrarMensaje('Error al cargar los analíticos', 'error');
    }
}
async function descargarAnaliticoPDF(analiticoId) {
    try {
        // Abrir en nueva pestaña para descargar PDF
        window.open(`/api/analiticos/${analiticoId}/pdf`, '_blank');
        
        mostrarMensaje('Descargando analítico en PDF...', 'info');
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        mostrarMensaje('Error al descargar el PDF', 'error');
    }
}
async function verDetallesAnaliticoEstudiante(analiticoId) {
    try {
        const response = await fetch(`/api/analiticos/${analiticoId}/detalles`);
        const result = await response.json();

        if (result.success) {
            const detalles = result.data;
            alert(`Detalles del Analítico:\n\n` +
                  `Fecha Solicitud: ${formatearFecha(detalles.fecha_solicitud)}\n` +
                  `Estado: ${detalles.estado}\n` +
                  `Carrera: ${detalles.carrera_nombre}\n` +
                  `Estudiante: ${detalles.estudiante_nombre} ${detalles.estudiante_apellido}`);
        } else {
            mostrarMensaje('Error al cargar detalles', 'error');
        }
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarMensaje('Error al cargar los detalles', 'error');
    }
}
*/
// =================================================
// GESTIÓN DE CARRERAS - COMPLETO
// =================================================

async function cargarCarrerasReales() {
    try {
        const response = await fetch('/api/carreras');
        const result = await response.json();

        const gridCarreras = document.getElementById('grid-carreras');
        
        if (result.success && result.data.length > 0) {
            AppState.carreras = result.data;
            
            gridCarreras.innerHTML = result.data.map(carrera => `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card h-100 shadow-sm carrera-card">
                        <div class="card-header bg-success text-white">
                            <h6 class="card-title mb-0">${carrera.nombre}</h6>
                        </div>
                        <div class="card-body">
                            <p class="card-text">
                                <strong>Resolución:</strong> ${carrera.resolucion}<br>
                                <strong>Horas:</strong> ${carrera.horas} horas
                            </p>
                        </div>
                        <div class="card-footer bg-transparent">
                            <div class="btn-group w-100" role="group">
                                <button class="btn btn-outline-primary btn-sm" 
                                        onclick="editarCarrera('${carrera.id}')">
                                    <i class="fas fa-edit me-1"></i>Editar
                                </button>
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="eliminarCarreraConfirm('${carrera.id}', '${carrera.nombre}')">
                                    <i class="fas fa-trash me-1"></i>Eliminar
                                </button>
                                <button class="btn btn-outline-info btn-sm" 
                                        onclick="verMateriasCarrera('${carrera.id}', '${carrera.nombre}')">
                                    <i class="fas fa-book me-1"></i>Materias
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            gridCarreras.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No hay carreras registradas</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar carreras:', error);
        mostrarMensaje('Error al cargar las carreras', 'error');
    }
}

function abrirModalCarrera() {
    document.getElementById('form-carrera').reset();
    document.getElementById('carrera-id').value = '';
    document.getElementById('modalCarreraTitulo').textContent = 'Agregar Nueva Carrera';
    document.getElementById('btn-eliminar-carrera').style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('modalCarrera'));
    modal.show();
}

async function guardarCarrera() {
    const carreraId = document.getElementById('carrera-id').value;
    const resolucion = document.getElementById('resolucion').value;
    const nombre = document.getElementById('nombre-carrera').value;
    const horas = document.getElementById('horas-carrera').value;

    if (!resolucion || !nombre || !horas) {
        mostrarMensaje('Por favor complete todos los campos', 'warning');
        return;
    }

    try {
        const url = carreraId ? `/api/carreras/${carreraId}` : '/api/carreras';
        const method = carreraId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                resolucion: resolucion,
                nombre: nombre,
                horas: parseInt(horas)
            })
        });

        const result = await response.json();

        if (result.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCarrera'));
            modal.hide();
            mostrarMensaje(result.message, 'success');
            cargarCarrerasReales();
        } else {
            mostrarMensaje(result.error, 'error');
        }

    } catch (error) {
        console.error('Error al guardar carrera:', error);
        mostrarMensaje('Error al guardar la carrera', 'error');
    }
}

async function editarCarrera(id) {
    try {
        const response = await fetch(`/api/carreras/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const carrera = result.data;
            
            document.getElementById('carrera-id').value = carrera.id;
            document.getElementById('resolucion').value = carrera.resolucion;
            document.getElementById('nombre-carrera').value = carrera.nombre;
            document.getElementById('horas-carrera').value = carrera.horas;
            
            document.getElementById('modalCarreraTitulo').textContent = 'Editar Carrera';
            document.getElementById('btn-eliminar-carrera').style.display = 'inline-block';
            
            const modal = new bootstrap.Modal(document.getElementById('modalCarrera'));
            modal.show();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al cargar carrera para editar:', error);
        mostrarMensaje('Error al cargar la carrera', 'error');
    }
}

function eliminarCarreraConfirm(id, nombre) {
    if (confirm(`¿Está seguro que desea eliminar la carrera "${nombre}"?`)) {
        eliminarCarrera(id);
    }
}

async function eliminarCarrera(id) {
    try {
        const response = await fetch(`/api/carreras/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje(result.message, 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalCarrera'));
            if (modal) modal.hide();
            cargarCarrerasReales();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al eliminar carrera:', error);
        mostrarMensaje('Error al eliminar la carrera', 'error');
    }
}

function verMateriasCarrera(carreraId, nombreCarrera) {
    mostrarSubseccion('gestion-materias');
    
    setTimeout(() => {
        const selectCarrera = document.getElementById('select-carrera-materias');
        if (selectCarrera) {
            selectCarrera.value = carreraId;
            const event = new Event('change');
            selectCarrera.dispatchEvent(event);
        }
        
        mostrarMensaje(`Cargando materias de: ${nombreCarrera}`, 'info');
    }, 100);
}

// =================================================
// GESTIÓN DE MATERIAS - COMPLETO
// =================================================

async function cargarCarrerasParaMaterias() {
    try {
        const response = await fetch('/api/carreras');
        const result = await response.json();
        
        const select = document.getElementById('select-carrera-materias');
        const btnNuevaMateria = document.getElementById('btn-nueva-materia');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccione una carrera</option>' +
                result.data.map(carrera => 
                    `<option value="${carrera.id}">${carrera.nombre}</option>`
                ).join('');
        }
        
        if (btnNuevaMateria) {
            btnNuevaMateria.disabled = true;
        }
    } catch (error) {
        console.error('Error al cargar carreras para materias:', error);
    }
}

async function cargarMateriasCarrera() {
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
        const response = await fetch(`/api/materias/carrera/${carreraId}`);
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
                const materiasPorCurso = materias.reduce((grupos, materia) => {
                    const curso = materia.curso;
                    if (!grupos[curso]) {
                        grupos[curso] = [];
                    }
                    grupos[curso].push(materia);
                    return grupos;
                }, {});
                
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
                                                                onclick="editarMateria('${materia.id}')">
                                                            <i class="fas fa-edit"></i>
                                                        </button>
                                                        <button class="btn btn-outline-danger btn-sm" 
                                                                onclick="eliminarMateriaConfirm('${materia.id}', '${materia.nombre}')">
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

function abrirModalMateria() {
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

async function guardarMateria() {
    const materiaId = document.getElementById('materia-id').value;
    const carreraId = document.getElementById('materia-carrera-id').value;
    const nombre = document.getElementById('nombre-materia').value;
    const curso = document.getElementById('curso-materia').value;
    const regimen = document.getElementById('regimen-materia').value;

    if (!nombre || !curso || !regimen) {
        mostrarMensaje('Por favor complete todos los campos', 'warning');
        return;
    }

    try {
        const url = materiaId ? `/api/materias/${materiaId}` : '/api/materias';
        const method = materiaId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                carrera_id: parseInt(carreraId),
                nombre: nombre,
                curso: curso,
                regimen: regimen
            })
        });

        const result = await response.json();

        if (result.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalMateria'));
            modal.hide();
            mostrarMensaje(result.message, 'success');
            cargarMateriasCarrera();
        } else {
            mostrarMensaje(result.error, 'error');
        }
    } catch (error) {
        console.error('Error al guardar materia:', error);
        mostrarMensaje('Error al guardar la materia', 'error');
    }
}

async function editarMateria(id) {
    try {
        const response = await fetch(`/api/materias/${id}`);
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

function eliminarMateriaConfirm(id, nombre) {
    if (confirm(`¿Está seguro que desea eliminar la materia "${nombre}"?`)) {
        eliminarMateria(id);
    }
}

async function eliminarMateria(id) {
    try {
        const response = await fetch(`/api/materias/${id}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje(result.message, 'success');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalMateria'));
            if (modal) modal.hide();
            cargarMateriasCarrera();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al eliminar materia:', error);
        mostrarMensaje('Error al eliminar la materia', 'error');
    }
}

// =================================================
// GESTIÓN DE ESTUDIANTES - COMPLETO
// =================================================

async function cargarCarrerasParaSelect() {
    try {
        const response = await fetch('/api/carreras');
        const result = await response.json();
        
        const select = document.getElementById('carrera-estudiante');
        
        if (select) {
            select.innerHTML = '<option value="">Seleccione una carrera</option>' +
                result.data.map(carrera => 
                    `<option value="${carrera.id}">${carrera.nombre}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error al cargar carreras para select:', error);
    }
}

async function buscarEstudiante() {
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
        const response = await fetch(`/api/estudiantes/buscar/${dni}`);
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
                                        onclick="editarEstudiante('${estudiante.id}')">
                                    <i class="fas fa-edit me-1"></i>Modificar
                                </button>
                                <button class="btn btn-outline-danger btn-sm" 
                                        onclick="eliminarEstudianteConfirm('${estudiante.id}', '${estudiante.nombre} ${estudiante.apellido}')">
                                    <i class="fas fa-trash me-1"></i>Eliminar
                                </button>
                                <button class="btn btn-outline-info btn-sm" 
                                        onclick="cargarNotasEstudiante('${estudiante.id}', '${estudiante.nombre} ${estudiante.apellido}')">
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

function abrirModalEstudiante() {
    document.getElementById('form-estudiante').reset();
    document.getElementById('estudiante-id').value = '';
    document.getElementById('modalEstudianteTitulo').textContent = 'Agregar Nuevo Estudiante';
    document.getElementById('btn-eliminar-estudiante').style.display = 'none';
    
    cargarCarrerasParaSelect();
    
    const modal = new bootstrap.Modal(document.getElementById('modalEstudiante'));
    modal.show();
}

async function guardarEstudiante() {
    const estudianteId = document.getElementById('estudiante-id').value;
    const dni = document.getElementById('dni').value;
    const legajo = document.getElementById('legajo').value;
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const domicilio = document.getElementById('domicilio').value;
    const anioInicio = document.getElementById('anio-inicio').value;
    const carreraId = document.getElementById('carrera-estudiante').value;

    if (!dni || !legajo || !nombre || !apellido || !domicilio || !anioInicio || !carreraId) {
        mostrarMensaje('Por favor complete todos los campos', 'warning');
        return;
    }

    if (!validarDNI(dni)) {
        mostrarMensaje('El DNI debe contener 7 u 8 números', 'warning');
        return;
    }

    try {
        const url = estudianteId ? `/api/estudiantes/${estudianteId}` : '/api/estudiantes';
        const method = estudianteId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                dni: dni,
                legajo: legajo,
                nombre: nombre,
                apellido: apellido,
                domicilio: domicilio,
                anio_inicio: parseInt(anioInicio),
                carrera_id: parseInt(carreraId)
            })
        });

        const result = await response.json();

        if (result.success) {
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalEstudiante'));
            modal.hide();
            mostrarMensaje(result.message, 'success');
            
            // Limpiar búsqueda
            document.getElementById('resultado-busqueda').innerHTML = '';
            document.getElementById('buscar-dni').value = '';
        } else {
            mostrarMensaje(result.error, 'error');
        }
    } catch (error) {
        console.error('Error al guardar estudiante:', error);
        mostrarMensaje('Error al guardar el estudiante', 'error');
    }
}

async function editarEstudiante(id) {
    try {
        const response = await fetch(`/api/estudiantes/${id}`);
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
            await cargarCarrerasParaSelect();
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

function eliminarEstudianteConfirm(id, nombre) {
    if (confirm(`¿Está seguro que desea eliminar al estudiante "${nombre}"?`)) {
        eliminarEstudiante(id);
    }
}

async function eliminarEstudiante(id) {
    try {
        const response = await fetch(`/api/estudiantes/${id}`, {
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

// =================================================
// CARGAR NOTAS - COMPLETO
// =================================================

async function cargarNotasEstudiante(estudianteId, nombreEstudiante) {
    try {
        // Obtener datos del estudiante
        const response = await fetch(`/api/estudiantes/${estudianteId}`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error('Error al cargar datos del estudiante');
        }

        const estudiante = result.data;
        
        // Obtener materias de la carrera del estudiante
        const materiasResponse = await fetch(`/api/materias/carrera/${estudiante.carrera_id}`);
        const materiasResult = await materiasResponse.json();
        
        // Obtener notas existentes del estudiante
        const notasResponse = await fetch(`/api/estudiantes/${estudianteId}/notas`);
        const notasResult = await notasResponse.json();
        const notasExistentes = notasResult.success ? notasResult.data : [];

        // Configurar modal
        document.getElementById('nombre-estudiante-notas').textContent = nombreEstudiante;
        
        const contenedorNotas = document.getElementById('contenedor-notas');
        
        // Agrupar materias por curso
        const materiasPorCurso = materiasResult.data.reduce((acc, materia) => {
            const curso = materia.curso;
            if (!acc[curso]) {
                acc[curso] = [];
            }
            acc[curso].push(materia);
            return acc;
        }, {});
        
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

async function guardarTodasNotas() {
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
        const response = await fetch(`/api/estudiantes/${estudianteId}/notas`, {
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

// =================================================
// ANALÍTICOS - COMPLETO
// =================================================

async function cargarSolicitudesAnaliticos() {
    try {
        const response = await fetch('/api/analiticos/pendientes');
        const result = await response.json();

        const tablaSolicitudes = document.getElementById('tabla-solicitudes-analiticos');
        
        if (result.success) {
            const solicitudes = result.data;
            
            if (solicitudes.length === 0) {
                tablaSolicitudes.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted py-4">
                            <i class="fas fa-check-circle fa-2x mb-3"></i>
                            <p>No hay solicitudes pendientes</p>
                        </td>
                    </tr>
                `;
            } else {
                tablaSolicitudes.innerHTML = solicitudes.map(solicitud => `
                    <tr>
                        <td>${solicitud.estudiante_nombre} ${solicitud.estudiante_apellido}</td>
                        <td>${solicitud.estudiante_dni}</td>
                        <td>${solicitud.carrera_nombre}</td>
                        <td>${formatearFecha(solicitud.fecha_solicitud)}</td>
                        <td>
                            <span class="badge bg-warning">${solicitud.estado}</span>
                        </td>
                        <td>
                            <button class="btn btn-success btn-sm" onclick="aprobarAnalitico('${solicitud.id}')">
                                <i class="fas fa-check me-1"></i>Aprobar
                            </button>
                            <button class="btn btn-info btn-sm" onclick="verDetallesAnalitico('${solicitud.id}')">
                                <i class="fas fa-eye me-1"></i>Ver
                            </button>
                        </td>
                    </tr>
                `).join('');
            }
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
        mostrarMensaje('Error al cargar las solicitudes', 'error');
    }
}

async function aprobarAnalitico(analiticoId) {
    if (!confirm('¿Está seguro que desea aprobar este analítico?')) {
        return;
    }

    try {
        const response = await fetch(`/api/analiticos/${analiticoId}/aprobar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensaje('Analítico aprobado correctamente', 'success');
            cargarSolicitudesAnaliticos();
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al aprobar analítico:', error);
        mostrarMensaje('Error al aprobar el analítico', 'error');
    }
}

async function verDetallesAnalitico(analiticoId) {
    try {
        const response = await fetch(`/api/analiticos/${analiticoId}/detalles`);
        const result = await response.json();

        if (result.success) {
            const detalles = result.data;
            
            alert(`Detalles del Analítico:\n\n` +
                  `Estudiante: ${detalles.estudiante_nombre} ${detalles.estudiante_apellido}\n` +
                  `DNI: ${detalles.estudiante_dni}\n` +
                  `Carrera: ${detalles.carrera_nombre}\n` +
                  `Fecha Solicitud: ${formatearFecha(detalles.fecha_solicitud)}\n` +
                  `Estado: ${detalles.estado}`);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error al cargar detalles:', error);
        mostrarMensaje('Error al cargar los detalles', 'error');
    }
}

// =================================================
// FUNCIONES UTILITARIAS
// =================================================

async function cargarDatosInicio() {
    try {
        const response = await fetch('/api/carreras');
        const result = await response.json();
        
        if (result.success) {
            const listaCarreras = document.getElementById('lista-carreras');
            if (listaCarreras) {
                listaCarreras.innerHTML = result.data.map(carrera => `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100">
                            <div class="card-body">
                                <h5 class="card-title text-success">${carrera.nombre}</h5>
                                <p class="card-text">
                                    <small class="text-muted">Resolución: ${carrera.resolucion}</small><br>
                                    <small class="text-muted">${carrera.horas} horas</small>
                                </p>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error al cargar carreras para inicio:', error);
    }
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function validarDNI(dni) {
    return /^\d{7,8}$/.test(dni);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =================================================
// INICIALIZACIÓN CORREGIDA
// =================================================
// =================================================
// INICIALIZACIÓN CORREGIDA
// =================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Estudiantil IES N° 2 Humahuaca inicializado');
    
    // Mostrar sección inicio por defecto
    mostrarSeccion('inicio');
    
    // Configurar event listeners para ADMIN
    const formLoginAdmin = document.getElementById('form-login-admin');
    if (formLoginAdmin) {
        formLoginAdmin.addEventListener('submit', function(e) {
            e.preventDefault();
            loginAdmin();
        });
    }
    
    // Configurar event listeners para ESTUDIANTE - CORREGIDO
    const formLoginEstudiante = document.getElementById('form-login-estudiante');
    if (formLoginEstudiante) {
        formLoginEstudiante.addEventListener('submit', function(e) {
            e.preventDefault();
            loginEstudiante(e);
        });
    }
});
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Sistema Estudiantil IES N° 2 Humahuaca inicializado');
    
    // ... tu código existente ...
    
    // ✅ NUEVO: Configurar limpieza de formularios modales
    const modalRegistro = document.getElementById('modalRegistro');
    if (modalRegistro) {
        modalRegistro.addEventListener('hidden.bs.modal', function() {
            if (typeof limpiarFormularioRegistro === 'function') {
                limpiarFormularioRegistro();
            }
        });
    }
    
    const modalRecuperar = document.getElementById('modalRecuperar');
    if (modalRecuperar) {
        modalRecuperar.addEventListener('hidden.bs.modal', function() {
            // Limpiar y deshabilitar campos de recuperación
            const formRecuperar = document.getElementById('form-recuperar');
            if (formRecuperar) formRecuperar.reset();
            
            const nuevaPassword = document.getElementById('nueva-password');
            const confirmarPassword = document.getElementById('confirmar-nueva-password');
            if (nuevaPassword) nuevaPassword.disabled = true;
            if (confirmarPassword) confirmarPassword.disabled = true;
        });
    }
});
// Exportar todas las funciones globalmente
window.mostrarSeccion = mostrarSeccion;
window.mostrarSubseccion = mostrarSubseccion;
window.loginAdmin = loginAdmin;
window.cerrarSesionAdmin = cerrarSesionAdmin;
window.mostrarMensaje = mostrarMensaje;
window.abrirModalCarrera = abrirModalCarrera;
window.guardarCarrera = guardarCarrera;
window.eliminarCarrera = eliminarCarrera;
window.cargarMateriasCarrera = cargarMateriasCarrera;
window.abrirModalMateria = abrirModalMateria;
window.guardarMateria = guardarMateria;
window.eliminarMateria = eliminarMateria;
window.buscarEstudiante = buscarEstudiante;
window.abrirModalEstudiante = abrirModalEstudiante;
window.guardarEstudiante = guardarEstudiante;
window.eliminarEstudiante = eliminarEstudiante;
window.cargarNotasEstudiante = cargarNotasEstudiante;
window.guardarTodasNotas = guardarTodasNotas;
window.aprobarAnalitico = aprobarAnalitico;
window.verDetallesAnalitico = verDetallesAnalitico;
// =================================================
// FUNCIONES DE ESTUDIANTE AGREGADAS
// =================================================
window.mostrarSubseccion = mostrarSubseccion;
window.loginAdmin = loginAdmin;
window.cerrarSesionAdmin = cerrarSesionAdmin;
window.mostrarMensaje = mostrarMensaje;
// ... otras funciones existentes ...

// FUNCIONES DE ESTUDIANTE CORREGIDAS
window.mostrarLoginEstudiante = mostrarLoginEstudiante;
//window.loginEstudiante = loginEstudiante;
//window.registrarEstudiante = registrarEstudiante;
window.mostrarPanelEstudiante = mostrarPanelEstudiante;
window.cerrarSesionEstudiante = cerrarSesionEstudiante;
// Agrega esto en las exportaciones al final del archivo (línea ~800)
window.cargarMateriasEstudiante = cargarMateriasEstudiante;
window.solicitarNuevoAnalitico = solicitarNuevoAnalitico;
window.descargarAnaliticoPDF = descargarAnaliticoPDF;
window.cargarAnaliticosEstudiante = cargarAnaliticosEstudiante;