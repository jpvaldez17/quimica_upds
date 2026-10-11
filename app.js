/* =========================================
   QUÍMICA UPDS
   SISTEMA DE NAVEGACIÓN
   Developed by J. Poma · 2026
   ========================================= */


/* =========================================
   FUNCIÓN PRINCIPAL DE NAVEGACIÓN
   ========================================= */

function mostrarPagina(pagina) {

    /* Ocultar todas las páginas */

    const paginas = document.querySelectorAll(".app-page");

    paginas.forEach(function(elemento) {

        elemento.style.display = "none";

    });


    /* Mostrar la página seleccionada */

    const paginaSeleccionada = document.getElementById(pagina);

    if (paginaSeleccionada) {

        paginaSeleccionada.style.display = "block";

    }


    /* Quitar estado activo de todos los botones */

    const botones = document.querySelectorAll(".nav-item");

    botones.forEach(function(boton) {

        boton.classList.remove("active");

    });


    /* Activar el botón correspondiente */

    const botonActivo = document.querySelector(
        '.nav-item[data-page="' + pagina + '"]'
    );


    if (botonActivo) {

        botonActivo.classList.add("active");

    }


    /* Volver arriba */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    /* Si se fue de Inicio, el Desafío rápido cambia de pregunta
       (solo si ya había sido respondida) */

    if (pagina !== "inicio" && window.Desafios) {

        window.Desafios.alSalirDeInicio();

    }

}


/* =========================================
   INICIAR APLICACIÓN
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

    mostrarPagina("inicio");

    iniciarDesafio();

    iniciarDatoDelDia();

});


/* =========================================
   DESAFÍO RÁPIDO DEL DÍA
   Verde si acierta, rojo si se equivoca
   ========================================= */

function iniciarDesafio() {

    /* Con desafios.js: banco de preguntas, contador y cambio de pregunta */

    if (window.Desafios) {

        window.Desafios.iniciar();

        return;

    }

    /* Respaldo: si desafios.js no está, funciona la pregunta fija del HTML */

    const tarjeta = document.querySelector(".challenge-card");

    if (!tarjeta) {

        return;

    }

    const botones = tarjeta.querySelectorAll(".answer-buttons button");

    const resultado = tarjeta.querySelector(".challenge-result");

    let respondido = false;


    botones.forEach(function(boton) {

        boton.addEventListener("click", function() {

            if (respondido) {

                return;

            }

            respondido = true;


            const acerto = boton.hasAttribute("data-correcta");

            boton.classList.add(acerto ? "correcta" : "incorrecta");


            /* Si falla, se muestra cuál era la correcta */

            if (!acerto) {

                botones.forEach(function(otro) {

                    if (otro.hasAttribute("data-correcta")) {

                        otro.classList.add("correcta");

                    }

                });

            }


            botones.forEach(function(otro) {

                otro.disabled = true;

            });


            if (resultado) {

                const titulo = acerto
                    ? '<strong class="ok">¡Correcto!</strong> '
                    : '<strong class="no">Incorrecto.</strong> ';

                resultado.innerHTML = titulo + (resultado.getAttribute("data-explicacion") || "");

                resultado.hidden = false;

            }

        });

    });

}


/* =========================================
   DATO DEL DÍA
   Conectado con la pestaña Compuestos.
   Funciona sin internet: usa el reloj del
   dispositivo y los datos locales de
   compuestosinformacion.js.

   El dato cambia:
   1) cada cierto número de horas (HORAS_POR_DATO)
   2) cuando la persona toca «Más información»
      (al volver a Inicio ya hay otro dato)

   El compuesto nunca se repite hasta haber
   recorrido todos los de la lista.
   ========================================= */

/* Cada cuántas horas cambia el dato (4, 6, 12, 24...) */

const HORAS_POR_DATO = 4;

const CLAVE_ADELANTO = "quimica_upds_dato_adelanto";


/* Generador pseudoaleatorio con semilla fija:
   el orden "mezclado" es siempre el mismo */

function generadorConSemilla(semilla) {

    return function() {

        semilla |= 0;
        semilla = (semilla + 0x6D2B79F5) | 0;

        let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);

        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;

    };

}


/* Orden mezclado (siempre el mismo) de todos los compuestos */

function mezclarCompuestos(cantidad) {

    const orden = [];

    for (let i = 0; i < cantidad; i++) {

        orden.push(i);

    }

    const azar = generadorConSemilla(2026);

    for (let i = orden.length - 1; i > 0; i--) {

        const j = Math.floor(azar() * (i + 1));

        const temporal = orden[i];
        orden[i] = orden[j];
        orden[j] = temporal;

    }

    return orden;

}


/* Cuántos datos se han "adelantado" tocando «Más información».
   Solo crece, así no se repite un compuesto ya visto. */

function leerAdelanto() {

    try {

        return parseInt(localStorage.getItem(CLAVE_ADELANTO), 10) || 0;

    } catch (e) {

        return 0;

    }

}

let adelantoEnMemoria = leerAdelanto();

function sumarAdelanto() {

    adelantoEnMemoria++;

    try {

        localStorage.setItem(CLAVE_ADELANTO, String(adelantoEnMemoria));

    } catch (e) {

        /* sin almacenamiento: se queda solo en memoria */

    }

}


/* Posición del compuesto actual dentro del orden mezclado:
   bloque de horas actual (hora local) + adelantos */

function indiceDelDato(cantidad, fecha) {

    const ahora = fecha || new Date();

    const milisegundosLocales =
        ahora.getTime() - ahora.getTimezoneOffset() * 60000;

    const bloque = Math.floor(
        milisegundosLocales / (HORAS_POR_DATO * 3600000)
    );

    return (bloque + adelantoEnMemoria) % cantidad;

}


/* Pinta el compuesto en la tarjeta de Inicio */

function pintarDatoDelDia(compuesto, alTocarBoton) {

    const tarjeta = document.querySelector(".daily-card");

    if (!tarjeta || !compuesto) {

        return;

    }

    const titulo = tarjeta.querySelector("h3");
    const texto = tarjeta.querySelector("p");
    const boton = tarjeta.querySelector(".outline-red");

    if (titulo) {

        titulo.textContent = compuesto.nombre + " (" + compuesto.formula + ")";

    }

    if (texto) {

        texto.textContent = compuesto.curio || compuesto.desc || "";

    }

    if (boton) {

        boton.setAttribute(
            "aria-label",
            "Más información sobre " + compuesto.nombre
        );

        boton.onclick = function() {

            /* 1. Abrir la ficha del compuesto mostrado */

            if (window.Compuestos && typeof window.Compuestos.abrir === "function") {

                window.Compuestos.abrir(compuesto.id);

            } else {

                mostrarPagina("compuestos");

            }

            /* 2. Pasar al siguiente dato para cuando vuelva a Inicio */

            if (alTocarBoton) {

                alTocarBoton();

            }

        };

    }

}


/* Espera a que compuestosinformacion.js esté cargado
   (lo carga compuestos.js), pinta el dato y lo
   mantiene al día mientras la app está abierta.
   Si los datos fallan, se deja el texto del HTML. */

function iniciarDatoDelDia() {

    let intentos = 0;

    function arrancar() {

        const lista = window.CMP_DATOS;

        if (!Array.isArray(lista) || lista.length === 0) {

            intentos++;

            if (intentos < 50) {

                setTimeout(arrancar, 200);

            }

            return;

        }

        const orden = mezclarCompuestos(lista.length);

        let mostrado = -1;

        function actualizar() {

            const indice = indiceDelDato(lista.length);

            if (indice === mostrado) {

                return;

            }

            mostrado = indice;

            pintarDatoDelDia(lista[orden[indice]], function() {

                sumarAdelanto();

                actualizar();

            });

        }

        actualizar();

        /* Si la app queda abierta, revisa cada minuto si ya
           toca cambiar de dato por el paso de las horas */

        setInterval(actualizar, 60000);

        document.addEventListener("visibilitychange", function() {

            if (!document.hidden) {

                actualizar();

            }

        });

    }

    arrancar();

}
