/**
 * Gestión de Autenticación y Sesiones por Roles (Profesor / Alumno)
 * Prototipo Frontend sin Backend
 */

const STORAGE_KEY_USUARIO = "usuarioActual";

// Guardar sesión en localStorage y cookies
function guardarSesion(nombre, rol) {
  const usuario = {
    nombre: nombre || (rol === "profesor" ? "Prof. Julián Barreno" : "Pablo Arjonilla Cuadrado"),
    rol: rol,
    fechaLogin: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuario));

  // Soporte de cookies
  document.cookie = `usuario=${encodeURIComponent(usuario.nombre)};path=/;max-age=86400`;
  document.cookie = `rol=${encodeURIComponent(usuario.rol)};path=/;max-age=86400`;

  return usuario;
}

// Obtener usuario actual
function obtenerSesion() {
  const datos = localStorage.getItem(STORAGE_KEY_USUARIO);
  if (datos) {
    try {
      return JSON.parse(datos);
    } catch (e) {
      console.error("Error al leer sesión:", e);
    }
  }

  // Comprobar cookies de respaldo
  const cookies = document.cookie.split(";").reduce((acc, c) => {
    const [k, v] = c.trim().split("=");
    if (k && v) acc[k] = decodeURIComponent(v);
    return acc;
  }, {});

  if (cookies.rol) {
    return {
      nombre: cookies.usuario || (cookies.rol === "profesor" ? "Profesor" : "Alumno"),
      rol: cookies.rol
    };
  }

  return null;
}

// Cerrar sesión
function cerrarSesion() {
  localStorage.removeItem(STORAGE_KEY_USUARIO);
  document.cookie = "usuario=;path=/;expires=Fri, 1 Jan 2027 00:00:01 GMT";
  document.cookie = "rol=;path=/;expires=Fri, 1 Jan 2027 00:00:01 GMT";
  window.location.href = "index.html";
}

// Iniciar sesión rápida (Demo)
function iniciarSesionRapida(rol) {
  if (rol === "profesor") {
    guardarSesion("Prof. Julián Barreno", "profesor");
    window.location.href = "profesor.html";
  } else if (rol === "alumno") {
    guardarSesion("Pablo Arjonilla Cuadrado (Alumno)", "alumno");
    window.location.href = "alumno.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("miModal");
  const btnAbrirModal =
    document.getElementById("iniciarSesion") ||
    document.getElementById("btnAbrirModal");
  const loginForm = document.getElementById("loginForm");

  // Abrir modal de inicio de sesión
  if (btnAbrirModal && modal) {
    btnAbrirModal.addEventListener("click", () => {
      modal.showModal();
    });
  }

  // Permitir abrir con cualquier botón de clase .btn-abrir-login
  document.querySelectorAll(".btn-abrir-login").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (modal) modal.showModal();
    });
  });

  // Procesar formulario de login
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const usuarioInput = (document.getElementById("usuario")?.value || "").trim().toLowerCase();
      const rolSeleccionado = document.querySelector('input[name="rolSeleccionado"]:checked')?.value;

      let rolFinal = null;

      // Detección por selección directa o por coincidencia en el texto
      if (rolSeleccionado) {
        rolFinal = rolSeleccionado;
      } else if (usuarioInput.includes("profesor") || usuarioInput.includes("profe") || usuarioInput.includes("docente")) {
        rolFinal = "profesor";
      } else if (usuarioInput.includes("alumno") || usuarioInput.includes("estudiante")) {
        rolFinal = "alumno";
      }

      if (rolFinal === "profesor") {
        const nombreFinal = usuarioInput ? (usuarioInput.charAt(0).toUpperCase() + usuarioInput.slice(1)) : "Prof. Julián Barreno";
        guardarSesion(nombreFinal, "profesor");
        window.location.href = "profesor.html";
      } else if (rolFinal === "alumno") {
        const nombreFinal = usuarioInput ? (usuarioInput.charAt(0).toUpperCase() + usuarioInput.slice(1)) : "Pablo Arjonilla Cuadrado";
        guardarSesion(nombreFinal, "alumno");
        window.location.href = "alumno.html";
      } else {
        alert(
          "Rol no identificado.\n\nPara este prototipo introduce un usuario que contenga 'profesor' o 'alumno', o pulsa uno de los botones de Acceso Demo."
        );
      }
    });
  }

  // Actualizar datos del usuario en la pantalla actual
  const usuarioActivo = obtenerSesion();

  // Si estamos en profesor.html
  if (window.location.pathname.endsWith("profesor.html")) {
    if (!usuarioActivo || usuarioActivo.rol !== "profesor") {
      // Si no tiene sesión de profesor activa, inicializamos la demo de profesor para facilitar la corrección
      guardarSesion("Prof. Julián Barreno", "profesor");
    }
    const sesionActual = obtenerSesion();
    const elemNombre = document.getElementById("nombreUsuarioSesion");
    const elemRol = document.getElementById("rolUsuarioSesion");
    const elemAvatar = document.getElementById("avatarUsuarioSesion");

    if (elemNombre) elemNombre.textContent = sesionActual.nombre;
    if (elemRol) elemRol.textContent = "Profesor";
    if (elemAvatar) elemAvatar.textContent = "👨‍🏫";

    // Inicializar gestión de horarios de profesor
    if (typeof inicializarVistaProfesor === "function") {
      inicializarVistaProfesor();
    }
  }

  // Si estamos en alumno.html
  if (window.location.pathname.endsWith("alumno.html")) {
    if (!usuarioActivo || usuarioActivo.rol !== "alumno") {
      // Si no tiene sesión de alumno activa, inicializamos la demo de alumno para facilitar la corrección
      guardarSesion("Pablo Arjonilla Cuadrado (Alumno)", "alumno");
    }
    const sesionActual = obtenerSesion();
    const elemNombre = document.getElementById("nombreUsuarioSesion");
    const elemRol = document.getElementById("rolUsuarioSesion");
    const elemAvatar = document.getElementById("avatarUsuarioSesion");

    if (elemNombre) elemNombre.textContent = sesionActual.nombre;
    if (elemRol) elemRol.textContent = "Alumno";
    if (elemAvatar) elemAvatar.textContent = "🎓";

    // Inicializar consulta de horarios de alumno
    if (typeof inicializarVistaAlumno === "function") {
      inicializarVistaAlumno();
    }
  }

  // Botón cerrar sesión
  const btnCerrar = document.getElementById("btnCerrarSesion");
  if (btnCerrar) {
    btnCerrar.addEventListener("click", cerrarSesion);
  }
});
