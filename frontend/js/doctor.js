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
  return requestJson('/pacientes');
}

async function cargarCitas() {
  return requestJson('/citas');
}

async function cargarExamenes() {
  return requestJson('/examenes');
}

async function registrarSignosVitales(signos) {
  return requestJson('/signos-vitales', {
    method: 'POST',
    body: JSON.stringify(signos)
  });
}

async function cargarAgenda() {
  return requestJson('/citas/agenda');
}