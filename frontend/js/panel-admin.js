//frontend
const API_URL = 'https://api-laboratorio-clinico.onrender.com';

//Verificar autenticación
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
let reportesCargados = false;

if (!token || (usuario.rol !== 'admin' && usuario.rol !== 'administrador')) {
  window.location.href = 'login.html';
}

//Tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
    });
    document.getElementById(`tab-${tabId}`).classList.add('active');
    btn.classList.add('active');
    
    //Cargar datos según tab
    if (tabId === 'pacientes') cargarListaPacientes();
    if (tabId === 'examenes') cargarListaExamenes();
    if (tabId === 'usuarios') cargarListaUsuarios();
    if (tabId === 'reportes' && !reportesCargados) {
            inicializarGraficoVacio();
            reportesCargados = true;
    }

  });
});

//Registrar paciente
const registrarPacienteForm = document.getElementById('registrarPacienteForm');
if (registrarPacienteForm) {
    registrarPacienteForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const pacienteData = {
    dui: document.getElementById('pacienteDui').value,
    nombres: document.getElementById('pacienteNombres').value,
    apellidos: document.getElementById('pacienteApellidos').value,
    fecha_nacimiento: document.getElementById('pacienteFechaNacimiento').value,
    telefono: document.getElementById('pacienteTelefono').value,
    email: document.getElementById('pacienteEmail').value,
    password: document.getElementById('pacientePassword').value,
    rol: 'paciente'
  };
  
  try {
    const response = await fetch(`${API_URL}/admin/registrar-paciente`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(pacienteData)
    });

    
    if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Paciente registrado exitosamente',
                confirmButtonColor: '#667eea'
            });
            document.getElementById('registrarPacienteForm').reset();
            cargarListaPacientes();
        } else {
            const data = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al registrar paciente',
                confirmButtonColor: '#e53e3e'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonColor: '#e53e3e'
        });
    }
});
}

//Cargar lista de pacientes
async function cargarListaPacientes(busqueda = '') {
  try {
    let url = `${API_URL}/admin/pacientes`;
    if (busqueda) {
      url += `?busqueda=${encodeURIComponent(busqueda)}`;
    }
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (response.ok) {
      const tbody = document.getElementById('tablaPacientes');
      if (data.length > 0) {
        tbody.innerHTML = data.map(paciente => {
          // Formatear la fecha correctamente
          let fechaFormateada = 'No disponible';
          if (paciente.created_at) {
            const fecha = new Date(paciente.created_at);
            fechaFormateada = fecha.toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
          return `
            <tr>
              <td>${paciente.dui}</td>
              <td>${paciente.nombres}</td>
              <td>${paciente.apellidos}</td>
              <td>${paciente.email}</td>
              <td>${paciente.telefono}</td>
              <td>${fechaFormateada}</td>
              <td class="table-action-cell">
                <button onclick="editarPaciente(${paciente.id})" class="btn-premium btn-admin-edit">
                  <i class="fas fa-edit"></i> Editar
                </button>
                <button onclick="eliminarPaciente(${paciente.id})" class="btn-premium btn-admin-delete">
                  <i class="fas fa-trash-alt"></i> Eliminar
                </button>
              </td>
            </tr>
          `;
        }).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="7">No hay pacientes registrados</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


//Editar paciente
window.editarPaciente = async (id) => {
  console.log('Editar paciente llamado con ID:', id);
    console.log('Token actual:', token);
    try {
       console.log('Fetching:', `${API_URL}/admin/paciente/${id}`);
        //Obtener datos del paciente
        const response = await fetch(`${API_URL}/admin/paciente/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Response status:', response.status);
        const paciente = await response.json();
        console.log('Datos recibidos:', paciente);
        
        if (response.ok) {
            const { value: formValues } = await Swal.fire({
                title: 'Editar Paciente',
                html: `
                    <input id="swal-nombres" class="swal2-input" placeholder="Nombres" value="${paciente.nombres}">
                    <input id="swal-apellidos" class="swal2-input" placeholder="Apellidos" value="${paciente.apellidos}">
                    <input id="swal-telefono" class="swal2-input" placeholder="Teléfono" value="${paciente.telefono}">
                    <input id="swal-email" class="swal2-input" placeholder="Email" value="${paciente.email}">
                `,
                focusConfirm: false,
                confirmButtonText: 'Guardar Cambios',
                cancelButtonText: 'Cancelar',
                showCancelButton: true,
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#e53e3e',
                preConfirm: () => {
                    return {
                        nombres: document.getElementById('swal-nombres').value,
                        apellidos: document.getElementById('swal-apellidos').value,
                        telefono: document.getElementById('swal-telefono').value,
                        email: document.getElementById('swal-email').value
                    };
                }
            });
            
            if (formValues) {
                const updateResponse = await fetch(`${API_URL}/admin/paciente/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formValues)
                });
                
                if (updateResponse.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Actualizado!',
                        text: 'Paciente actualizado exitosamente',
                        confirmButtonColor: '#667eea'
                    });
                    cargarListaPacientes();
                } else {
                    const errorData = await updateResponse.json();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorData.error || 'Error al actualizar',
                        confirmButtonColor: '#e53e3e'
                    });
                }
            }
        }
    } catch (error) {
      console.error('Error en editarPaciente:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar los datos del paciente'+ error.message,
            confirmButtonColor: '#e53e3e'
        });
    }
};

//Eliminar paciente
window.eliminarPaciente = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#667eea'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/admin/pacientes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El paciente ha sido eliminado',
                    confirmButtonColor: '#667eea'
                });
                cargarListaPacientes();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el paciente',
                    confirmButtonColor: '#e53e3e'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión',
                confirmButtonColor: '#e53e3e'
            });
        }
    }
};


//Buscar paciente
  const btnBuscar = document.getElementById('btnBuscarPaciente');
if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
  const busqueda = document.getElementById('buscarPaciente').value;
  cargarListaPacientes(busqueda);
});
}

//Registrar examen
const registrarExamenForm = document.getElementById('registrarExamenForm');
if (registrarExamenForm) {
    registrarExamenForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const examenData = {
    nombre: document.getElementById('examenNombre').value,
    precio: parseFloat(document.getElementById('examenPrecio').value),
    tiempo_entrega: document.getElementById('examenTiempo').value
  };
  
  try {
    const response = await fetch(`${API_URL}/admin/examenes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(examenData)
    });
    


     if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: 'Examen agregado exitosamente',
                confirmButtonColor: '#667eea'
            });


      document.getElementById('registrarExamenForm').reset();
      cargarListaExamenes();
    } else {
      const data = await response.json();
      Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al agregar examen',
                confirmButtonColor: '#e53e3e'
            });

    }
  } catch (error) {
    Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonColor: '#e53e3e'
        });
  }
});
}


//Cargar lista de exámenes
async function cargarListaExamenes() {
  try {
    const response = await fetch(`${API_URL}/admin/examenes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    
    if (response.ok) {
      const tbody = document.getElementById('tablaExamenes');
      if (data.length > 0) {
        tbody.innerHTML = data.map(examen => `
          <tr>
            <td>${examen.id}</td>
            <td>${examen.nombre}</td>
            <td>$${examen.precio}</td>
            <td>${examen.tiempo_entrega}</td>
            <td class="table-action-cell">
                            <button onclick="editarExamen(${examen.id})" class="btn-premium btn-admin-edit">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button onclick="eliminarExamen(${examen.id})" class="btn-premium btn-admin-delete">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </td>
          </tr>
        `).join('');
      } else {
        tbody.innerHTML = '<tr><td colspan="5">No hay exámenes registrados</td></tr>';
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}


//Editar examen
window.editarExamen = async (id) => {
    try {
        //Obtener datos del examen
        const response = await fetch(`${API_URL}/admin/examenes/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const examen = await response.json();
        
        if (response.ok) {
            const { value: formValues } = await Swal.fire({
                title: 'Editar Examen',
                html: `
                    <input id="swal-nombre" class="swal2-input" placeholder="Nombre del examen" value="${examen.nombre}">
                    <input id="swal-precio" class="swal2-input" placeholder="Precio" value="${examen.precio}">
                    <input id="swal-tiempo" class="swal2-input" placeholder="Tiempo de entrega" value="${examen.tiempo_entrega}">
                `,
                focusConfirm: false,
                confirmButtonText: 'Guardar Cambios',
                cancelButtonText: 'Cancelar',
                showCancelButton: true,
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#e53e3e',
                preConfirm: () => {
                    return {
                        nombre: document.getElementById('swal-nombre').value,
                        precio: parseFloat(document.getElementById('swal-precio').value),
                        tiempo_entrega: document.getElementById('swal-tiempo').value
                    };
                }
            });
            
            if (formValues) {
                const updateResponse = await fetch(`${API_URL}/admin/examenes/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formValues)
                });
                
                if (updateResponse.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Actualizado!',
                        text: 'Examen actualizado exitosamente',
                        confirmButtonColor: '#667eea'
                    });
                    cargarListaExamenes();
                } else {
                    const errorData = await updateResponse.json();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorData.error || 'Error al actualizar',
                        confirmButtonColor: '#e53e3e'
                    });
                }
            }
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar los datos del examen',
            confirmButtonColor: '#e53e3e'
        });
    }
};

//Eliminar examen
window.eliminarExamen = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#667eea'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/admin/examenes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El examen ha sido eliminado',
                    confirmButtonColor: '#667eea'
                });
                cargarListaExamenes();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el examen',
                    confirmButtonColor: '#e53e3e'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión',
                confirmButtonColor: '#e53e3e'
            });
        }
    }
};


//Cargar lista de usuarios
async function cargarListaUsuarios() {
    try {
        const response = await fetch(`${API_URL}/admin/usuarios`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            const tbody = document.getElementById('tablaUsuarios');
            if (data.length > 0) {
                tbody.innerHTML = data.map(usuario => {
                    // Formatear la fecha correctamente
                    let fechaFormateada = 'No disponible';
                    if (usuario.created_at) {
                        const fecha = new Date(usuario.created_at);
                        fechaFormateada = fecha.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                    return `
                        <tr>
                            <td>${usuario.id}</td>
                            <td>${usuario.nombres} ${usuario.apellidos}</td>
                            <td>${usuario.email}</td>
                            <td>
                                <span class="rol-badge ${usuario.rol}">${usuario.rol === 'admin' ? '👑 Administrador' : usuario.rol === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Paciente'}</span>
                            </td>
                            <td>${fechaFormateada}</td>
                            <td class="table-action-cell">
                                <button onclick="editarUsuario(${usuario.id})" class="btn-premium btn-admin-edit">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button onclick="eliminarUsuario(${usuario.id})" class="btn-premium btn-admin-delete">
                                    <i class="fas fa-trash-alt"></i> Eliminar
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } else {
                tbody.innerHTML = '<tr><td colspan="6">No hay usuarios registrados</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}


//Editar usuario
window.editarUsuario = async (id) => {
  console.log('=== EDITAR USUARIO ===');
    console.log('ID recibido:', id);
    console.log('Token:', token);

    try {
        //Obtener datos del usuario
        const response = await fetch(`${API_URL}/admin/usuarios/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Response status:', response.status);

        const usuarioData = await response.json();
        console.log('Datos recibidos:', usuarioData);
        
        if (response.ok) {
            const { value: formValues } = await Swal.fire({
                title: 'Editar Usuario',
                html: `
                    <input id="swal-nombres" class="swal2-input" placeholder="Nombres" value="${usuarioData.nombres}">
                    <input id="swal-apellidos" class="swal2-input" placeholder="Apellidos" value="${usuarioData.apellidos}">
                    <input id="swal-telefono" class="swal2-input" placeholder="Teléfono" value="${usuarioData.telefono}">
                    <input id="swal-email" class="swal2-input" placeholder="Email" value="${usuarioData.email}">
                    <select id="swal-rol" class="swal2-select">
                        <option value="paciente" ${usuarioData.rol === 'paciente' ? 'selected' : ''}>👤 Paciente</option>
                        <option value="doctor" ${usuarioData.rol === 'doctor' ? 'selected' : ''}>👨‍⚕️ Doctor</option>
                        <option value="admin" ${usuarioData.rol === 'admin' ? 'selected' : ''}>👑 Administrador</option>
                    </select>
                `,
                focusConfirm: false,
                confirmButtonText: 'Guardar Cambios',
                cancelButtonText: 'Cancelar',
                showCancelButton: true,
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#e53e3e',
                preConfirm: () => {
                    return {
                        nombres: document.getElementById('swal-nombres').value,
                        apellidos: document.getElementById('swal-apellidos').value,
                        telefono: document.getElementById('swal-telefono').value,
                        email: document.getElementById('swal-email').value,
                        rol: document.getElementById('swal-rol').value
                    };
                }
            });
            
            if (formValues) {
                const updateResponse = await fetch(`${API_URL}/admin/usuarios/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formValues)
                });
                
                if (updateResponse.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Actualizado!',
                        text: 'Usuario actualizado exitosamente',
                        confirmButtonColor: '#667eea'
                    });
                    cargarListaUsuarios();
                } else {
                    const errorData = await updateResponse.json();
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorData.error || 'Error al actualizar',
                        confirmButtonColor: '#e53e3e'
                    });
                }
            }
        }
    } catch (error) {
      console.error('Error en fetch:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar los datos del usuario: ' + error.message,
            confirmButtonColor: '#e53e3e'
        });
    }
};

//Eliminar usuario
window.eliminarUsuario = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#667eea'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/admin/usuarios/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Eliminado!',
                    text: 'El usuario ha sido eliminado',
                    confirmButtonColor: '#667eea'
                });
                cargarListaUsuarios();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el usuario',
                    confirmButtonColor: '#e53e3e'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error de conexión',
                confirmButtonColor: '#e53e3e'
            });
        }
    }
};

//Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
});


//ULTIMAS MODIFICACIONES
// REPORTES Y GRÁFICOS
let chartExamenes = null; 

// Obtener fechas según el tipo de reporte seleccionado
function obtenerFechasReporte() {
    const tipo = document.getElementById('tipoReporte').value;
    let fechaInicio, fechaFin;
    const hoy = new Date();

    // Función auxiliar para obtener fecha LOCAL en formato YYYY-MM-DD
    const toLocalDate = (date) => {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    if (tipo === 'diario') {
        fechaInicio = toLocalDate(hoy);
        fechaFin = fechaInicio;
    } else if (tipo === 'semanal') {
        // Calcular el lunes de la semana actual 
        const diaSemana = hoy.getDay(); 
        const diff = (diaSemana === 0 ? 6 : diaSemana - 1);
        const inicioSemana = new Date(hoy);
        inicioSemana.setDate(hoy.getDate() - diff);
        fechaInicio = toLocalDate(inicioSemana);
        fechaFin = toLocalDate(hoy);
    } else if (tipo === 'mensual') {
        const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fechaInicio = toLocalDate(primerDia);
        fechaFin = toLocalDate(hoy);
    } else if (tipo === 'personalizado') {
        fechaInicio = document.getElementById('fechaInicio').value;
        fechaFin = document.getElementById('fechaFin').value;
        if (!fechaInicio || !fechaFin) {
            Swal.fire('Advertencia', 'Selecciona ambas fechas para el rango personalizado', 'warning');
            return null;
        }
    }
    return { fechaInicio, fechaFin };
}

// Mostrar/ocultar el campo de rango personalizado
document.getElementById('tipoReporte').addEventListener('change', function() {
    const grupoFecha = document.getElementById('fechaPersonalizada');
    if (this.value === 'personalizado') {
        grupoFecha.style.display = 'flex';
    } else {
        grupoFecha.style.display = 'none';
    }
});

// Función principal para cargar reportes y actualizar gráfico
async function cargarReportes() {
    const fechas = obtenerFechasReporte();
    if (!fechas) return;

    const { fechaInicio, fechaFin } = fechas;

    

    try {
        // 1. Obtener resumen (exámenes diarios y pacientes atendidos)
        const urlResumen = `${API_URL}/admin/reportes/resumen?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
        const resResumen = await fetch(urlResumen, { headers: { 'Authorization': `Bearer ${token}` } });
        const dataResumen = await resResumen.json();
        if (resResumen.ok) {
            document.getElementById('examenesDiarios').innerText = dataResumen.examenes_diarios || 0;
            document.getElementById('pacientesAtendidos').innerText = dataResumen.pacientes_atendidos || 0;
        } else {
            console.error(dataResumen.error);
        }

        // 2. Obtener top exámenes
        const urlTop = `${API_URL}/admin/reportes/top-examenes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}&limite=5`;
        const resTop = await fetch(urlTop, { headers: { 'Authorization': `Bearer ${token}` } });
        const dataTop = await resTop.json();
        const topExamenes = resTop.ok ? dataTop : [];

        // Actualizar la lista HTML
        const topLista = document.getElementById('topExamenesLista');
        if (topExamenes.length === 0) {
            topLista.innerHTML = '<p>No hay datos en este período</p>';
        } else {
            let html = '<ol style="list-style: none; padding: 0;">';
topExamenes.forEach((item, idx) => {
    html += `
        <li style="display: flex; justify-content: space-between; align-items: center;">
            <span>${idx+1}. ${item.examen}</span>
            <strong>${item.total} solicitudes</strong>
        </li>
    `;
});
html += '</ol>';
            topLista.innerHTML = html;
        }

        // Actualizar gráfico de barras
        actualizarGrafico(topExamenes);

        Swal.close();
    } catch (error) {
        console.error(error);
        Swal.fire('Error', 'No se pudieron cargar los reportes', 'error');
    }
}

// Función para actualizar el gráfico de barras con estilo profesional
function actualizarGrafico(datos) {
    const ctx = document.getElementById('chartExamenes').getContext('2d');
    const etiquetas = datos.map(item => item.examen);
    const valores = datos.map(item => item.total);

    // Destruir gráfico anterior si existe
    if (chartExamenes) {
        chartExamenes.destroy();
    }

    // Configuración del gradiente para las barras
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    chartExamenes = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: etiquetas,
            datasets: [{
                label: 'Solicitudes',
                data: valores,
                backgroundColor: gradient,
                borderColor: '#4c51bf',
                borderWidth: 1,
                borderRadius: 8, 
                barPercentage: 0.6,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { size: 12 },
                        color: '#2d3748'
                    }
                },
                tooltip: {
                    backgroundColor: '#1a202c',
                    titleColor: '#ffffff',
                    bodyColor: '#e2e8f0',
                    callbacks: {
                        label: function(context) {
                            return ` Solicitudes: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1,
                    
                    grid: {
                        color: '#e2e8f0',
                        drawBorder: true
                    },
                    ticks: {
                        precision: 0,
                        color: '#2d3748'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Exámenes',
                        font: { weight: 'bold', size: 12 },
                        color: '#4a5568'
                    },
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#2d3748',
                        font: { size: 11 },
                        rotation: 0,
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 0
                    }
                }
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 20,
                    bottom: 10
                }
            }
        }
    });
}
// Evento del botón Actualizar
document.getElementById('btnActualizarReportes').addEventListener('click', () => {
    cargarReportes();
});

// Cargar reportes 
window.cargarReportes = cargarReportes; 

function inicializarGraficoVacio() {
    const ctx = document.getElementById('chartExamenes').getContext('2d');
    if (chartExamenes) {
        chartExamenes.destroy();
    }
    chartExamenes = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [],  
            datasets: [{
                label: 'Solicitudes',
                data: [],
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: '#4c51bf',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Número de solicitudes' }
                },
                x: {
                    title: { display: true, text: 'Exámenes' }
                }
            }
        }
    });
}


//Inicializar
cargarListaPacientes();
