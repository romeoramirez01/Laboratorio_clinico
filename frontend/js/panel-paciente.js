
const API_URL = window.location.origin;

//Verificar autenticación
const token = localStorage.getItem('token');
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

if (!token || usuario.rol !== 'paciente') {
    window.location.href = 'login.html';
}

//Cargar datos del paciente
async function cargarDatosPaciente() {
    try {
        const response = await fetch(`${API_URL}/pacientes/mi-perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok) {
            document.getElementById('infoPersonal').innerHTML = `
                <p><strong>Nombre:</strong> ${data.nombres} ${data.apellidos}</p>
                <p><strong>DUI:</strong> ${data.dui}</p>
                <p><strong>Teléfono:</strong> ${data.telefono}</p>
                <p><strong>Correo:</strong> ${data.email}</p>
                <p><strong>Fecha Nacimiento:</strong> ${new Date(data.fecha_nacimiento).toLocaleDateString()}</p>
            `;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//Cargar signos vitales
async function cargarSignosVitales() {
    try {
        const response = await fetch(`${API_URL}/signos-vitales/mis-signos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            const ultimo = data[0];
            document.getElementById('signosVitales').innerHTML = `
                <p><strong>Presión Arterial:</strong> ${ultimo.presion_arterial || 'No registrado'}</p>
                <p><strong>Frecuencia Cardíaca:</strong> ${ultimo.frecuencia_cardiaca || 'No registrado'} lpm</p>
                <p><strong>Temperatura:</strong> ${ultimo.temperatura || 'No registrado'} °C</p>
                <p><strong>Peso:</strong> ${ultimo.peso || 'No registrado'} kg</p>
                <p><strong>Altura:</strong> ${ultimo.altura || 'No registrado'} cm</p>
                <p><strong>Observaciones:</strong> ${ultimo.observaciones || 'No hay observaciones'}</p>
                <p><strong>Fecha:</strong> ${new Date(ultimo.fecha_registro).toLocaleString()}</p>
            `;
        } else {
            document.getElementById('signosVitales').innerHTML = '<p>No hay registros de signos vitales</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//Agendar cita
document.getElementById('agendarCitaForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fecha = document.getElementById('fechaCita').value;
    const hora = document.getElementById('horaCita').value;
    let motivo = document.getElementById('motivoCitaSelect').value;

    if (motivo === 'Otro') {
        motivo = document.getElementById('otroMotivo').value;
        if (!motivo) {
            Swal.fire({
                icon: 'warning',
                title: 'Motivo requerido',
                text: 'Por favor especifique el motivo de su cita',
                confirmButtonColor: '#e53e3e'
            });
            return;
        }
    }
    
    if (!fecha || !hora) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor complete todos los campos',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
    
    Swal.fire({
        title: 'Agendando cita...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(`${API_URL}/citas/agendar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ fecha, hora, motivo })
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Cita agendada!',
                text: 'Su cita ha sido registrada exitosamente',
                confirmButtonColor: '#667eea'
            });
            document.getElementById('agendarCitaForm').reset();
            document.getElementById('otroMotivoGroup').style.display = 'none';
            cargarMisCitas();
        } else {
            const data = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al agendar cita',
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

//Cargar mis citas
async function cargarMisCitas() {
    try {
        const response = await fetch(`${API_URL}/citas/mis-citas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            document.getElementById('misCitas').innerHTML = `
                <table class="tabla-citas">
                    <thead>
                        <tr><th>Fecha</th><th>Hora</th><th>Motivo</th><th>Estado</th><th>Acción</th>
                    </thead>
                    <tbody>
                        ${data.map(cita => `
                            <tr>
                                <td>${new Date(cita.fecha).toLocaleDateString()} \n
                                <td>${cita.hora} \n
                                <td>${cita.motivo} \n
                                <td>${cita.estado} \n
                                <td class="table-action-cell">
                                <button onclick="eliminarCita(${cita.id})" class="btn-premium btn-del btn-eliminar">
                                  <i class="fas fa-trash-alt"></i> Eliminar
                                </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            document.getElementById('misCitas').innerHTML = '<p>No tienes citas agendadas</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//Eliminar cita
window.eliminarCita = async (id) => {
    const result = await Swal.fire({
        title: '¿Cancelar cita?',
        text: '¿Estás seguro de que deseas eliminar esta cita? Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#667eea'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/citas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Cita eliminada!',
                    text: 'La cita ha sido cancelada exitosamente.',
                    confirmButtonColor: '#667eea'
                });
                cargarMisCitas();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar la cita',
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
    }
};

//Mostrar campo "Otro motivo"
document.getElementById('motivoCitaSelect').addEventListener('change', function() {
    const otroGroup = document.getElementById('otroMotivoGroup');
    if (this.value === 'Otro') {
        otroGroup.style.display = 'block';
        document.getElementById('otroMotivo').required = true;
    } else {
        otroGroup.style.display = 'none';
        document.getElementById('otroMotivo').required = false;
    }
});

//Establecer fecha minima
const fechaInput = document.getElementById('fechaCita');
const hoy = new Date().toISOString().split('T')[0];
fechaInput.setAttribute('min', hoy);

//Limpiar formulario
document.querySelector('.btn-limpiar').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('agendarCitaForm').reset();
    document.getElementById('otroMotivoGroup').style.display = 'none';
});

//Cargar catalogo de examenes
async function cargarCatalogoExamenes() {
    try {
        const response = await fetch(`${API_URL}/examenes/catalogo`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const container = document.getElementById('catalogoExamenes');
        
        if (response.ok && data.length > 0) {
            let html = `
                <table class="tabla-catalogo">
                    <thead>
                        <tr>
                            <th>Examen</th>
                            <th>Precio</th>
                            <th>Tiempo Entrega</th>
                            <th>Acción</th>
                        </thead>
                    <tbody>
            `;
            data.forEach(examen => {
                const nombreEscapado = examen.nombre.replace(/'/g, "\\'");
                html += `
                    <tr>
                        <td>${examen.nombre} \n
                        <td>$${examen.precio} \n
                        <td>${examen.tiempo_entrega} \n
                        <td class="table-action-cell">
                        <button onclick="solicitarExamen(${examen.id}, '${nombreEscapado}')" class="btn-premium btn-req btn-solicitar">
                          <i class="fas fa-hand-holding-medical"></i> Solicitar
                        </button>
                        </td>
                    </tr>
                `;
            });
            html += `</tbody></table>`;
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p>No hay exámenes disponibles</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('catalogoExamenes').innerHTML = '<p>Error al cargar catálogo</p>';
    }
}

//Solicitar examen
window.solicitarExamen = async (examenId, examenNombre) => {
    const result = await Swal.fire({
        title: '¿Solicitar examen?',
        text: `¿Estás seguro de que deseas solicitar el examen "${examenNombre}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, solicitar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#e53e3e'
    });
    
    if (result.isConfirmed) {
        Swal.fire({
            title: 'Procesando solicitud...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        try {
            const response = await fetch(`${API_URL}/examenes/solicitar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ examen_id: examenId })
            });
            const data = await response.json();
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Solicitud enviada!',
                    text: 'Tu solicitud ha sido registrada. El doctor la revisará y te enviará los resultados.',
                    confirmButtonColor: '#667eea'
                });
                cargarMisResultados();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'Error al solicitar el examen',
                    confirmButtonColor: '#e53e3e'
                });
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo conectar con el servidor',
                confirmButtonColor: '#e53e3e'
            });
        }
    }
};

//Cargar mis resultados
async function cargarMisResultados() {
    try {
        const response = await fetch(`${API_URL}/examenes/mis-resultados`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            document.getElementById('misResultados').innerHTML = `
                <table class="tabla-resultados">
                    <thead>
                        <tr>
                            <th>Examen</th>
                            <th>Fecha</th>
                            <th>Resultado</th>
                            <th>PDF</th>
                            <th>Acción</th>
                        </thead>
                    <tbody>

                        ${data.map(resultado => `
                            <tr>
                                <td>${resultado.examen_nombre} \n
                                <td>${new Date(resultado.fecha_solicitud).toLocaleDateString()} \n
                                <td>${resultado.resultado || 'Ver PDF'} \n
                                <td>${resultado.archivo_pdf ? 'Disponible' : 'No disponible'} \n
                                <td class="table-action-cell">
                                    ${resultado.archivo_pdf ? 
                                        `<button onclick="descargarPDF(${resultado.id}, '${resultado.archivo_pdf}')" class="btn-premium btn-down btn-descargar" style="margin-right: 5px;">
                                          <i class="fas fa-file-pdf"></i> Descargar
                                         </button>
                                         <button onclick="eliminarResultado(${resultado.id})" class="btn-premium btn-del">
                                          <i class="fas fa-trash-alt"></i> Eliminar
                                         </button>` : 
                                        '<span class="pendiente">Pendiente</span>'
                                    }
                                 \n
                             </tr>
                   `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            document.getElementById('misResultados').innerHTML = '<p>No hay resultados de exámenes</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Descargar PDF (ya no elimina la solicitud)
function descargarPDF(idSolicitud, nombreArchivo) {
    // Abrir el PDF en nueva pestaña
    window.open(`http://localhost:3000/uploads/${nombreArchivo}`, '_blank');
    Swal.fire({
        icon: 'success',
        title: 'Descarga iniciada',
        text: 'El PDF se ha abierto en una nueva pestaña. Si no se muestra, revisa tu bloqueador de ventanas emergentes.',
        confirmButtonColor: '#667eea'
    });
}

// Eliminar resultado manualmente (solo el registro, no el PDF físico)
async function eliminarResultado(idSolicitud) {
    const confirm = await Swal.fire({
        title: '¿Eliminar resultado?',
        text: 'Esta acción eliminará el registro de tu lista. El PDF seguirá existiendo en el servidor, pero ya no aparecerá aquí. ¿Deseas continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#667eea'
    });
    
    if (!confirm.isConfirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/examenes/eliminar-solicitud/${idSolicitud}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El resultado ha sido retirado de tu lista.',
                confirmButtonColor: '#667eea'
            });
            cargarMisResultados(); // Recargar la tabla
        } else {
            const error = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.error || 'No se pudo eliminar el registro.',
                confirmButtonColor: '#e53e3e'
            });
        }
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor.',
            confirmButtonColor: '#e53e3e'
        });
    }
}




//Cargar historial clínico
async function cargarHistorialClinico() {
    try {
        const response = await fetch(`${API_URL}/pacientes/mi-historial`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
            document.getElementById('historialClinico').innerHTML = `
                <table class="tabla-historial">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Enfermedad</th>
                            <th>Intensidad</th>
                            <th>Factores Alivio</th>
                            <th>Factores Empeoran</th>
                        </thead>
                    <tbody>
                        ${data.map(historial => `
                            <tr>
                                <td>${new Date(historial.created_at).toLocaleDateString()} \n
                                <td>${historial.enfermedad} \n
                                <td>${historial.intensidad} \n
                                <td>${historial.factores_alivio || '-'} \n
                                <td>${historial.factores_empeoran || '-'} \n
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            document.getElementById('historialClinico').innerHTML = '<p>No hay historial clínico registrado</p>';
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

//Cargar lista de contactos
async function cargarContactosEmergencia() {
    try {
        const response = await fetch(`${API_URL}/pacientes/mis-contactos-emergencia`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const container = document.getElementById('listaContactosEmergencia');
        
        if (response.ok && data.length > 0) {
            // Tiene contactos - mostrar lista
            let html = '<div class="contactos-lista">';
            data.forEach(contacto => {
                html += `
                    <div class="contacto-card-modern" id="contacto-${contacto.id}">
                        <div class="contacto-avatar">
                            <i class="fas fa-user-circle"></i>
                        </div>
                        <div class="contacto-info-modern">
                            <div class="contacto-nombre">${contacto.nombre}</div>
                            <div class="contacto-detalles">
                                <span class="contacto-telefono">
                                <i class="fas fa-phone-alt"></i> ${contacto.telefono}</span>
                                <span class="contacto-relacion">
                                <i class="fas fa-users"></i> ${contacto.relacion}</span>
                            </div>
                        </div>
                        <div class="contacto-actions-modern">
                            <button onclick="editarContactoModal(${contacto.id})" class="btn-editar-contacto-modern" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="eliminarContacto(${contacto.id})" class="btn-eliminar-contacto-modern" title="Eliminar">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
            container.innerHTML = html;
        } else {
            // NO tiene contactos - mostrar mensaje SIN botón adicional
            container.innerHTML = `
                <div class="contacto-vacio-modern">
                    <i class="fas fa-address-card"></i>
                    <p>No tienes contactos de emergencia registrados</p>
                </div>
            `;
            // NOTA: Ya no se agrega un botón aquí, solo el mensaje
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('listaContactosEmergencia').innerHTML = '<div class="contacto-error">Error al cargar contactos</div>';
    }
}

//Abrir modal para agregar contacto
function abrirModalAgregar() {
    document.getElementById('modalContactoTitulo').textContent = 'Agregar contacto de emergencia';
    document.getElementById('contactoIdEdit').value = '';
    document.getElementById('contactoNombreEdit').value = '';
    document.getElementById('contactoTelefonoEdit').value = '';
    document.getElementById('contactoRelacionEdit').value = '';
    document.getElementById('modalContacto').style.display = 'block';
}

//Abrir modal para editar contacto
window.editarContactoModal = async (id) => {
    try {
        const response = await fetch(`${API_URL}/pacientes/contacto-emergencia/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const contacto = await response.json();
        
        if (response.ok) {
            document.getElementById('modalContactoTitulo').textContent = 'Editar contacto de emergencia';
            document.getElementById('contactoIdEdit').value = contacto.id;
            document.getElementById('contactoNombreEdit').value = contacto.nombre;
            document.getElementById('contactoTelefonoEdit').value = contacto.telefono;
            document.getElementById('contactoRelacionEdit').value = contacto.relacion;
            document.getElementById('modalContacto').style.display = 'block';
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el contacto',
            confirmButtonColor: '#e53e3e'
        });
    }
};

//Guardar contacto (crear o actualizar)
document.getElementById('formContactoEmergencia').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const contactoId = document.getElementById('contactoIdEdit').value;
    const nombre = document.getElementById('contactoNombreEdit').value;
    const telefono = document.getElementById('contactoTelefonoEdit').value;
    const relacion = document.getElementById('contactoRelacionEdit').value;
    
    if (!nombre || !telefono || !relacion) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos incompletos',
            text: 'Por favor complete todos los campos',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
    
    const url = contactoId ? `${API_URL}/pacientes/contacto-emergencia/${contactoId}` : `${API_URL}/pacientes/contacto-emergencia`;
    const method = contactoId ? 'PUT' : 'POST';
    
    Swal.fire({
        title: contactoId ? 'Actualizando contacto...' : 'Guardando contacto...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ nombre, telefono, relacion })
        });
        
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: contactoId ? '¡Contacto actualizado!' : '¡Contacto guardado!',
                text: contactoId ? 'El contacto ha sido actualizado exitosamente.' : 'El contacto ha sido agregado exitosamente.',
                confirmButtonColor: '#667eea'
            });
            cerrarModalContacto();
            cargarContactosEmergencia();
        } else {
            const data = await response.json();
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'Error al guardar el contacto',
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

//Eliminar contacto
window.eliminarContacto = async (id) => {
    const result = await Swal.fire({
        title: '¿Eliminar contacto?',
        text: '¿Estás seguro de que deseas eliminar este contacto de emergencia?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#e53e3e',
        cancelButtonColor: '#667eea'
    });
    
    if (result.isConfirmed) {
        try {
            const response = await fetch(`${API_URL}/pacientes/contacto-emergencia/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Contacto eliminado!',
                    text: 'El contacto de emergencia ha sido eliminado.',
                    confirmButtonColor: '#667eea'
                });
                cargarContactosEmergencia();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo eliminar el contacto',
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
    }
};

//Cerrar modal
function cerrarModalContacto() {
    document.getElementById('modalContacto').style.display = 'none';
}

//Eventos del modal
document.getElementById('btnAgregarContacto').addEventListener('click', () => abrirModalAgregar());
document.getElementById('btnCancelarModal').addEventListener('click', cerrarModalContacto);
document.querySelector('.close-modal').addEventListener('click', cerrarModalContacto);
window.addEventListener('click', (e) => {
    const modal = document.getElementById('modalContacto');
    if (e.target === modal) cerrarModalContacto();
});


//Cerrar sesión
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
});



//Inicializar
cargarDatosPaciente();
cargarSignosVitales();
cargarMisCitas();
cargarCatalogoExamenes();
cargarMisResultados();
cargarHistorialClinico();
cargarContactosEmergencia();