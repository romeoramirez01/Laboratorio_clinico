const API_URL = `${window.location.origin}/api`;
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token || !usuario.id || usuario.rol !== 'paciente') {
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

async function cargarPerfil() {
  try {
    const data = await requestJson('/paciente/mi-perfil?id=' + usuario.id);
    const perfilNombre = document.getElementById('perfilNombre');
    const perfilEmail = document.getElementById('perfilEmail');

    if (perfilNombre) perfilNombre.textContent = `${data.nombres} ${data.apellidos}`;
    if (perfilEmail) perfilEmail.textContent = data.email;
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo cargar el perfil',
      confirmButtonColor: '#e53e3e'
    });
  }
}

async function cargarMisCitas() {
  try {
    const data = await requestJson(`/paciente/mis-citas?id=${usuario.id}`);
    const tbody = document.getElementById('tablaMisCitas');

    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(c => `
        <tr>
          <td>${c.id}</td>
          <td>${c.fecha}</td>
          <td>${c.hora}</td>
          <td>${c.motivo}</td>
          <td>${c.estado || 'pendiente'}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="5">No tienes citas</td></tr>';
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar tus citas',
      confirmButtonColor: '#e53e3e'
    });
  }
}

async function cargarMisExamenes() {
  try {
    const data = await requestJson(`/paciente/mis-examenes?id=${usuario.id}`);
    const tbody = document.getElementById('tablaMisExamenes');

    if (!tbody) return;

    if (data.length > 0) {
      tbody.innerHTML = data.map(e => `
        <tr>
          <td>${e.id}</td>
          <td>${e.nombre || 'Examen'}</td>
          <td>$${e.precio || 0}</td>
          <td>${e.tiempo_entrega || 'N/A'}</td>
        </tr>
      `).join('');
    } else {
      tbody.innerHTML = '<tr><td colspan="4">No tienes exámenes</td></tr>';
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudieron cargar tus exámenes',
      confirmButtonColor: '#e53e3e'
    });
  }
}

const formCita = document.getElementById('formCita');
if (formCita) {
  formCita.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      paciente_id: usuario.id,
      fecha: document.getElementById('citaFecha').value,
      hora: document.getElementById('citaHora').value,
      motivo: document.getElementById('citaMotivo').value
    };

    try {
      const response = await fetch(`${API_URL}/citas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({ message: 'Cita registrada' }));

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo registrar la cita');
      }

      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: data.message || 'Cita registrada',
        confirmButtonColor: '#667eea'
      });

      formCita.reset();
      cargarMisCitas();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo registrar la cita',
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

cargarPerfil();
cargarMisCitas();
cargarMisExamenes();