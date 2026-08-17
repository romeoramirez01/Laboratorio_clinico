const API_URL = `${window.location.origin}/api`;

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
      dui: document.getElementById('pacienteDui').value.trim(),
      nombres: document.getElementById('pacienteNombres').value.trim(),
      apellidos: document.getElementById('pacienteApellidos').value.trim(),
      fecha_nacimiento: document.getElementById('pacienteFechaNacimiento').value,
      telefono: document.getElementById('pacienteTelefono').value.trim(),
      email: document.getElementById('pacienteEmail').value.trim(),
      password: document.getElementById('pacientePassword').value,
      rol: 'paciente'
    };

    try {
      const response = await fetch(`${API_URL}/admin/registrar-paciente`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Error al cargar pacientes' }));
      throw new Error(data.error || 'Error al cargar pacientes');
    }

    const data = await response.json();
    const tbody = document.getElementById('tablaPacientes');

    if (data.length > 0) {
      tbody.innerHTML = data.map(paciente => {
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
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los pacientes',
      confirmButtonColor: '#e53e3e'
    });
  }
}

//Registrar examen
const registrarExamenForm = document.getElementById('registrarExamenForm');
if (registrarExamenForm) {
  registrarExamenForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const examenData = {
      nombre: document.getElementById('examenNombre').value.trim(),
      precio: parseFloat(document.getElementById('examenPrecio').value),
      tiempo_entrega: document.getElementById('examenTiempo').value.trim()
    };

    try {
      const response = await fetch(`${API_URL}/admin/registrar-examen`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Error al cargar exámenes' }));
      throw new Error(data.error || 'Error al cargar exámenes');
    }

    const data = await response.json();
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
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los exámenes',
      confirmButtonColor: '#e53e3e'
    });
  }
}

//Cargar lista de usuarios
async function cargarListaUsuarios() {
  try {
    const response = await fetch(`${API_URL}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: 'Error al cargar usuarios' }));
      throw new Error(data.error || 'Error al cargar usuarios');
    }

    const data = await response.json();
    const tbody = document.getElementById('tablaUsuarios');

    if (data.length > 0) {
      tbody.innerHTML = data.map(usuario => {
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
              <span class="rol-badge ${usuario.rol}">
                ${usuario.rol === 'admin' ? '👑 Administrador' : usuario.rol === 'doctor' ? '👨‍⚕️ Doctor' : '👤 Paciente'}
              </span>
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
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los usuarios',
      confirmButtonColor: '#e53e3e'
    });
  }
}

//Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
});

//Inicializar
cargarListaPacientes();
