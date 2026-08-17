const API_URL = `${window.location.origin}/api`;
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token || usuario.rol !== 'doctor') {
  window.location.href = 'login.html';
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: 'Respuesta no válida del servidor' };
  }

  if (!response.ok) {
    throw new Error(data.error || 'Error del servidor');
  }

  return data;
}

async function cargarPacientes() {
  try {
    const data = await requestJson('/pacientes');
    const tbody = document.getElementById('tablaPacientes');
    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(p => `
        <tr>
          <td>${p.id}</td>
          <td>${p.nombres}</td>
          <td>${p.apellidos}</td>
          <td>${p.email}</td>
          <td>${p.telefono}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5">No hay pacientes</td></tr>';
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los pacientes',
      confirmButtonColor: '#e53e3e'
    });
  }
}

async function cargarCitas() {
  try {
    const data = await requestJson('/citas');
    const tbody = document.getElementById('tablaCitas');
    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.nombres || ''} ${c.apellidos || ''}</td>
          <td>${c.fecha}</td>
          <td>${c.hora}</td>
          <td>${c.estado || 'pendiente'}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5">No hay citas</td></tr>';
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar las citas',
      confirmButtonColor: '#e53e3e'
    });
  }
}

async function cargarExamenes() {
  try {
    const data = await requestJson('/examenes');
    const tbody = document.getElementById('tablaExamenes');
    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(e => `
        <tr>
          <td>${e.id}</td>
          <td>${e.nombre}</td>
          <td>$${e.precio}</td>
          <td>${e.tiempo_entrega}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4">No hay exámenes</td></tr>';
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar los exámenes',
      confirmButtonColor: '#e53e3e'
    });
  }
}

const signosForm = document.getElementById('formSignosVitales');
if (signosForm) {
  signosForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      paciente_id: document.getElementById('signosPacienteId').value,
      presion_arterial: document.getElementById('presionArterial').value,
      frecuencia_cardiaca: document.getElementById('frecuenciaCardiaca').value,
      temperatura: document.getElementById('temperatura').value,
      peso: document.getElementById('peso').value,
      altura: document.getElementById('altura').value,
      observaciones: document.getElementById('observaciones').value
    };

    try {
      const data = await requestJson('/signos-vitales', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: data.message || 'Signos vitales guardados',
        confirmButtonColor: '#667eea'
      });

      signosForm.reset();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo guardar',
        confirmButtonColor: '#e53e3e'
      });
    }
  });
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
  });
}

cargarPacientes();
cargarCitas();
cargarExamenes();