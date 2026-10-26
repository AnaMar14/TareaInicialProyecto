const boton = document.getElementById("modoOscuro");

boton.addEventListener("click", () => {
  const oscuro = document.documentElement.classList.toggle("oscuro");
  localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
});

window.addEventListener("load", () => {
  document.documentElement.classList.add("con-transicion");
});