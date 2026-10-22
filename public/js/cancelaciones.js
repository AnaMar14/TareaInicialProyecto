/**
 * El profesor cancela una tutoría por fuerza mayor.
 */

// Cancela una reserva activa y guarda el motivo. Devuelve la reserva o null.
function cancelarTutoriaProfesor(id, motivoCancelacion) {
  const reservas = obtenerReservas();
  const r = reservas.find((x) => x.id === id);
  if (!r || !ESTADOS_ACTIVOS.includes(r.estado)) return null;
  Object.assign(r, {
    estado: "Cancelada",
    canceladaPor: "profesor",
    motivoCancelacion: motivoCancelacion,
    respondida: new Date().toISOString(),
  });
  guardarReservas(reservas);
  return r;
}

// ----- Interfaz del profesor (profesor.html) -----
(function () {
  const lista = document.getElementById("listaSolicitudes");
  const dlg = document.getElementById("dialogCancelar");
  if (!lista || !dlg) return;
  const resumen = document.getElementById("resumenCancelar");
  const motivo = document.getElementById("motivoCancelacion");
  const error = document.getElementById("errorCancelar");
  const btnVolver = document.getElementById("btnVolverCancelar");
  const btnOk = document.getElementById("btnConfirmarCancelar");
  let idActual = null;
  // Abrir el diálogo desde el botón de la tarjeta
  lista.addEventListener("click", (e) => {
    const btn = e.target.closest('[data-accion="cancelar-profesor"]');
    if (!btn) return;
    const r = obtenerReservas().find((x) => x.id === btn.dataset.id);
    if (!r) return;
    idActual = r.id;
    resumen.textContent = `${r.alumno} · ${fechaLegible(r.fecha)} · ${r.horaInicio} - ${r.horaFin}`;
    motivo.value = "";
    error.hidden = true;
    dlg.showModal();
  });
  btnVolver.addEventListener("click", () => dlg.close());
  btnOk.addEventListener("click", () => {
    const texto = motivo.value.trim();
    if (texto.length < 5) {
      error.hidden = false;
      return;
    }
    const antes = localStorage.getItem(STORAGE_KEY_RESERVAS);
    const r = cancelarTutoriaProfesor(idActual, texto);
    dlg.close();
    if (!r) return;
    mostrarToast(
      `\u{1F6AB} Has cancelado la tutoría de ${r.alumno}. Se le avisará con tu motivo.`,
    );
    // El evento "storage" no salta en la pestaña que escribe, así que lo
    // lanzamos a mano para que horarios.js repinte la lista.
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: STORAGE_KEY_RESERVAS,
        oldValue: antes,
        newValue: localStorage.getItem(STORAGE_KEY_RESERVAS),
      }),
    );
  });
})();