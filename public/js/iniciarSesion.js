document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("miModal");
  const btnAbrirModal =
    document.getElementById("iniciarSesion") ||
    document.getElementById("btnAbrirModal");
  const loginForm = document.getElementById("loginForm");

  // Abrir modal al hacer clic en el icono de sesión
  if (btnAbrirModal) {
    btnAbrirModal.addEventListener("click", () => {
      modal.showModal();
    });
  }

  // Simulación de inicio de sesión frontend sin backend
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const usuarioInput = document
        .getElementById("usuario")
        .value.trim()
        .toLowerCase();

      if (usuarioInput.includes("profesor")) {
        //Hacerlo con cookies
        document.cookie = "usuario=" + usuarioInput + ";path=/";
        document.cookie = "rol=profesor" + ";path=/";
        
        window.location.href = "profesor.html";
      } else if (usuarioInput.includes("alumno")) {
        document.cookie = "usuario=" + usuarioInput + ";path=/";
        document.cookie = "rol=alumno" + ";path=/";

        window.location.href = "alumno.html";
      } else {
        alert(
          "Usuario de prueba desconocido. Prueba escribiendo 'profesor' o 'alumno'.",
        );
      }
    });
  }
});
