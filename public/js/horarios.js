/**
 * Gestión de tramos de tutoría y solicitudes (prototipo frontend sin backend)
 * Todo se guarda en localStorage, así que profesor y alumno comparten datos
 * y los cambios se reflejan en directo entre pestañas (evento "storage").
 */

const STORAGE_KEY_TRAMOS = "tutorias_tramos_horarios";
const STORAGE_KEY_RESERVAS = "tutorias_reservas";
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const ESTADOS_ACTIVOS = ["Pendiente", "Aceptada"];

const TRAMOS_INICIALES = [
  {
    id: "tramo-1",
    profesor: "Prof. Julián Barreno",
    asignatura: "Desarrollo de Interfaces Web",
    dia: "Lunes",
    horaInicio: "10:00",
    horaFin: "11:30",
    modalidad: "Presencial",
    lugar: "Despacho 204 (Edificio Central)",
    estado: "Disponible",
    notas: "Resolución de dudas sobre maquetación, HTML y CSS."
  },
  {
    id: "tramo-2",
    profesor: "Prof. Julián Barreno",
    asignatura: "Sistemas Informáticos",
    dia: "Miércoles",
    horaInicio: "12:00",
    horaFin: "13:30",
    modalidad: "Online",
    lugar: "Google Meet (Enlace en campus virtual)",
    estado: "Disponible",
    notas: "Tutorías virtuales para repaso general y consultas de clase."
  },
  {
    id: "tramo-3",
    profesor: "Prof. Julián Barreno",
    asignatura: "Bases de Datos Relacionales",
    dia: "Jueves",
    horaInicio: "16:00",
    horaFin: "17:30",
    modalidad: "Presencial",
    lugar: "Laboratorio 3 - Planta 1",
    estado: "Disponible",
    notas: "Consultas de diseño relacional, normalización y SQL."
  }
];

/* ==========================================================================
   UTILIDADES
   ========================================================================== */
function escapeHtml(texto) {
  return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function fechaLegible(fechaISO) {
  const f = new Date(fechaISO + "T00:00:00");
  return f.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function leerLista(clave) {
  try {
    const datos = localStorage.getItem(clave);
    if (datos) return JSON.parse(datos);
  } catch (e) {
    console.error("Error al leer " + clave + ":", e);
  }
  return null;
}

function sesionActual() {
  return typeof obtenerSesion === "function" ? obtenerSesion() : null;
}

function mostrarToast(mensaje) {
  let cont = document.getElementById("toastTutorias");
  if (!cont) {
    cont = document.createElement("div");
    cont.id = "toastTutorias";
    cont.setAttribute("role", "status");
    cont.setAttribute("aria-live", "polite");
    document.body.appendChild(cont);
  }
  const t = document.createElement("div");
  t.className = "toast-item";
  t.textContent = mensaje;
  cont.appendChild(t);
  setTimeout(() => t.remove(), 6000);
}

// Avisa cuando OTRA pestaña modifica tramos o reservas
function suscribirCambios(callback) {
  window.addEventListener("storage", (e) => {
    if (e.key !== null && e.key !== STORAGE_KEY_TRAMOS && e.key !== STORAGE_KEY_RESERVAS) return;
    const parsear = (v) => {
      try { return JSON.parse(v) || []; } catch (err) { return []; }
    };
    callback(e.key, parsear(e.oldValue), parsear(e.newValue));
  });
}

function ordenarReservas(lista) {
  const rango = { Pendiente: 0, Aceptada: 1 };
  return [...lista].sort((a, b) => {
    const ra = rango[a.estado] ?? 2;
    const rb = rango[b.estado] ?? 2;
    if (ra !== rb) return ra - rb;
    return (a.fecha + a.horaInicio).localeCompare(b.fecha + b.horaInicio);
  });
}

/* ==========================================================================
   TRAMOS
   ========================================================================== */
function obtenerTramos() {
  const guardados = leerLista(STORAGE_KEY_TRAMOS);
  if (guardados) return guardados;
  localStorage.setItem(STORAGE_KEY_TRAMOS, JSON.stringify(TRAMOS_INICIALES));
  return [...TRAMOS_INICIALES];
}

function guardarTramos(tramos) {
  localStorage.setItem(STORAGE_KEY_TRAMOS, JSON.stringify(tramos));
}

function publicarTramo(nuevoTramo) {
  const tramos = obtenerTramos();
  nuevoTramo.id = "tramo-" + Date.now();
  nuevoTramo.estado = "Disponible";
  tramos.unshift(nuevoTramo);
  guardarTramos(tramos);
  return nuevoTramo;
}

// Retira el tramo y cancela las solicitudes activas que tuviera.
// Devuelve cuántas solicitudes se cancelaron.
function eliminarTramo(id) {
  guardarTramos(obtenerTramos().filter((t) => t.id !== id));

  let canceladas = 0;
  const reservas = obtenerReservas().map((r) => {
    if (r.tramoId === id && ESTADOS_ACTIVOS.includes(r.estado)) {
      canceladas++;
      return { ...r, estado: "Cancelada", canceladaPor: "profesor" };
    }
    return r;
  });
  guardarReservas(reservas);
  return canceladas;
}

function restablecerTramosPrueba() {
  localStorage.setItem(STORAGE_KEY_TRAMOS, JSON.stringify(TRAMOS_INICIALES));
  guardarReservas([]);
  return [...TRAMOS_INICIALES];
}

/* ==========================================================================
   RESERVAS / SOLICITUDES
   ========================================================================== */
function obtenerReservas() {
  return leerLista(STORAGE_KEY_RESERVAS) || [];
}

function guardarReservas(reservas) {
  localStorage.setItem(STORAGE_KEY_RESERVAS, JSON.stringify(reservas));
}

function crearReserva({ tramoId, fecha, alumno, motivo }) {
  const tramo = obtenerTramos().find((t) => t.id === tramoId);
  if (!tramo) return { ok: false, error: "Este tramo ya no está disponible." };

  const reservas = obtenerReservas();
  const ocupado = reservas.some(
    (r) => r.tramoId === tramoId && r.fecha === fecha && ESTADOS_ACTIVOS.includes(r.estado)
  );
  if (ocupado) return { ok: false, error: "Este horario ya ha sido solicitado por otra persona." };

  // Se guarda una copia de los datos del tramo para que la reserva siga
  // siendo legible aunque el profesor retire el tramo después.
  const reserva = {
    id: "reserva-" + Date.now(),
    tramoId,
    fecha,
    alumno,
    motivo: motivo || "",
    profesor: tramo.profesor,
    asignatura: tramo.asignatura,
    dia: tramo.dia,
    horaInicio: tramo.horaInicio,
    horaFin: tramo.horaFin,
    modalidad: tramo.modalidad,
    lugar: tramo.lugar,
    estado: "Pendiente",
    creada: new Date().toISOString()
  };

  reservas.push(reserva);
  guardarReservas(reservas);
  return { ok: true, reserva };
}

function cambiarEstadoReserva(id, estado, extra = {}) {
  const reservas = obtenerReservas();
  const r = reservas.find((x) => x.id === id);
  if (!r) return null;
  Object.assign(r, extra, { estado, respondida: new Date().toISOString() });
  guardarReservas(reservas);
  return r;
}

function contarPendientesProfesor(nombre) {
  return obtenerReservas().filter((r) => r.profesor === nombre && r.estado === "Pendiente").length;
}

// Badge rojo con el nº de solicitudes pendientes junto al enlace "Panel Profesor"
function actualizarBadgeNav() {
  const sesion = sesionActual();
  const n = sesion && sesion.rol === "profesor" ? contarPendientesProfesor(sesion.nombre) : 0;

  document.querySelectorAll('.nav-links a[href="profesor.html"]').forEach((a) => {
    let badge = a.querySelector(".badge-notif");
    if (n > 0) {
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "badge-notif";
        badge.setAttribute("aria-label", "solicitudes pendientes");
        a.appendChild(badge);
      }
      badge.textContent = n;
    } else if (badge) {
      badge.remove();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  actualizarBadgeNav();
  // En páginas sin vista propia (index) el badge se mantiene al día
  suscribirCambios(actualizarBadgeNav);
});

/* ==========================================================================
   VISTA DEL PROFESOR
   ========================================================================== */
function inicializarVistaProfesor() {
  const formPublicar = document.getElementById("formPublicarHorario");
  const contenedorTramos = document.getElementById("gridTramosProfesor");
  const badgeContador = document.getElementById("contadorTramosProfesor");
  const alertaExito = document.getElementById("alertaFeedbackExito");
  const btnRestablecer = document.getElementById("btnRestablecerTramos");
  const listaSolicitudes = document.getElementById("listaSolicitudes");
  const contadorSolicitudes = document.getElementById("contadorSolicitudes");

  const nombreProfesor = (sesionActual() || {}).nombre || "Prof. Julián Barreno";

  function renderizarTramos() {
    const tramos = obtenerTramos().filter((t) => t.profesor === nombreProfesor);

    if (badgeContador) {
      badgeContador.innerHTML = `<strong>${tramos.length}</strong> ${
        tramos.length === 1 ? "tramo publicado" : "tramos publicados"
      }`;
    }
    if (!contenedorTramos) return;

    if (tramos.length === 0) {
      contenedorTramos.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📅</div>
          <h3>No tienes tramos de horario publicados</h3>
          <p>Utiliza el formulario superior para publicar tus horarios disponibles y que los alumnos puedan reservar una tutoría.</p>
        </div>`;
      return;
    }

    contenedorTramos.innerHTML = tramos
      .map((t) => {
        const esOnline = String(t.modalidad).toLowerCase() === "online";
        return `
        <article class="tramo-card" data-id="${escapeHtml(t.id)}">
          <div class="tramo-card-header">
            <span class="dia-badge">📅 ${escapeHtml(t.dia)}</span>
            <span class="estado-badge disponible">🟢 ${escapeHtml(t.estado)}</span>
          </div>
          <div class="hora-rango">⏰ ${escapeHtml(t.horaInicio)} - ${escapeHtml(t.horaFin)}</div>
          <div class="tramo-materia">📖 ${escapeHtml(t.asignatura || "Tutoría General")}</div>
          <ul class="tramo-detalles">
            <li>
              <span class="badge-modalidad ${esOnline ? "online" : "presencial"}">
                ${esOnline ? "🌐 Online" : "🏢 Presencial"}
              </span>
            </li>
            <li>📍 <strong>Lugar:</strong> ${escapeHtml(t.lugar || "Por definir")}</li>
            ${t.notas ? `<li>💬 <em>"${escapeHtml(t.notas)}"</em></li>` : ""}
          </ul>
          <div class="tramo-card-footer">
            <span style="font-size: 0.8rem; color: #64748b;">Visible para alumnos</span>
            <button type="button" class="btn-eliminar-tramo" data-accion="eliminar-tramo" data-id="${escapeHtml(t.id)}">
              🗑️ Retirar tramo
            </button>
          </div>
        </article>`;
      })
      .join("");
  }

  function renderizarSolicitudes() {
    if (!listaSolicitudes) return;
    const mias = ordenarReservas(obtenerReservas().filter((r) => r.profesor === nombreProfesor));
    const pendientes = mias.filter((r) => r.estado === "Pendiente").length;

    if (contadorSolicitudes) {
      contadorSolicitudes.innerHTML = pendientes
        ? `<strong>${pendientes}</strong> ${pendientes === 1 ? "pendiente" : "pendientes"}`
        : "Sin pendientes";
      contadorSolicitudes.classList.toggle("con-pendientes", pendientes > 0);
    }

    if (mias.length === 0) {
      listaSolicitudes.innerHTML = `<p class="solicitudes-vacio">Todavía no has recibido ninguna solicitud de tutoría.</p>`;
      return;
    }

    const iconos = { Pendiente: "⏳", Aceptada: "✅", Rechazada: "❌", Cancelada: "🚫" };

    listaSolicitudes.innerHTML = mias
      .map((r) => `
        <article class="solicitud-card ${r.estado.toLowerCase()}">
          <div class="solicitud-info">
            <div class="solicitud-titulo">
              <strong>${escapeHtml(r.alumno)}</strong>
              <span class="solicitud-estado ${r.estado.toLowerCase()}">${iconos[r.estado] || ""} ${escapeHtml(r.estado)}</span>
            </div>
            <div class="solicitud-detalle">📅 ${escapeHtml(fechaLegible(r.fecha))} · ⏰ ${escapeHtml(r.horaInicio)} - ${escapeHtml(r.horaFin)}</div>
            <div class="solicitud-detalle">📖 ${escapeHtml(r.asignatura)} · ${escapeHtml(r.modalidad)} · 📍 ${escapeHtml(r.lugar)}</div>
            ${r.motivo ? `<div class="solicitud-motivo">💬 "${escapeHtml(r.motivo)}"</div>` : ""}
            ${r.estado === "Cancelada" ? `<div class="solicitud-detalle">${r.canceladaPor === "alumno" ? "El alumno canceló la solicitud." : "Cancelada al retirar el tramo."}</div>` : ""}
          </div>
          ${r.estado === "Pendiente" ? `
          <div class="solicitud-acciones">
            <button type="button" class="btn-aceptar" data-accion="aceptar" data-id="${escapeHtml(r.id)}">✔ Aceptar</button>
            <button type="button" class="btn-rechazar" data-accion="rechazar" data-id="${escapeHtml(r.id)}">✖ Rechazar</button>
          </div>` : ""}
        </article>`)
      .join("");
  }

  function renderizar() {
    renderizarTramos();
    renderizarSolicitudes();
    actualizarBadgeNav();
  }

  // Retirar tramo
  if (contenedorTramos) {
    contenedorTramos.addEventListener("click", (e) => {
      const btn = e.target.closest('[data-accion="eliminar-tramo"]');
      if (!btn) return;
      const id = btn.dataset.id;
      const activas = obtenerReservas().filter(
        (r) => r.tramoId === id && ESTADOS_ACTIVOS.includes(r.estado)
      ).length;

      const aviso = activas
        ? `Este tramo tiene ${activas} solicitud(es) activa(s) que se cancelarán. ¿Retirarlo igualmente?`
        : "¿Estás seguro de que deseas retirar este tramo de horario disponible?";

      if (confirm(aviso)) {
        eliminarTramo(id);
        renderizar();
      }
    });
  }

  // Aceptar / rechazar solicitudes
  if (listaSolicitudes) {
    listaSolicitudes.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-accion]");
      if (!btn) return;
      const accion = btn.dataset.accion;
      if (accion !== "aceptar" && accion !== "rechazar") return;

      const r = cambiarEstadoReserva(btn.dataset.id, accion === "aceptar" ? "Aceptada" : "Rechazada");
      if (r) {
        mostrarToast(
          accion === "aceptar"
            ? `✅ Has aceptado la tutoría de ${r.alumno}.`
            : `Has rechazado la solicitud de ${r.alumno}.`
        );
      }
      renderizar();
    });
  }

  // Publicar tramo
  if (formPublicar) {
    formPublicar.addEventListener("submit", (e) => {
      e.preventDefault();

      const dia = document.getElementById("tramoDia").value;
      const horaInicio = document.getElementById("tramoHoraInicio").value;
      const horaFin = document.getElementById("tramoHoraFin").value;
      const modalidad = document.getElementById("tramoModalidad").value;
      const lugar = document.getElementById("tramoLugar").value.trim();
      const asignatura = document.getElementById("tramoAsignatura").value.trim();
      const notas = document.getElementById("tramoNotas").value.trim();

      if (horaInicio >= horaFin) {
        alert("La hora de inicio debe ser anterior a la hora de fin.");
        return;
      }

      publicarTramo({
        profesor: nombreProfesor,
        dia,
        horaInicio,
        horaFin,
        modalidad,
        lugar: lugar || (modalidad === "Online" ? "Videollamada" : "Despacho"),
        asignatura: asignatura || "Tutoría General",
        notas
      });

      if (alertaExito) {
        alertaExito.style.display = "flex";
        alertaExito.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setTimeout(() => { alertaExito.style.display = "none"; }, 5000);
      }

      document.getElementById("tramoLugar").value = "";
      document.getElementById("tramoNotas").value = "";
      renderizar();
    });
  }

  if (btnRestablecer) {
    btnRestablecer.addEventListener("click", () => {
      if (confirm("¿Deseas restaurar los tramos iniciales de prueba? Se borrarán también todas las solicitudes.")) {
        restablecerTramosPrueba();
        renderizar();
      }
    });
  }

  // Cambios hechos desde otra pestaña (p. ej. un alumno solicitando)
  suscribirCambios((clave, antiguas, nuevas) => {
    if (clave === STORAGE_KEY_RESERVAS) {
      nuevas
        .filter((r) => r.profesor === nombreProfesor && r.estado === "Pendiente" && !antiguas.some((o) => o.id === r.id))
        .forEach((r) => mostrarToast(`🔔 Nueva solicitud de ${r.alumno} para el ${fechaLegible(r.fecha)} a las ${r.horaInicio}.`));
    }
    renderizar();
  });

  renderizar();
}
