const API_URL = window.location.origin;
const AUTH_URL = `${API_URL}/api/auth`;

// Detectar token en URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
        const resetModal = document.getElementById('resetModal');
        if (resetModal) {
            resetModal.style.display = 'block';
            window.resetToken = token;
        }
    }
});

//Manejar login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
   //Mostrar loading
    Swal.fire({
        title: 'Iniciando sesión...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
 


      //Redirigir según el rol
      switch(data.usuario.rol) {
        case 'paciente':
          window.location.href = 'panel-paciente.html';
          break;
        case 'admin':
          window.location.href = 'panel-admin.html';
          break;
        case 'doctor':
          window.location.href = 'panel-doctor.html';
          break;
        default:
          window.location.href = 'login.html';
      }

    } else {
                Swal.fire({
                icon: 'error',
                title: 'Error de autenticación',
                text: data.error || 'Credenciales inválidas. Verifica tu correo y contraseña.',
                confirmButtonColor: '#e53e3e'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor. Verifica que el servidor esté corriendo.',
            confirmButtonColor: '#e53e3e'
        });
    }
});

//Manejar registro
document.getElementById('registerLink').addEventListener('click', () => {
  document.getElementById('registerModal').style.display = 'block';
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  //Validar que la fecha de nacimiento no sea futura
    const fechaNacimiento = document.getElementById('regFechaNacimiento').value;
    const hoy = new Date();
    const fechaNac = new Date(fechaNacimiento);
    
    if (fechaNac > hoy) {
        Swal.fire({
            icon: 'warning',
            title: 'Fecha inválida',
            text: 'La fecha de nacimiento no puede ser futura. Por favor verifica.',
            confirmButtonColor: '#e53e3e'
        });
        return;
    }
  
  const usuarioData = {
    dui: document.getElementById('regDui').value,
    nombres: document.getElementById('regNombres').value,
    apellidos: document.getElementById('regApellidos').value,
    fecha_nacimiento: document.getElementById('regFechaNacimiento').value,
    telefono: document.getElementById('regTelefono').value,
    email: document.getElementById('regEmail').value,
    password: document.getElementById('regPassword').value,
    rol: 'paciente'
  };

  //Mostrar loading
    Swal.fire({
        title: 'Registrando usuario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });
  
  try {
    const response = await fetch(`${AUTH_URL}/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usuarioData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                text: 'Tu cuenta ha sido creada correctamente. Ahora puedes iniciar sesión.',
                confirmButtonColor: '#667eea'
            });
            document.getElementById('registerModal').style.display = 'none';
            document.getElementById('registerForm').reset();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al registrar',
                text: data.error || 'No se pudo completar el registro. Verifica los datos.',
                confirmButtonColor: '#e53e3e'
            });
        }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor.',
            confirmButtonColor: '#e53e3e'
        });
    }
});

// Manejar recuperación de contraseña
document.getElementById('forgotPassword').addEventListener('click', async () => { 

  const { value: email } = await Swal.fire({
        title: 'Recuperar contraseña',
        text: 'Ingresa tu correo electrónico para recibir instrucciones',
        input: 'email',
        inputPlaceholder: 'ejemplo@correo.com',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#e53e3e',
        inputValidator: (value) => {
            if (!value) {
                return '¡Debes ingresar un correo electrónico!';
            }
            if (!value.includes('@')) {
                return '¡Ingresa un correo válido!';
            }
        }
    });
    
    if (email) {
        Swal.fire({
            title: 'Enviando...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });



  try {
    const response = await fetch(`${AUTH_URL}/recuperar-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();


    if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Correo enviado!',
                    text: data.message || 'Se han enviado instrucciones a tu correo electrónico.',
                    confirmButtonColor: '#667eea'
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: data.error || 'El correo no está registrado en el sistema.',
                    confirmButtonColor: '#e53e3e'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo procesar tu solicitud. Verifica tu conexión.',
                confirmButtonColor: '#e53e3e'
            });
        }
    }
});


//Cerrar modales
document.querySelectorAll('.close').forEach(closeBtn => {
  closeBtn.onclick = function() {
    this.closest('.modal').style.display = 'none';
  }
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });
}
//Mostrar/ocultar contraseña con FontAwesome
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        //icono
        const icon = this.querySelector('i');
        if (type === 'password') {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        } else {
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        }
    });
}
//Función para cerrar modal
function cerrarModal() {
    document.getElementById('registerModal').style.display = 'none';
}

//Mostrar/ocultar contraseña en registro
function toggleRegPassword() {
    const passwordInput = document.getElementById('regPassword');
    const icon = document.querySelector('.toggle-reg-password i');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

document.getElementById('resetForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('confirmResetPassword').value;
    if (newPassword !== confirmPassword) {
        Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
        return;
    }
    const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: window.resetToken, newPassword })
    });
    const data = await response.json();
    if (response.ok) {
        Swal.fire('Éxito', 'Contraseña actualizada. Ya puedes iniciar sesión.', 'success')
            .then(() => {
                document.getElementById('resetModal').style.display = 'none';
                window.location.href = 'login.html'; // limpiar URL
            });
    } else {
        Swal.fire('Error', data.error, 'error');
    }
});


// Manejar restablecimiento de contraseña
const resetForm = document.getElementById('resetForm');
if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('resetPassword').value;
        const confirmPassword = document.getElementById('confirmResetPassword').value;
        if (newPassword !== confirmPassword) {
            Swal.fire('Error', 'Las contraseñas no coinciden', 'error');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: window.resetToken, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                Swal.fire('Éxito', 'Contraseña actualizada. Ya puedes iniciar sesión.', 'success')
                    .then(() => {
                        document.getElementById('resetModal').style.display = 'none';
                        window.location.href = 'login.html';
                    });
            } else {
                Swal.fire('Error', data.error, 'error');
            }
        } catch (error) {
            Swal.fire('Error', 'Error de conexión', 'error');
        }
    });
}


// Cerrar modal de restablecimiento con la X
const closeReset = document.querySelector('#resetModal .close');
if (closeReset) {
    closeReset.addEventListener('click', () => {
        document.getElementById('resetModal').style.display = 'none';
    });
}

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
    const modal = document.getElementById('resetModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});