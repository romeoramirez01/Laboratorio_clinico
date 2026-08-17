// Sistema de personalización de tema y avatar
// Este archivo debe incluirse en TODOS los paneles

const PERFIL_KEY = 'laboratorioClinicoPerfil';

// Obtener perfil guardado
function obtenerPerfil() {
  const guardado = localStorage.getItem(PERFIL_KEY);
  if (guardado) {
    return JSON.parse(guardado);
  }
  // Valores por defecto
  return { tema: 'turquesa', avatar: '🐼' };
}

// Guardar perfil
function guardarPerfil(tema, avatar) {
  localStorage.setItem(PERFIL_KEY, JSON.stringify({ tema, avatar }));
}

// Aplicar tema y avatar al cargar la página
function aplicarPerfil() {
  const perfil = obtenerPerfil();
  
  // Aplicar tema al body
  document.body.setAttribute('data-tema', perfil.tema);
  
  // Mostrar avatar en la barra de navegación (si existe el elemento)
  const avatarDisplay = document.getElementById('avatarDisplay');
  if (avatarDisplay) {
    avatarDisplay.textContent = perfil.avatar;
  }
  
  // Actualizar selectors si existen
  const temaColor = document.getElementById('temaColor');
  const avatarSelect = document.getElementById('avatarSelect');
  
  if (temaColor) temaColor.value = perfil.tema;
  if (avatarSelect) avatarSelect.value = perfil.avatar;
  
  return perfil;
}

// Configurar listeners para cambios de tema
function configurarCambiosTema() {
  const temaColor = document.getElementById('temaColor');
  const avatarSelect = document.getElementById('avatarSelect');
  const perfil = obtenerPerfil();
  
  if (temaColor) {
    temaColor.addEventListener('change', (e) => {
      perfil.tema = e.target.value;
      guardarPerfil(perfil.tema, perfil.avatar);
      document.body.setAttribute('data-tema', perfil.tema);
    });
  }
  
  if (avatarSelect) {
    avatarSelect.addEventListener('change', (e) => {
      perfil.avatar = e.target.value;
      guardarPerfil(perfil.tema, perfil.avatar);
      const avatarDisplay = document.getElementById('avatarDisplay');
      if (avatarDisplay) avatarDisplay.textContent = perfil.avatar;
    });
  }
}

// Ejecutar al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  aplicarPerfil();
  configurarCambiosTema();
});
