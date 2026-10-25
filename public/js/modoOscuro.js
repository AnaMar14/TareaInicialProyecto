const boton = document.getElementById("modoOscuro");

function aplicarTema(oscuro) {
  document.body.classList.toggle("oscuro", oscuro);
  boton.textContent = oscuro ? "Modo claro ☀️" : "Modo oscuro ✨";
}

// Al cargar: usa lo guardado o, si no hay nada, la preferencia del sistema
const guardado = localStorage.getItem("tema");
const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
aplicarTema(guardado ? guardado === "oscuro" : prefiereOscuro);

boton.addEventListener("click", () => {
  const oscuro = !document.body.classList.contains("oscuro");
  aplicarTema(oscuro);
  localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
});