const API_URL = window.location.origin;

//Verificar autenticación
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
//Variable global para almacenar el ID de la solicitud actual
let solicitudActualId = null;

if (!token || usuario.rol !== 'doctor') {
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
        
        if (tabId === 'resultados') cargarSolicitudesPendientes();
        if (tabId === 'signos') cargarHistorialSignos();
    });
});

//Buscar paciente para signos vitales
document.getElementById('buscarPacienteSignos').addEventListener('click', async () => {
    const dui = document.getElementById('signosDui').value;
    if (!dui) {
        Swal.fire({
            icon: 'warning',
            title: 'DUI requerido',
            text: 'Por favor ingrese el DUI del paciente',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }

    Swal.fire({
        title: 'Buscando paciente...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/pacientes/buscar/${dui}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            Swal.close();
            document.getElementById('infoPacienteSignos').innerHTML = `
                <div class="paciente-info">
                    <p><strong>${data.nombres} ${data.apellidos}</strong></p>
                    <p>DUI: ${data.dui} | Tel: ${data.telefono}</p>
                </div>
            `;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Paciente no encontrado',
                text: 'No existe un paciente con ese DUI',
                confirmButtonColor: '#e53e3e'
            });
            document.getElementById('infoPacienteSignos').innerHTML = '';
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo buscar el paciente',
            confirmButtonColor: '#e53e3e'
        });
    }
});

//Registrar signos vitales
document.getElementById('registrarSignosForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dui = document.getElementById('signosDui').value;

    if (!dui) {
        Swal.fire({
            icon: 'warning',
            title: 'DUI requerido',
            text: 'Primero busque un paciente',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
    const signosData = {
        dui,
        presion_arterial: document.getElementById('presionArterial').value,
        frecuencia_cardiaca: parseInt(document.getElementById('frecuenciaCardiaca').value),
        temperatura: parseFloat(document.getElementById('temperatura').value),
        peso: parseFloat(document.getElementById('peso').value),
        altura: parseFloat(document.getElementById('altura').value),
        observaciones: document.getElementById('observaciones').value
    };

    //Validar campos obligatorios
    if (!signosData.presion_arterial && !signosData.frecuencia_cardiaca && !signosData.temperatura) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Debe ingresar al menos presión arterial, frecuencia cardíaca o temperatura',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
    
    Swal.fire({
        title: 'Registrando signos vitales...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/signos-vitales/registrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(signosData)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Registrado!',
                text: 'Signos vitales registrados exitosamente',
                confirmButtonColor: '#667eea'
            });
            document.getElementById('registrarSignosForm').reset();
            document.getElementById('infoPacienteSignos').innerHTML = '';
            cargarHistorialSignos();
        } else {
            const data = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al registrar signos vitales',
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

//Cargar historial de signos vitales 
async function cargarHistorialSignos() {
    const container = document.getElementById('historialSignos');


    try {
        const response = await fetch(`${API_URL}/signos-vitales/todos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            console.error('Error respuesta:', response.status);
            container.innerHTML = '<div class="info-error">Error al cargar los datos</div>';
            return;
        }
        
        const data = await response.json();
        
        if (data.length > 0) {
            container.innerHTML = '';
            let html = `
                <table class="tabla-signos">
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Presión Arterial</th>
                            <th>Frecuencia Cardíaca</th>
                            <th>Temperatura</th>
                            <th>Peso</th>
                            <th>Altura</th>
                            <th>Observaciones</th>
                            <th>Fecha</th>
                        </thead>
                    <tbody>
            `;
            data.forEach(signo => {
                html += `
                    <tr>
                        <td>${signo.paciente_nombre} ${signo.paciente_apellidos}</td>
                        <td>${signo.presion_arterial || '-'}</td>
                        <td>${signo.frecuencia_cardiaca || '-'}</td>
                        <td>${signo.temperatura || '-'} °C</td>
                        <td>${signo.peso || '-'} kg</td>
                        <td>${signo.altura || '-'} cm</td>
                        <td style="max-width: 200px; word-wrap: break-word;">${signo.observaciones || '-'}</td>
                        <td>${new Date(signo.fecha_registro).toLocaleString()}</td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="info-vacio">No hay registros de signos vitales</div>';
        }
    } catch (error) {
        console.error('Error en cargarHistorialSignos:', error);
        container.innerHTML = '<div class="info-error">Error de conexion</div>';
    }
}

//Buscar paciente para resultados
document.getElementById('buscarPacienteResultados').addEventListener('click', async () => {
    const dui = document.getElementById('resultadoDui').value;
    if (!dui) {
         Swal.fire({
            icon: 'warning',
            title: 'DUI requerido',
            text: 'Por favor ingrese el DUI del paciente',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }

     Swal.fire({
        title: 'Buscando paciente...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/pacientes/buscar/${dui}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            Swal.close();
            document.getElementById('infoPacienteResultados').innerHTML = `
                <div class="paciente-info">
                    <p><strong>${data.nombres} ${data.apellidos}</strong></p>
                    <p>DUI: ${data.dui} | Email: ${data.email}</p>
                </div>
            `;
            cargarCatalogoExamenes();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Paciente no encontrado',
                text: 'No existe un paciente con ese DUI',
                confirmButtonColor: '#e53e3e'
            });
            document.getElementById('infoPacienteResultados').innerHTML = '';
        }
    } catch (error) {
         Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo buscar el paciente',
            confirmButtonColor: '#e53e3e'
        });
    }
});

//Cargar examenes del paciente
async function cargarExamenesPaciente(pacienteId) {
    try {
        const response = await fetch(`${API_URL}/examenes/solicitudes-paciente/${pacienteId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const select = document.getElementById('examenSeleccionado');
        select.innerHTML = '<option value="">Seleccionar Examen</option>';
        data.forEach(solicitud => {
            select.innerHTML += `<option value="${solicitud.id}">${solicitud.examen_nombre} - Solicitado: ${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</option>`;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

//Cargar catalogo de examenes para seleccionar
async function cargarCatalogoExamenes() {
    try {
        const response = await fetch(`${API_URL}/examenes/catalogo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const select = document.getElementById('examenSeleccionado');
        if (data && data.length > 0) {
            select.innerHTML = '<option value="">Seleccionar Examen</option>';
            data.forEach(examen => {
                select.innerHTML += `<option value="${examen.id}">${examen.nombre}</option>`;
            });
            return true;
        } else {
            select.innerHTML = '<option value="">No hay exámenes disponibles</option>';
            return false;
        }
    } catch (error) {
        console.error('Error al cargar catálogo:', error);
        const select = document.getElementById('examenSeleccionado');
        select.innerHTML = '<option value="">Error al cargar exámenes</option>';
        return false;
    }
}

//Cargar solicitudes pendientes
async function cargarSolicitudesPendientes() {
    try {
        const response = await fetch(`${API_URL}/examenes/solicitudes-pendientes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const container = document.getElementById('solicitudesPendientes');
        
        if (response.ok && data.length > 0) {
            let html = `
                <table class="tabla-solicitudes">
                    <thead>
                        <tr>
                            <th>Paciente</th>
                            <th>Examen</th>
                            <th>Fecha Solicitud</th>
                            <th>Acción</th>
                        </thead>
                    <tbody>
            `;
            data.forEach(solicitud => {
                html += `
                    <tr>
                        <td>${solicitud.paciente_nombre} ${solicitud.paciente_apellidos || ''}</td>
                        <td>${solicitud.examen_nombre}</td>
                        <td>${new Date(solicitud.fecha_solicitud).toLocaleDateString()}</td>
                        <td class="table-action-cell">
                            <button onclick="procesarSolicitud(${solicitud.id})" class="btn-premium btn-procesar">
                                <i class="fas fa-play"></i> Procesar
                            </button>
                         \n
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="info-vacio">No hay solicitudes pendientes</div>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('solicitudesPendientes').innerHTML = '<div class="info-error">Error al cargar solicitudes</div>';
    }
}

// Procesar solicitud
//Ahora carga automáticamente los datos
window.procesarSolicitud = async (solicitudId) => {
    solicitudActualId = solicitudId;
    try {
        //Obtener los detalles de la solicitud
        const response = await fetch(`${API_URL}/examenes/solicitud/${solicitudId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const solicitud = await response.json();
        
        if (response.ok) {
            document.querySelector('.tab-btn[data-tab="resultados"]').click();

            //Primero, asegurar que el catálogo de exámenes esté cargado
            await cargarCatalogoExamenes();
            
            setTimeout(() => {
                //Llenar el DUI del paciente
                document.getElementById('resultadoDui').value = solicitud.paciente_dui;
                
                //Seleccionar el examen
                const selectExamen = document.getElementById('examenSeleccionado');
                selectExamen.value = solicitud.examen_id;
                
                //Mostrar información del paciente
                document.getElementById('infoPacienteResultados').innerHTML = `
                    <div class="paciente-info">
                        <p><strong>${solicitud.paciente_nombre} ${solicitud.paciente_apellidos}</strong></p>
                        <p>DUI: ${solicitud.paciente_dui} | Email: ${solicitud.paciente_email}</p>
                        <p>Examen solicitado: <strong>${solicitud.examen_nombre}</strong></p>
                    </div>
                `;

                //Verificar si se seleccionó correctamente
                if (selectExamen.value !== String(solicitud.examen_id)) {
                    console.log('Examen no encontrado en el catálogo, ID:', solicitud.examen_id);
                }
                
                //Mostrar mensaje de éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Datos cargados!',
                    text: `Paciente: ${solicitud.paciente_nombre}\nExamen: ${solicitud.examen_nombre}\n\nComplete el resultado y guarde.`,
                    confirmButtonColor: '#667eea'
                });
                
                //Enfocar el campo de resultado
                document.getElementById('resultadoTexto').focus();
            }, 500);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los datos de la solicitud',
                confirmButtonColor: '#e53e3e'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo procesar la solicitud',
            confirmButtonColor: '#e53e3e'
        });
    }
};

//Agregar resultado
document.getElementById('agregarResultadoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dui = document.getElementById('resultadoDui').value;
    const examenId = document.getElementById('examenSeleccionado').value;
    const resultado = document.getElementById('resultadoTexto').value;
    
    if (!examenId) {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione un examen',
            text: 'Por favor seleccione el examen que va a registrar',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
    if (!resultado) {
         Swal.fire({
            icon: 'warning',
            title: 'Resultado requerido',
            text: 'Debe escribir el resultado del examen',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }

    //Mostrar loading
    Swal.fire({
        title: 'Generando PDF...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        let url = `${API_URL}/examenes/subir-resultado-doctor`;
        let body = { dui, examen_id: examenId, resultado };
        
        //Si hay una solicitud pendiente, actualizarla
        if (solicitudActualId) {
            url = `${API_URL}/examenes/completar-solicitud/${solicitudActualId}`;
            body = { resultado, archivo_pdf: null };
        }
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Resultado guardado!',
                text: 'El PDF se ha generado y guardado exitosamente. El paciente ya puede descargarlo.',
                confirmButtonColor: '#667eea'
            });            
            document.getElementById('agregarResultadoForm').reset();
            document.getElementById('infoPacienteResultados').innerHTML = '';
            document.getElementById('resultadoTexto').value = '';
            solicitudActualId = null;
            cargarSolicitudesPendientes();

        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al generar el resultado',
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

//Buscar paciente para historial
document.getElementById('buscarPacienteHistorial').addEventListener('click', async () => {
    const dui = document.getElementById('historialDui').value;
    if (!dui) {
        Swal.fire({
            icon: 'warning',
            title: 'DUI requerido',
            text: 'Ingrese el DUI del paciente',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
     Swal.fire({
        title: 'Buscando paciente...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/pacientes/buscar/${dui}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            Swal.close();
            document.getElementById('infoPacienteHistorial').innerHTML = `
                <div class="paciente-info">
                    <p><strong>${data.nombres} ${data.apellidos}</strong></p>
                    <p>DUI: ${data.dui} | Tel: ${data.telefono}</p>
                </div>
            `;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Paciente no encontrado',
                text: 'No existe un paciente con ese DUI',
                confirmButtonColor: '#e53e3e'
            });
            document.getElementById('infoPacienteHistorial').innerHTML = '';
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo buscar el paciente',
            confirmButtonColor: '#e53e3e'
        });
    }
});

//Registrar historial clínico
document.getElementById('registrarHistorialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dui = document.getElementById('historialDui').value;

    if (!dui) {
        Swal.fire({
            icon: 'warning',
            title: 'DUI requerido',
            text: 'Primero busque un paciente',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }

    const enfermedad = document.getElementById('enfermedad').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const intensidad = document.getElementById('intensidad').value;
    
    if (!enfermedad || !fechaInicio || !intensidad) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor complete enfermedad, fecha de inicio e intensidad',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
    
    const historialData = {
        dui,
        enfermedad,
        fecha_inicio: fechaInicio,
        intensidad,
        factores_alivio: document.getElementById('factoresAlivio').value,
        factores_empeoran: document.getElementById('factoresEmpeoran').value
    };
    
    Swal.fire({
        title: 'Registrando historial...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(`${API_URL}/pacientes/registrar-historial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(historialData)
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Registrado!',
                text: 'Historial clínico registrado exitosamente',
                confirmButtonColor: '#667eea'
            });
            document.getElementById('registrarHistorialForm').reset();
            document.getElementById('infoPacienteHistorial').innerHTML = '';
        } else {
            const data = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al registrar historial',
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

//Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
});

//Inicializar
cargarSolicitudesPendientes();
cargarHistorialSignos();