const API_URL = `${window.location.origin}/api`;
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
let reportesCargados = false;

if (!token || (usuario.rol !== 'admin' && usuario.rol !== 'administrador')) {
  window.location.href = 'login.html';
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.dataset.tab;
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

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

      const data = await response.json().catch(() => ({ error: 'Error al registrar paciente' }));

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar paciente');
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Paciente registrado exitosamente',
        confirmButtonColor: '#667eea'
      });

      registrarPacienteForm.reset();
      cargarListaPacientes();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: error.message || 'No se pudo conectar con el servidor',
        confirmButtonColor: '#e53e3e'
      });
    }
  });
}

async function cargarListaPacientes(busqueda = '') {
  try {
    let url = `${API_URL}/admin/pacientes`;
    if (busqueda) url += `?busqueda=${encodeURIComponent(busqueda)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar pacientes');
    }

    const tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(paciente => `
        <tr>
          <td>${paciente.dui}</td>
          <td>${paciente.nombres}</td>
          <td>${paciente.apellidos}</td>
          <td>${paciente.email}</td>
          <td>${paciente.telefono}</td>
          <td>${paciente.created_at ? new Date(paciente.created_at).toLocaleDateString('es-ES') : 'No disponible'}</td>
          <td class="table-action-cell">
            <button onclick="editarPaciente(${paciente.id})" class="btn-premium btn-admin-edit">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button onclick="eliminarPaciente(${paciente.id})" class="btn-premium btn-admin-delete">
              <i class="fas fa-trash-alt"></i> Eliminar
            </button>
          </td>
        </tr>
      `).join('');
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

      const data = await response.json().catch(() => ({ error: 'Error al registrar examen' }));

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar examen');
      }

      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Examen agregado exitosamente',
        confirmButtonColor: '#667eea'
      });

      registrarExamenForm.reset();
      cargarListaExamenes();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error de conexión',
        text: error.message || 'No se pudo conectar con el servidor',
        confirmButtonColor: '#e53e3e'
      });
    }
  });
}

async function cargarListaExamenes() {
  try {
    const response = await fetch(`${API_URL}/admin/examenes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar exámenes');
    }

    const tbody = document.getElementById('tablaExamenes');
    if (!tbody) return;

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

async function cargarListaUsuarios() {
  try {
    const response = await fetch(`${API_URL}/admin/usuarios`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await response.json().catch(() => []);

    if (!response.ok) {
      throw new Error(data.error || 'Error al cargar usuarios');
    }

    const tbody = document.getElementById('tablaUsuarios');
    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(usuarioItem => `
        <tr>
          <td>${usuarioItem.id}</td>
          <td>${usuarioItem.nombres} ${usuarioItem.apellidos}</td>
          <td>${usuarioItem.email}</td>
          <td>${usuarioItem.rol}</td>
          <td>${usuarioItem.created_at ? new Date(usuarioItem.created_at).toLocaleDateString('es-ES') : 'No disponible'}</td>
          <td class="table-action-cell">
            <button onclick="editarUsuario(${usuarioItem.id})" class="btn-premium btn-admin-edit">
              <i class="fas fa-edit"></i> Editar
            </button>
            <button onclick="eliminarUsuario(${usuarioItem.id})" class="btn-premium btn-admin-delete">
              <i class="fas fa-trash-alt"></i> Eliminar
            </button>
          </td>
        </tr>
      `).join('');
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

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('usuario');
  window.location.href = 'login.html';
});

cargarListaPacientes();
