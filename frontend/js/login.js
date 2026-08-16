const API_URL = window.location.origin;
const AUTH_URL = `${API_URL}/api/auth`;
const PERFIL_KEY = 'perfilUsuario';

function getPerfil() {
  const perfilGuardado = localStorage.getItem(PERFIL_KEY);
  if (!perfilGuardado) {
    return { tema: 'turquesa', avatar: '🐼' };
  }

  try {
    return JSON.parse(perfilGuardado);
  } catch {
    return { tema: 'turquesa', avatar: '🐼' };
  }
}

function guardarPerfil(tema, avatar) {
  localStorage.setItem(PERFIL_KEY, JSON.stringify({ tema, avatar }));
}

function aplicarPerfil() {
  const perfil = getPerfil();

  document.body.setAttribute('data-tema', perfil.tema);

  const avatarActual = document.getElementById('avatarActual');
  if (avatarActual) avatarActual.textContent = perfil.avatar;

  const temaColor = document.getElementById('temaColor');
  const avatarSelect = document.getElementById('avatarSelect');

  if (temaColor) temaColor.value = perfil.tema;
  if (avatarSelect) avatarSelect.value = perfil.avatar;
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('login.js cargado');
  aplicarPerfil();
  console.log('tema actual:', document.body.dataset.tema);

  const temaColor = document.getElementById('temaColor');
  const avatarSelect = document.getElementById('avatarSelect');

  if (temaColor) {
    temaColor.addEventListener('change', (e) => {
      const perfil = getPerfil();
      perfil.tema = e.target.value;
      guardarPerfil(perfil.tema, perfil.avatar);
      aplicarPerfil();
      console.log('tema cambiado a:', document.body.dataset.tema);
    });
  }

  if (avatarSelect) {
    avatarSelect.addEventListener('change', (e) => {
      const perfil = getPerfil();
      perfil.avatar = e.target.value;
      guardarPerfil(perfil.tema, perfil.avatar);
      aplicarPerfil();
      console.log('avatar cambiado a:', perfil.avatar);
    });
  }

  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    const resetModal = document.getElementById('resetModal');
    if (resetModal) {
      resetModal.style.display = 'block';
      window.resetToken = token;
    }
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      Swal.fire({
        title: 'Iniciando sesión...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
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

          switch (data.usuario.rol) {
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
            text: data.error || 'Credenciales inválidas.',
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
  }

  const registerLink = document.getElementById('registerLink');
  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      const registerModal = document.getElementById('registerModal');
      if (registerModal) registerModal.style.display = 'block';
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fechaNacimiento = document.getElementById('regFechaNacimiento').value;
      const hoy = new Date();
      const fechaNac = new Date(fechaNacimiento);

      if (fechaNac > hoy) {
        Swal.fire({
          icon: 'warning',
          title: 'Fecha inválida',
          text: 'La fecha de nacimiento no puede ser futura.',
          confirmButtonColor: '#e53e3e'
        });
        return;
      }

      const usuarioData = {
        dui: document.getElementById('regDui').value.trim(),
        nombres: document.getElementById('regNombres').value.trim(),
        apellidos: document.getElementById('regApellidos').value.trim(),
        fecha_nacimiento: fechaNacimiento,
        telefono: document.getElementById('regTelefono').value.trim(),
        email: document.getElementById('regEmail').value.trim().toLowerCase(),
        password: document.getElementById('regPassword').value,
        rol: 'paciente'
      };

      Swal.fire({
        title: 'Registrando usuario...',
        text: 'Por favor espere',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
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
            text: 'Tu cuenta ha sido creada correctamente.',
            confirmButtonColor: '#667eea'
          });

          const registerModal = document.getElementById('registerModal');
          if (registerModal) registerModal.style.display = 'none';
          registerForm.reset();
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            text: data.error || 'No se pudo completar el registro.',
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
  }

  const forgotPassword = document.getElementById('forgotPassword');
  if (forgotPassword) {
    forgotPassword.addEventListener('click', async (e) => {
      e.preventDefault();

      const { value: email } = await Swal.fire({
        title: 'Recuperar contraseña',
        text: 'Ingresa tu correo electrónico',
        input: 'email',
        inputPlaceholder: 'ejemplo@correo.com',
        showCancelButton: true,
        confirmButtonText: 'Enviar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#e53e3e',
        inputValidator: (value) => {
          if (!value) return '¡Debes ingresar un correo!';
          if (!value.includes('@')) return '¡Ingresa un correo válido!';
        }
      });

      if (email) {
        Swal.fire({
          title: 'Enviando...',
          text: 'Por favor espere',
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading()
        });

        try {
          const response = await fetch(`${AUTH_URL}/recuperar-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase() })
          });

          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              icon: 'success',
              title: '¡Correo enviado!',
              text: data.message || 'Revisa tu correo.',
              confirmButtonColor: '#667eea'
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: data.error || 'No se pudo enviar el correo.',
              confirmButtonColor: '#e53e3e'
            });
          }
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo procesar la solicitud.',
            confirmButtonColor: '#e53e3e'
          });
        }
      }
    });
  }

  document.querySelectorAll('.close').forEach((closeBtn) => {
    closeBtn.onclick = function () {
      const modal = this.closest('.modal');
      if (modal) modal.style.display = 'none';
    };
  });

  window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  };

  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);

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
        const response = await fetch(`${AUTH_URL}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: window.resetToken, newPassword })
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire('Éxito', 'Contraseña actualizada. Ya puedes iniciar sesión.', 'success')
            .then(() => {
              const resetModal = document.getElementById('resetModal');
              if (resetModal) resetModal.style.display = 'none';
              window.location.href = 'login.html';
            });
        } else {
          Swal.fire('Error', data.error || 'No se pudo actualizar la contraseña', 'error');
        }
      } catch (error) {
        Swal.fire('Error', 'Error de conexión', 'error');
      }
    });
  }

  const closeReset = document.querySelector('#resetModal .close');
  if (closeReset) {
    closeReset.addEventListener('click', () => {
      const resetModal = document.getElementById('resetModal');
      if (resetModal) resetModal.style.display = 'none';
    });
  }
});

function cerrarModal() {
  const registerModal = document.getElementById('registerModal');
  if (registerModal) registerModal.style.display = 'none';
}

function toggleRegPassword() {
  const passwordInput = document.getElementById('regPassword');
  const icon = document.querySelector('.toggle-reg-password i');

  if (!passwordInput || !icon) return;

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