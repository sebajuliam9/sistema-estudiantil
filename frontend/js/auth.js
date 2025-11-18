// ================================
// 🎓 auth.js - Frontend (manejo de login y registro) - VERSIÓN CORREGIDA
// ================================

const API_URL = 'http://localhost:3003/api/auth';

// ================================
// 🔍 Validar y Buscar Estudiante por DNI
// ================================
async function validarYBuscarEstudiante() {
    const dniInput = document.getElementById('dni-registro');
    const mensajeDiv = document.getElementById('mensaje-validacion');
    const dni = dniInput.value.trim();

    if (!dni || dni.length !== 8 || !/^\d+$/.test(dni)) {
        mostrarMensaje('⚠️ Ingrese un DNI válido de 8 dígitos numéricos', 'warning');
        return;
    }

    try {
        dniInput.disabled = true;
        mostrarMensaje('🔍 Buscando estudiante en el sistema...', 'info');

        console.log('🔍 Validando DNI en sistema:', dni);
        
        const response = await fetch(`${API_URL}/validar-estudiante`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni: dni })
        });

        const data = await response.json();

        if (response.ok && data.existe) {
            mostrarMensaje('✅ Estudiante encontrado. Complete los demás campos', 'success');
            habilitarCamposRegistro(true);
            
            if (data.estudiante && data.estudiante.nombre) {
                const usuarioSugerido = generarUsuarioSugerido(data.estudiante.nombre);
                document.getElementById('usuario-registro').value = usuarioSugerido;
            }
            
        } else {
            const mensajeError = data.error || 'Comuníquese con rectoría del IES N°2';
            mostrarMensaje('❌ ' + mensajeError, 'danger');
            habilitarCamposRegistro(false);
        }
        
    } catch (error) {
        console.error('❌ Error validando estudiante:', error);
        mostrarMensaje('❌ Error de conexión. Intente nuevamente', 'danger');
    } finally {
        dniInput.disabled = false;
    }
}

// ================================
// 🔔 Habilitar/Deshabilitar Campos de Registro
// ================================
function habilitarCamposRegistro(habilitar) {
    const usuarioInput = document.getElementById('usuario-registro');
    const passwordInput = document.getElementById('password-registro');
    const confirmPasswordInput = document.getElementById('confirmar-password');
    const btnRegistrar = document.getElementById('btn-registrar');
    
    if (usuarioInput) {
        usuarioInput.disabled = !habilitar;
        if (habilitar) usuarioInput.focus();
    }
    if (passwordInput) passwordInput.disabled = !habilitar;
    if (confirmPasswordInput) confirmPasswordInput.disabled = !habilitar;
    if (btnRegistrar) btnRegistrar.disabled = !habilitar;
}

// ================================
// 💬 Mostrar Mensajes de Estado
// ================================
function mostrarMensaje(mensaje, tipo) {
    const mensajeDiv = document.getElementById('mensaje-validacion');
    if (mensajeDiv) {
        mensajeDiv.textContent = mensaje;
        mensajeDiv.className = `alert alert-${tipo} mb-3`;
        mensajeDiv.classList.remove('d-none');
    }
}

// ================================
// 👤 Generar Usuario Sugerido
// ================================
function generarUsuarioSugerido(nombreCompleto) {
    return nombreCompleto
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '.')
        .replace(/[^a-z.]/g, '');
}

// ================================
// 📝 Registrar Estudiante
// ================================
async function registrarEstudiante() {
    const dni = document.getElementById('dni-registro')?.value.trim();
    const usuario = document.getElementById('usuario-registro')?.value.trim();
    const password = document.getElementById('password-registro')?.value;
    const confirmPassword = document.getElementById('confirmar-password')?.value;

    if (!dni || !usuario || !password || !confirmPassword) {
        alert('⚠️ Complete todos los campos');
        return;
    }

    if (password !== confirmPassword) {
        alert('⚠️ Las contraseñas no coinciden');
        return;
    }

    if (password.length < 6) {
        alert('⚠️ La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        console.log('📝 Registrando estudiante...');
        
        const response = await fetch(`${API_URL}/registro-estudiante`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dni: dni,
                usuario: usuario,
                password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Registro exitoso. Ya puede iniciar sesión');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRegistro'));
            modal.hide();
            limpiarFormularioRegistro();
        } else {
            throw new Error(data.error || 'Error en el registro');
        }
    } catch (error) {
        console.error('❌ Error en registro:', error);
        alert('❌ Error al registrarse: ' + error.message);
    }
}

// ================================
// 🧹 Limpiar Formulario de Registro
// ================================
function limpiarFormularioRegistro() {
    document.getElementById('form-registro').reset();
    document.getElementById('mensaje-validacion').classList.add('d-none');
    habilitarCamposRegistro(false);
}

// ================================
// 🔐 Login Estudiante - VERSIÓN CORREGIDA
// ================================
async function loginEstudiante(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  
  console.log('🔐 Intentando login de estudiante...');

  const usuario = document.getElementById('usuario-estudiante')?.value.trim();
  const password = document.getElementById('password-estudiante')?.value.trim();

  if (!usuario || !password) {
    alert('⚠️ Ingrese su usuario y contraseña');
    return;
  }

  const credenciales = { 
    usuario: usuario, 
    password: password 
  };
  
  console.log('📤 Enviando credenciales:', credenciales);
  console.log('📤 Enviando petición a:', `${API_URL}/login-estudiante`);

  try {
    const response = await fetch(`${API_URL}/login-estudiante`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credenciales),
    });

    console.log('📥 Status de respuesta:', response.status);
    console.log('📥 OK:', response.ok);
    
    const text = await response.text();
    console.log('📥 Respuesta recibida - Texto completo:', text);
    
    if (!text) {
      throw new Error('Respuesta vacía del servidor');
    }
    
    const data = JSON.parse(text);
    console.log('📥 Datos parseados:', data);

    if (!response.ok) {
      throw new Error(data.error || 'Error en el inicio de sesión');
    }

    console.log('✅ Login exitoso, datos recibidos:', data);
    
    // ✅✅✅ CÓDIGO CORREGIDO - PARTE MÁS IMPORTANTE ✅✅✅
    if (data.data && data.data.nombre) {
        // ✅ DEBUG: Ver estructura completa
        console.log('🔍 DEBUG - Respuesta COMPLETA del backend:', data);
        console.log('🔍 DEBUG - Estructura de data.data:', Object.keys(data.data));
        
        // ✅ CORREGIDO: Buscar token en diferentes ubicaciones posibles
        const tokenReal = data.data.token || data.token || data.data.data?.token;
        
        if (!tokenReal) {
            console.error('❌ El backend no devolvió token. Respuesta completa:', data);
            throw new Error('Error de autenticación: el servidor no devolvió un token válido');
        }
        
        console.log('✅ Token REAL encontrado:', tokenReal);
        localStorage.setItem('token', tokenReal);
        
        // ✅ Datos del estudiante
        const estudianteData = {
            id: data.data.id,
            estudiante_id: data.data.id,
            nombre: data.data.nombre,
            apellido: data.data.apellido,
            dni: data.data.dni,
            carrera_id: data.data.carrera_id,
            usuario: data.data.usuario,
            rol: data.data.rol || 'estudiante',
            legajo: data.data.legajo,
            carrera_nombre: data.data.carrera_nombre
        };
        
        console.log('💾 Datos del estudiante que se guardarán:', estudianteData);
        localStorage.setItem('estudiante', JSON.stringify(estudianteData));
        
        console.log('💾 Datos guardados en localStorage:', {
            token: localStorage.getItem('token'),
            estudiante: JSON.parse(localStorage.getItem('estudiante'))
        });
        
        alert(`👋 Bienvenido ${data.data.nombre}!`);
        
        // Ocultar formulario de login y mostrar panel
        const loginForm = document.getElementById('login-estudiante');
        const panelEstudiante = document.getElementById('panel-estudiante');
        
        if (loginForm) loginForm.style.display = 'none';
        if (panelEstudiante) panelEstudiante.style.display = 'block';
        
        // Actualizar AppState
        if (typeof AppState !== 'undefined') {
            AppState.studentLoggedIn = true;
            AppState.currentStudent = estudianteData;
            console.log('✅ AppState actualizado:', AppState.currentStudent);
        } else {
            console.warn('⚠️ AppState no está definido');
        }
        
        // Cargar información del estudiante
        setTimeout(() => {
            if (typeof cargarInfoEstudiante === 'function') {
                console.log('✅ Llamando a cargarInfoEstudiante');
                cargarInfoEstudiante();
            } else {
                console.warn('⚠️ cargarInfoEstudiante no está disponible');
            }
            
            if (typeof cargarAnaliticosEstudiante === 'function') {
                console.log('✅ Llamando a cargarAnaliticosEstudiante');
                cargarAnaliticosEstudiante();
            } else {
                console.warn('⚠️ cargarAnaliticosEstudiante no está disponible');
            }
            
            if (typeof mostrarSeccion === 'function') {
                console.log('✅ Llamando a mostrarSeccion');
                mostrarSeccion('analiticos');
            }
        }, 100);
        
    } else {
        throw new Error('Estructura de respuesta incorrecta');
    }
    
  } catch (error) {
    console.error('❌ Error completo en login estudiante:', error);
    alert('❌ Error al iniciar sesión: ' + error.message);
  }
}

// ================================
// 🔐 Login Administrativo - NUEVA FUNCIÓN AGREGADA
// ================================
async function loginAdministrativo(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }

    console.log('🔐 Intentando login administrativo...');

    const usuario = document.getElementById('usuario-admin')?.value.trim();
    const password = document.getElementById('password-admin')?.value.trim();

    if (!usuario || !password) {
        alert('⚠️ Ingrese usuario y contraseña administrativos');
        return;
    }

    try {
        // ✅ URL CORRECTA para login administrativo
        const response = await fetch(`http://localhost:3003/api/auth/login-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario: usuario,
                password: password
            })
        });

        console.log('📥 Status de respuesta admin:', response.status);

        const data = await response.json();
        console.log('📥 Datos recibidos admin:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Error en el inicio de sesión administrativo');
        }

        console.log('✅ Login administrativo exitoso:', data);

        // ✅ GUARDAR TOKEN CORRECTAMENTE
        if (data.data && data.data.token) {
            localStorage.setItem('adminToken', data.data.token);
            localStorage.setItem('adminData', JSON.stringify(data.data));
            
            console.log('💾 Token administrativo guardado:', data.data.token);
            
            alert(`👋 Bienvenido Administrador ${data.data.nombre || ''}!`);
            
            // Ocultar formulario y mostrar panel administrativo
            const loginAdmin = document.getElementById('login-admin');
            const panelAdmin = document.getElementById('panel-admin');
            
            if (loginAdmin) loginAdmin.style.display = 'none';
            if (panelAdmin) panelAdmin.style.display = 'block';
            
        } else {
            throw new Error('No se recibió token del servidor');
        }
        
    } catch (error) {
        console.error('❌ Error en login administrativo:', error);
        alert('❌ Error al iniciar sesión administrativa: ' + error.message);
    }
}

// ================================
// 🔓 RECUPERAR CONTRASEÑA
// ================================
async function buscarEstudiantePorDNI() {
    const dniInput = document.getElementById('dni-recuperar');
    const usuarioInput = document.getElementById('usuario-recuperar');
    const dni = dniInput.value.trim();

    if (!dni || dni.length !== 8) {
        alert('⚠️ Ingrese un DNI válido de 8 dígitos');
        return;
    }

    try {
        console.log('🔍 Buscando estudiante con DNI:', dni);
        dniInput.disabled = true;
        
        const response = await fetch(`${API_URL}/buscar-usuario-por-dni`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dni: dni })
        });

        const data = await response.json();

        if (response.ok) {
            usuarioInput.value = data.usuario;
            alert('✅ Estudiante encontrado. Complete su nueva contraseña');
            document.getElementById('nueva-password').disabled = false;
            document.getElementById('confirmar-nueva-password').disabled = false;
        } else {
            alert('❌ ' + (data.error || 'Estudiante no encontrado'));
            usuarioInput.value = '';
        }
        
    } catch (error) {
        console.error('❌ Error buscando estudiante:', error);
        alert('❌ Error de conexión. Intente nuevamente');
    } finally {
        dniInput.disabled = false;
    }
}

async function actualizarContraseña() {
    const dni = document.getElementById('dni-recuperar')?.value.trim();
    const usuario = document.getElementById('usuario-recuperar')?.value.trim();
    const nuevaPassword = document.getElementById('nueva-password')?.value;
    const confirmarPassword = document.getElementById('confirmar-nueva-password')?.value;

    if (!dni || !usuario) {
        alert('⚠️ Primero busque su estudiante por DNI');
        return;
    }

    if (!nuevaPassword || !confirmarPassword) {
        alert('⚠️ Complete ambas contraseñas');
        return;
    }

    if (nuevaPassword !== confirmarPassword) {
        alert('⚠️ Las contraseñas no coinciden');
        return;
    }

    if (nuevaPassword.length < 6) {
        alert('⚠️ La contraseña debe tener al menos 6 caracteres');
        return;
    }

    try {
        console.log('💾 Actualizando contraseña para:', usuario);
        
        const response = await fetch(`${API_URL}/actualizar-contraseña`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                dni: dni,
                nuevaPassword: nuevaPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ Contraseña actualizada exitosamente');
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRecuperar'));
            modal.hide();
            document.getElementById('form-recuperar').reset();
        } else {
            throw new Error(data.error || 'Error al actualizar contraseña');
        }
        
    } catch (error) {
        console.error('❌ Error actualizando contraseña:', error);
        alert('❌ Error: ' + error.message);
    }
}

// ================================
// 🔍 Obtener ID del estudiante logueado
// ================================
function obtenerEstudianteId() {
    try {
        const estudianteStr = localStorage.getItem('estudiante');
        if (!estudianteStr) {
            console.warn('⚠️ No hay datos de estudiante en localStorage');
            return null;
        }
        
        const estudiante = JSON.parse(estudianteStr);
        console.log('🔍 Buscando ID en estudiante:', estudiante);
        
        const idEncontrado = estudiante.id || estudiante.estudiante_id;
        
        console.log('🎯 ID encontrado:', idEncontrado);
        return idEncontrado;
    } catch (error) {
        console.error('❌ Error obteniendo estudiante_id:', error);
        return null;
    }
}

// ================================
// 👤 Obtener datos completos del estudiante
// ================================
function obtenerDatosEstudiante() {
    try {
        const estudianteStr = localStorage.getItem('estudiante');
        if (!estudianteStr) {
            console.warn('⚠️ No hay datos de estudiante en localStorage');
            return null;
        }
        
        const estudiante = JSON.parse(estudianteStr);
        console.log('👤 Datos completos del estudiante:', estudiante);
        return estudiante;
    } catch (error) {
        console.error('❌ Error obteniendo datos estudiante:', error);
        return null;
    }
}

// ================================
// 🚪 Cerrar sesión
// ================================
function cerrarSesion() {
  localStorage.removeItem('token');
  localStorage.removeItem('estudiante');
  alert('👋 Sesión cerrada');
  window.location.href = '/index.html';
}

// ================================
// 🚪 Cerrar sesión administrativa - NUEVA FUNCIÓN AGREGADA
// ================================
function cerrarSesionAdmin() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  alert('👋 Sesión administrativa cerrada');
  window.location.href = '/index.html';
}

// ================================
// 🔍 Verificar sesión activa
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

// ================================
// 🔍 Verificar sesión administrativa activa - NUEVA FUNCIÓN AGREGADA
// ================================
function verificarSesionAdmin() {
  const adminToken = localStorage.getItem('adminToken');
  const adminData = localStorage.getItem('adminData');

  if (adminToken && adminData) {
    console.log('🟢 Sesión administrativa activa para:', JSON.parse(adminData).nombre);
    return true;
  }

  console.log('🔴 No hay sesión administrativa activa');
  return false;
}

// ================================
// 🧪 Debug: Mostrar datos de sesión
// ================================
function debugSesion() {
    console.log('=== 🧪 DEBUG DE SESIÓN ===');
    console.log('Token:', localStorage.getItem('token'));
    console.log('Estudiante:', JSON.parse(localStorage.getItem('estudiante') || '{}'));
    console.log('Estudiante ID:', obtenerEstudianteId());
    console.log('Admin Token:', localStorage.getItem('adminToken'));
    console.log('Admin Data:', JSON.parse(localStorage.getItem('adminData') || '{}'));
    console.log('=== FIN DEBUG ===');
}

// ================================
// ⚙️ Exportar funciones globalmente
// ================================
window.validarYBuscarEstudiante = validarYBuscarEstudiante;
window.registrarEstudiante = registrarEstudiante;
window.loginEstudiante = loginEstudiante;
window.loginAdministrativo = loginAdministrativo; // ✅ NUEVA FUNCIÓN EXPORTADA
window.cerrarSesion = cerrarSesion;
window.cerrarSesionAdmin = cerrarSesionAdmin; // ✅ NUEVA FUNCIÓN EXPORTADA
window.verificarSesion = verificarSesion;
window.verificarSesionAdmin = verificarSesionAdmin; // ✅ NUEVA FUNCIÓN EXPORTADA
window.buscarEstudiantePorDNI = buscarEstudiantePorDNI;
window.actualizarContraseña = actualizarContraseña;
window.habilitarCamposRegistro = habilitarCamposRegistro;
window.limpiarFormularioRegistro = limpiarFormularioRegistro;
window.obtenerEstudianteId = obtenerEstudianteId;
window.obtenerDatosEstudiante = obtenerDatosEstudiante;
window.debugSesion = debugSesion;