const cabeceraDias = document.getElementById("cabeceraDias");
const horariosCalendario = document.getElementById("horariosCalendario");
const tituloSemana = document.getElementById("tituloSemana");
const selectorProfesor = document.getElementById("profesor");
const mensajeSeleccion = document.getElementById("mensajeSeleccion");
const confirmarReserva = document.getElementById("confirmarReserva");
const motivoReserva = document.getElementById("motivoReserva");
const listaMisSolicitudes = document.getElementById("listaMisSolicitudes");
const contadorMisSolicitudes = document.getElementById("contadorMisSolicitudes");

const MENSAJE_INICIAL = "Selecciona un horario disponible del calendario.";

let inicioSemana = new Date();
inicioSemana.setHours(0, 0, 0, 0);
inicioSemana.setDate(inicioSemana.getDate() - ((inicioSemana.getDay() + 6) % 7));
// Si es fin de semana, se muestra directamente la semana siguiente
if (new Date().getDay() === 0 || new Date().getDay() === 6) {
    inicioSemana.setDate(inicioSemana.getDate() + 7);
}

let seleccion = null; // { tramoId, fecha }

function nombreAlumno() {
    const s = typeof obtenerSesion === "function" ? obtenerSesion() : null;
    return (s && s.nombre) || "Pablo Arjonilla Cuadrado";
}

function formatoFecha(fecha) {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    return `${anio}-${mes}-${dia}`;
}

function obtenerFecha(diferencia) {
    const fecha = new Date(inicioSemana);
    fecha.setDate(fecha.getDate() + diferencia);
    return fecha;
}

function poblarSelectorProfesores() {
    const actual = selectorProfesor.value || "todos";
    const nombres = [...new Set(obtenerTramos().map(t => t.profesor))].sort();

    selectorProfesor.innerHTML =
        '<option value="todos">Todos los profesores</option>' +
        nombres.map(n => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join("");

    selectorProfesor.value = nombres.includes(actual) ? actual : "todos";
}

function reservaActiva(tramoId, fechaTexto, reservas) {
    return reservas.find(r =>
        r.tramoId === tramoId &&
        r.fecha === fechaTexto &&
        ESTADOS_ACTIVOS.includes(r.estado)
    );
}

function mostrarCalendario() {
    cabeceraDias.innerHTML = "";
    horariosCalendario.innerHTML = "";

    const tramos = obtenerTramos();
    const reservas = obtenerReservas();
    const yo = nombreAlumno();
    const filtro = selectorProfesor.value;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = [];
    for (let i = 0; i < 5; i++) dias.push(obtenerFecha(i));

    tituloSemana.textContent =
        `${dias[0].toLocaleDateString("es-ES", { day: "numeric", month: "short" })} - ` +
        `${dias[4].toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`;

    // Cabecera
    const filaCabecera = document.createElement("tr");
    const thHora = document.createElement("th");
    thHora.textContent = "Hora";
    filaCabecera.appendChild(thHora);

    dias.forEach(fecha => {
        const th = document.createElement("th");
        th.textContent = fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" });
        filaCabecera.appendChild(th);
    });
    cabeceraDias.appendChild(filaCabecera);

    // Filas = horas de inicio de los tramos publicados
    const visibles = tramos.filter(t => filtro === "todos" || t.profesor === filtro);
    const horas = [...new Set(visibles.map(t => t.horaInicio))].sort();

    if (horas.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 6;
        celda.textContent = "Ningún profesor ha publicado tutorías disponibles todavía.";
        fila.appendChild(celda);
        horariosCalendario.appendChild(fila);
        return;
    }

    horas.forEach(hora => {
        const fila = document.createElement("tr");
        const celdaHora = document.createElement("td");
        celdaHora.textContent = hora;
        fila.appendChild(celdaHora);

        dias.forEach((fecha, i) => {
            const celda = document.createElement("td");
            const fechaTexto = formatoFecha(fecha);
            const candidatos = visibles.filter(t => t.dia === DIAS_SEMANA[i] && t.horaInicio === hora);

            if (candidatos.length === 0) {
                celda.textContent = "—";
                celda.className = "celda-vacia";
            }

            candidatos.forEach(t => {
                const boton = document.createElement("button");
                const principal = document.createElement("span");
                const secundario = document.createElement("small");

                boton.type = "button";
                boton.title = `${t.profesor} — ${t.asignatura}`;
                secundario.textContent = `${t.horaInicio} - ${t.horaFin}`;

                const reserva = reservaActiva(t.id, fechaTexto, reservas);

                if (reserva && reserva.alumno === yo) {
                    // Tutoría propia: queda marcada
                    boton.className = `hueco mia ${reserva.estado.toLowerCase()}`;
                    principal.textContent = reserva.estado === "Aceptada" ? "✓ Aceptada" : "⏳ Pendiente";
                    boton.disabled = true;
                } else if (reserva) {
                    boton.className = "hueco ocupado";
                    principal.textContent = "Ocupado";
                    boton.disabled = true;
                } else if (fecha < hoy) {
                    boton.className = "hueco ocupado";
                    principal.textContent = "No disponible";
                    boton.disabled = true;
                } else {
                    boton.className = "hueco";
                    principal.textContent = filtro === "todos" ? t.profesor : "Disponible";

                    if (seleccion && seleccion.tramoId === t.id && seleccion.fecha === fechaTexto) {
                        boton.classList.add("elegido");
                    }

                    boton.addEventListener("click", () => {
                        seleccion = { tramoId: t.id, fecha: fechaTexto };

                        mensajeSeleccion.textContent =
                            `${fecha.toLocaleDateString("es-ES")} de ${t.horaInicio} a ${t.horaFin} ` +
                            `con ${t.profesor} · ${t.asignatura} (${t.modalidad}, ${t.lugar}).`;

                        confirmarReserva.disabled = false;
                        mostrarCalendario();
                    });
                }

                boton.append(principal, secundario);
                celda.appendChild(boton);
            });

            fila.appendChild(celda);
        });

        horariosCalendario.appendChild(fila);
    });
}

function resetMensaje() {
    mensajeSeleccion.textContent = MENSAJE_INICIAL;
    confirmarReserva.disabled = true;
}

// Mis solicitudes (alumno)
function renderizarMisSolicitudes() {
    if (!listaMisSolicitudes) return;

    const yo = nombreAlumno();
    const mias = ordenarReservas(obtenerReservas().filter(r => r.alumno === yo));
    const aceptadas = mias.filter(r => r.estado === "Aceptada").length;
    const pendientes = mias.filter(r => r.estado === "Pendiente").length;

    if (contadorMisSolicitudes) {
        contadorMisSolicitudes.textContent = `${aceptadas} aceptada(s) · ${pendientes} pendiente(s)`;
    }

    if (mias.length === 0) {
        listaMisSolicitudes.innerHTML = `<p class="solicitudes-vacio">Aún no has solicitado ninguna tutoría.</p>`;
        return;
    }

    const textos = {
        Pendiente: "⏳ Pendiente de respuesta",
        Aceptada: "✅ Aceptada",
        Rechazada: "❌ Rechazada",
        Cancelada: "🚫 Cancelada"
    };

    listaMisSolicitudes.innerHTML = mias.map(r => `
        <article class="solicitud-card ${r.estado.toLowerCase()}">
            <div class="solicitud-info">
                <div class="solicitud-titulo">
                    <strong>${escapeHtml(r.profesor)}</strong>
                    <span class="solicitud-estado ${r.estado.toLowerCase()}">${textos[r.estado] || escapeHtml(r.estado)}</span>
                </div>
                <div class="solicitud-detalle">📅 ${escapeHtml(fechaLegible(r.fecha))} · ⏰ ${escapeHtml(r.horaInicio)} - ${escapeHtml(r.horaFin)}</div>
                <div class="solicitud-detalle">📖 ${escapeHtml(r.asignatura)} · ${escapeHtml(r.modalidad)} · 📍 ${escapeHtml(r.lugar)}</div>
                ${r.motivo ? `<div class="solicitud-motivo">💬 "${escapeHtml(r.motivo)}"</div>` : ""}
                ${r.estado === "Cancelada" && r.canceladaPor === "profesor" ? `<div class="solicitud-detalle">El profesor retiró este horario.</div>` : ""}
            </div>
            ${ESTADOS_ACTIVOS.includes(r.estado) ? `
            <div class="solicitud-acciones">
                <button type="button" class="btn-rechazar" data-accion="cancelar" data-id="${escapeHtml(r.id)}">Cancelar</button>
            </div>` : ""}
        </article>`).join("");
}

// Repinta todo con los datos actuales y limpia la selección si ya no es válida
function refrescarVistaAlumno() {
    poblarSelectorProfesores();

    if (seleccion) {
        const existe = obtenerTramos().some(t => t.id === seleccion.tramoId);
        const ocupada = reservaActiva(seleccion.tramoId, seleccion.fecha, obtenerReservas());
        if (!existe || ocupada) {
            seleccion = null;
            resetMensaje();
        }
    }

    mostrarCalendario();
    renderizarMisSolicitudes();
}

function actualizarSeleccion() {
    resetMensaje();
    mostrarCalendario();
}

document.getElementById("semanaAnterior").addEventListener("click", () => {
    inicioSemana.setDate(inicioSemana.getDate() - 7);
    seleccion = null;
    actualizarSeleccion();
});

document.getElementById("semanaSiguiente").addEventListener("click", () => {
    inicioSemana.setDate(inicioSemana.getDate() + 7);
    seleccion = null;
    actualizarSeleccion();
});

selectorProfesor.addEventListener("change", () => {
    seleccion = null;
    actualizarSeleccion();
});

confirmarReserva.addEventListener("click", () => {
    if (!seleccion) return;

    const resultado = crearReserva({
        tramoId: seleccion.tramoId,
        fecha: seleccion.fecha,
        alumno: nombreAlumno(),
        motivo: motivoReserva ? motivoReserva.value.trim() : ""
    });

    seleccion = null;
    resetMensaje();

    if (!resultado.ok) {
        alert(resultado.error);
    } else {
        if (motivoReserva) motivoReserva.value = "";
        mostrarToast(`✅ Solicitud enviada a ${resultado.reserva.profesor}. Queda pendiente de que la acepte.`);
    }

    refrescarVistaAlumno();
});

if (listaMisSolicitudes) {
    listaMisSolicitudes.addEventListener("click", (e) => {
        const btn = e.target.closest('[data-accion="cancelar"]');
        if (!btn) return;
        if (!confirm("¿Quieres cancelar esta tutoría?")) return;

        cambiarEstadoReserva(btn.dataset.id, "Cancelada", { canceladaPor: "alumno" });
        refrescarVistaAlumno();
    });
}

// iniciarSesion.js lo llama cuando la sesión del alumno ya está creada
function inicializarVistaAlumno() {
    refrescarVistaAlumno();

    suscribirCambios((clave, antiguas, nuevas) => {
        if (clave === STORAGE_KEY_RESERVAS) {
            const yo = nombreAlumno();
            nuevas.filter(r => r.alumno === yo).forEach(r => {
                const previa = antiguas.find(o => o.id === r.id);
                if (!previa || previa.estado === r.estado) return;

                if (r.estado === "Aceptada") mostrarToast(`🎉 ${r.profesor} ha aceptado tu tutoría del ${fechaLegible(r.fecha)}.`);
                if (r.estado === "Rechazada") mostrarToast(`❌ ${r.profesor} ha rechazado tu solicitud del ${fechaLegible(r.fecha)}.`);
                if (r.estado === "Cancelada") mostrarToast(`🚫 Se ha cancelado tu tutoría del ${fechaLegible(r.fecha)}.`);
            });
        }
        refrescarVistaAlumno();
    });
}
