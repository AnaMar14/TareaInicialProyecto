/**
 * Dudas obligatorias al reservar (alumno.html)
 * Se engancha al botón con un listener en fase de captura, así
 * calendario.js no necesita ningún cambio.
 */
(function () {
  const motivo = document.getElementById("motivoReserva");
  const contador = document.getElementById("contadorMotivo");
  const boton = document.getElementById("confirmarReserva");
  if (!motivo || !contador || !boton) return;
  const MINIMO = 10;
  function actualizarContador() {
    contador.textContent = `${motivo.value.length} / ${motivo.maxLength}`;
  }
  motivo.addEventListener("input", () => {
    actualizarContador();
    motivo.classList.remove("campo-error");
  });
  // Fase de captura: se ejecuta ANTES que el listener de calendario.js
  boton.addEventListener(
    "click",
    (e) => {
      if (motivo.value.trim().length < MINIMO) {
        e.stopImmediatePropagation(); // bloquea la reserva
        motivo.classList.add("campo-error");
        motivo.focus();
        mostrarToast(
          `\u270D Cuéntale al profesor tus dudas (mínimo ${MINIMO} caracteres).`,
        );
      }
    },
    true,
  );
  // Tras reservar, calendario.js vacía el campo: reiniciamos el contador
  boton.addEventListener("click", () => setTimeout(actualizarContador, 0));
})();
