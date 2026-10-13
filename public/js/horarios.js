/**
 * Gestión de Horarios de Tutorías (Prototipo Frontend sin Backend)
 * Almacenamiento y persistencia en localStorage
 */

const STORAGE_KEY_TRAMOS = "tutorias_tramos_horarios";

// Tramos iniciales de demostración
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

// Obtener tramos almacenados o iniciales
function obtenerTramos() {
  const guardados = localStorage.getItem(STORAGE_KEY_TRAMOS);
  if (guardados) {
    try {
      return JSON.parse(guardados);
    } catch (e) {
      console.error("Error al parsear tramos:", e);
    }
  }
  // Si no existen, guardar los iniciales
  localStorage.setItem(STORAGE_KEY_TRAMOS, JSON.stringify(TRAMOS_INICIALES));
  return [...TRAMOS_INICIALES];
}

// Guardar array de tramos
function guardarTramos(tramos) {
  localStorage.setItem(STORAGE_KEY_TRAMOS, JSON.stringify(tramos));
}

// Publicar un nuevo tramo
function publicarTramo(nuevoTramo) {
  const tramos = obtenerTramos();
  nuevoTramo.id = "tramo-" + Date.now();
  nuevoTramo.estado = "Disponible";
  tramos.unshift(nuevoTramo); // Agregar al inicio para ver de primero
  guardarTramos(tramos);
  return nuevoTramo;
}

// Eliminar un tramo por ID
function eliminarTramo(id) {
  alert("POR HACER")
}

// Restablecer tramos de prueba
function restablecerTramosPrueba() {
  localStorage.setItem(STORAGE_KEY_TRAMOS, JSON.stringify(TRAMOS_INICIALES));
  return [...TRAMOS_INICIALES];
}

/* ==========================================================================
   VISTA DEL PROFESOR: GESTIÓN Y PUBLICACIÓN
   ========================================================================== */
function inicializarVistaProfesor() {
  const formPublicar = document.getElementById("formPublicarHorario");
  const contenedorTramos = document.getElementById("gridTramosProfesor");
  const badgeContador = document.getElementById("contadorTramosProfesor");
  const alertaExito = document.getElementById("alertaFeedbackExito");
  const btnRestablecer = document.getElementById("btnRestablecerTramos");

  function renderizar() {
    const tramos = obtenerTramos();
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
        </div>
      `;
      return;
    }

    contenedorTramos.innerHTML = tramos
      .map((t) => {
        const esOnline = t.modalidad.toLowerCase() === "online";
        return `
        <article class="tramo-card" data-id="${t.id}">
          <div class="tramo-card-header">
            <span class="dia-badge">📅 ${t.dia}</span>
            <span class="estado-badge disponible">🟢 ${t.estado}</span>
          </div>

          <div class="hora-rango">
            ⏰ ${t.horaInicio} - ${t.horaFin}
          </div>

          <div class="tramo-materia">
            📖 ${t.asignatura || "Tutoría General"}
          </div>

          <ul class="tramo-detalles">
            <li>
              <span class="badge-modalidad ${esOnline ? "online" : "presencial"}">
                ${esOnline ? "🌐 Online" : "🏢 Presencial"}
              </span>
            </li>
            <li>📍 <strong>Lugar:</strong> ${t.lugar || "Por definir"}</li>
            ${t.notas ? `<li>💬 <em>"${t.notas}"</em></li>` : ""}
          </ul>

          <div class="tramo-card-footer">
            <span style="font-size: 0.8rem; color: #64748b;">Visible para alumnos</span>
            <button type="button" class="btn-eliminar-tramo" onclick="manejarEliminarTramo('${t.id}')">
              🗑️ Retirar tramo
            </button>
          </div>
        </article>
      `;
      })
      .join("");
  }

  // Manejador del formulario de publicación
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

      // Validación de horas
      if (horaInicio >= horaFin) {
        alert("La hora de inicio debe ser anterior a la hora de fin.");
        return;
      }

      // Nombre del profesor logueado
      const usuarioActivo = JSON.parse(
        localStorage.getItem("tutorias_usuario_actual") || "{}"
      );
      const nombreProfesor = usuarioActivo.nombre || "Prof. Julián Barreno";

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

      // Mostrar feedback de éxito
      if (alertaExito) {
        alertaExito.style.display = "flex";
        alertaExito.scrollIntoView({ behavior: "smooth", block: "nearest" });
        setTimeout(() => {
          alertaExito.style.display = "none";
        }, 5000);
      }

      // Limpiar campos secundarios manteniendo valores prácticos
      document.getElementById("tramoLugar").value = "";
      document.getElementById("tramoNotas").value = "";

      renderizar();
    });
  }

  // Botón para restablecer demostración
  if (btnRestablecer) {
    btnRestablecer.addEventListener("click", () => {
      if (confirm("¿Deseas restaurar los tramos de horarios iniciales de prueba?")) {
        restablecerTramosPrueba();
        renderizar();
      }
    });
  }

  // Exponer función de eliminar globalmente para el botón onclick
  window.manejarEliminarTramo = function (id) {
    if (confirm("¿Estás seguro de que deseas retirar este tramo de horario disponible?")) {
      eliminarTramo(id);
      renderizar();
    }
  };

  renderizar();
}


