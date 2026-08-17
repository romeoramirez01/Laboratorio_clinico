const API_BASE = `${window.location.origin}/api`;

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
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
  return requestJson('/admin/pacientes');
}

async function registrarPaciente(paciente) {
  return requestJson('/admin/registrar-paciente', {
    method: 'POST',
    body: JSON.stringify(paciente)
  });
}

async function cargarDoctores() {
  return requestJson('/admin/doctores');
}

async function cargarExamenes() {
  return requestJson('/admin/examenes');
}

async function registrarExamen(examen) {
  return requestJson('/admin/registrar-examen', {
    method: 'POST',
    body: JSON.stringify(examen)
  });
}

async function cargarReportes() {
  return requestJson('/admin/reportes');
}