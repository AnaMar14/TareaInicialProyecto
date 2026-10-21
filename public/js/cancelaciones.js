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