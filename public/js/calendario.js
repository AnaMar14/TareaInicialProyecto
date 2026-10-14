
const cabeceraDias = document.getElementById("cabeceraDias");
const horariosCalendario = document.getElementById("horariosCalendario");
const tituloSemana = document.getElementById("tituloSemana");
const selectorProfesor = document.getElementById("profesor");
const mensajeSeleccion = document.getElementById("mensajeSeleccion");
const confirmarReserva = document.getElementById("confirmarReserva");

const horas = ["09:00", "10:00", "11:00", "12:00", "16:00", "17:00"];

let inicioSemana = new Date();
inicioSemana.setHours(0, 0, 0, 0);

const diaSemana = (inicioSemana.getDay() + 6) % 7;
inicioSemana.setDate(inicioSemana.getDate() - diaSemana);

let seleccion = null;

// Datos ficticios para probar la interfaz.
// En producción deberán proceder del servidor.
const disponibilidad = {
    garcia: {
        "2026-10-12": ["09:00", "11:00", "16:00"],
        "2026-10-13": ["10:00", "12:00"],
        "2026-10-15": ["09:00", "10:00", "17:00"]
    },
    lopez: {
        "2026-10-12": ["10:00", "12:00"],
        "2026-10-14": ["09:00", "11:00", "16:00"],
        "2026-10-15": ["11:00", "12:00", "16:00"]
    },
    martinez: {
        "2026-10-13": ["09:00", "11:00"],
        "2026-10-14": ["10:00", "12:00"],
        "2026-10-16": ["09:00", "16:00", "17:00"]
    }
};

const nombresProfesores = {
    garcia: "Prof. García",
    lopez: "Prof. López",
    martinez: "Prof. Martínez"
};

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

function mostrarCalendario() {
    cabeceraDias.innerHTML = "";
    horariosCalendario.innerHTML = "";

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dias = [];

    for (let i = 0; i < 5; i++) {
        dias.push(obtenerFecha(i));
    }

    const inicio = dias[0];
    const fin = dias[4];

    tituloSemana.textContent =
        `${inicio.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short"
        })} - ${fin.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric"
        })}`;

    const filaCabecera = document.createElement("tr");
    const celdaHora = document.createElement("th");

    celdaHora.textContent = "Hora";
    filaCabecera.appendChild(celdaHora);

    dias.forEach(fecha => {
        const th = document.createElement("th");

        th.textContent = fecha.toLocaleDateString("es-ES", {
            weekday: "short",
            day: "numeric"
        });

        filaCabecera.appendChild(th);
    });

    cabeceraDias.appendChild(filaCabecera);

    horas.forEach(hora => {
        const fila = document.createElement("tr");
        const celdaHora = document.createElement("td");

        celdaHora.textContent = hora;
        fila.appendChild(celdaHora);

        dias.forEach(fecha => {
            const celda = document.createElement("td");
            const boton = document.createElement("button");

            boton.type = "button";

            const fechaTexto = formatoFecha(fecha);
            const profesorSeleccionado = selectorProfesor.value;

            const profesores = Object.keys(disponibilidad).filter(profesor => {
                const coincideProfesor =
                    profesorSeleccionado === "todos" ||
                    profesor === profesorSeleccionado;

                const estaLibre =
                    disponibilidad[profesor][fechaTexto]?.includes(hora);

                return coincideProfesor && estaLibre;
            });

            const fechaPasada = fecha < hoy;

            if (fechaPasada || profesores.length === 0) {
                boton.textContent = fechaPasada ? "No disponible" : "Ocupado";
                boton.className = "hueco ocupado";
                boton.disabled = true;
            } else {
                const profesor = profesores[0];

                boton.textContent = profesorSeleccionado === "todos"
                    ? `${nombresProfesores[profesor]}`
                    : "Disponible";

                boton.className = "hueco";

                if (
                    seleccion &&
                    seleccion.fecha === fechaTexto &&
                    seleccion.hora === hora &&
                    seleccion.profesor === profesor
                ) {
                    boton.classList.add("elegido");
                }

                boton.addEventListener("click", () => {
                    seleccion = {
                        fecha: fechaTexto,
                        hora: hora,
                        profesor: profesor
                    };

                    mensajeSeleccion.textContent =
                        `${fecha.toLocaleDateString("es-ES")} a las ${hora} ` +
                        `con ${nombresProfesores[profesor]}.`;

                    confirmarReserva.disabled = false;
                    mostrarCalendario();
                });
            }

            celda.appendChild(boton);
            fila.appendChild(celda);
        });

        horariosCalendario.appendChild(fila);
    });
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

function actualizarSeleccion() {
    mensajeSeleccion.textContent =
        "Selecciona un horario disponible del calendario.";

    confirmarReserva.disabled = true;
    mostrarCalendario();
}

confirmarReserva.addEventListener("click", () => {
    if (!seleccion) return;

    alert(
        `Has seleccionado una tutoría el ${seleccion.fecha} ` +
        `a las ${seleccion.hora} con ` +
        `${nombresProfesores[seleccion.profesor]}.`
    );
});

mostrarCalendario();
