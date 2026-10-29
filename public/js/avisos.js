/**
 * Tablón de avisos: el profesor publica, el alumno lee.
 * Usa localStorage igual que horarios.js y reutiliza sus utilidades.
 */
const STORAGE_KEY_AVISOS = "tutorias_avisos";

function obtenerAvisos() {
  return leerLista(STORAGE_KEY_AVISOS) || [];
}

function guardarAvisos(avisos) {
  localStorage.setItem(STORAGE_KEY_AVISOS, JSON.stringify(avisos));
}

function fechaHoraAviso(iso) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tarjetaAviso(a, conBorrar) {
  return `
    <article class="aviso-card ${a.importante ? "importante" : ""}">
      <div class="aviso-cabecera">
        <strong>${a.importante ? "📌" : "📢"} ${escapeHtml(a.titulo)}</strong>
        <small>${escapeHtml(fechaHoraAviso(a.creado))}</small>
      </div>
      <p class="aviso-texto">${escapeHtml(a.texto)}</p>
      <div class="aviso-pie">
        <small>${escapeHtml(a.profesor)}</small>
        ${
          conBorrar
            ? `<button type="button" class="btn-eliminar-tramo" data-accion="borrar-aviso" data-id="${escapeHtml(a.id)}">🗑️ Borrar</button>`
            : ""
        }
      </div>
    </article>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formAviso");
  const listaProfesor = document.getElementById("listaAvisosProfesor");
  const listaAlumno = document.getElementById("listaAvisosAlumno");
  const contador = document.getElementById("contadorAvisosProfesor");

  const nombreProfesor =
    (sesionActual() || {}).nombre || "Prof. Julián Barreno";

  function renderizar() {
    const todos = obtenerAvisos();

    if (listaProfesor) {
      const mios = todos.filter((a) => a.profesor === nombreProfesor);
      if (contador) {
        contador.textContent = `${mios.length} ${mios.length === 1 ? "aviso publicado" : "avisos publicados"}`;
      }
      listaProfesor.innerHTML = mios.length
        ? mios.map((a) => tarjetaAviso(a, true)).join("")
        : `<p class="solicitudes-vacio">Todavía no has publicado ningún aviso.</p>`;
    }

    if (listaAlumno) {
      listaAlumno.innerHTML = todos.length
        ? todos.map((a) => tarjetaAviso(a, false)).join("")
        : `<p class="solicitudes-vacio">No hay avisos por ahora.</p>`;
    }
  }

  // Publicar (profesor)
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const titulo = document.getElementById("avisoTitulo").value.trim();
      const texto = document.getElementById("avisoTexto").value.trim();
      const importante = document.getElementById("avisoImportante").checked;
      if (!titulo || !texto) return;

      const avisos = obtenerAvisos();
      avisos.unshift({
        id: "aviso-" + Date.now(),
        profesor: nombreProfesor,
        titulo,
        texto,
        importante,
        creado: new Date().toISOString(),
      });
      guardarAvisos(avisos);

      form.reset();
      mostrarToast("📢 Aviso publicado para tus alumnos.");
      renderizar();
    });
  }

  // Borrar (profesor)
  if (listaProfesor) {
    listaProfesor.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-accion="borrar-aviso"]');
      if (!btn) return;
      if (!confirm("¿Borrar este aviso?")) return;
      guardarAvisos(obtenerAvisos().filter((a) => a.id !== btn.dataset.id));
      renderizar();
    });
  }

  // Cambios hechos desde otra pestaña (profesor publica -> alumno lo ve en directo)
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY_AVISOS) return;
    if (listaAlumno) {
      const antes = JSON.parse(e.oldValue || "[]").length;
      const ahora = JSON.parse(e.newValue || "[]").length;
      if (ahora > antes) mostrarToast("📢 Nuevo aviso de un profesor.");
    }
    renderizar();
  });

  renderizar();
});