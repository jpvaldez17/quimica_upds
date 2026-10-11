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
   Cada día se muestra un compuesto distinto
   (tomado de compuestosinformacion.js) y el
   botón «Más información» abre su ficha.
   ========================================= */

/* Generador pseudoaleatorio con semilla fija:
   el orden "mezclado" es siempre el mismo,
   así todos los usuarios ven el mismo dato cada día */

function generadorConSemilla(semilla) {

    return function() {

        semilla |= 0;
        semilla = (semilla + 0x6D2B79F5) | 0;

        let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);

        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;

    };

}


/* Elige el compuesto del día:
   - cambia a la medianoche (hora local)
   - recorre los 200 compuestos sin repetir
     hasta completar el ciclo */

function elegirCompuestoDelDia(lista, fecha) {

    const hoy = fecha || new Date();

    const numeroDeDia = Math.floor(
        Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) / 86400000
    );

    const orden = lista.map(function(_, i) { return i; });

    const azar = generadorConSemilla(2026);

    for (let i = orden.length - 1; i > 0; i--) {

        const j = Math.floor(azar() * (i + 1));

        const temporal = orden[i];
        orden[i] = orden[j];
        orden[j] = temporal;

    }

    return lista[orden[numeroDeDia % orden.length]];

}


/* Pinta el compuesto en la tarjeta de Inicio */

function pintarDatoDelDia(compuesto) {

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

            if (window.Compuestos && typeof window.Compuestos.abrir === "function") {

                window.Compuestos.abrir(compuesto.id);

            } else {

                mostrarPagina("compuestos");

            }

        };

    }

}


/* Espera a que compuestosinformacion.js esté cargado
   (lo carga compuestos.js) y luego pinta el dato.
   Si tarda o falla, se deja el texto que ya trae el HTML. */

function iniciarDatoDelDia() {

    let intentos = 0;

    function revisar() {

        const lista = window.CMP_DATOS;

        if (Array.isArray(lista) && lista.length > 0) {

            pintarDatoDelDia(elegirCompuestoDelDia(lista));

            return;

        }

        intentos++;

        if (intentos < 50) {

            setTimeout(revisar, 200);

        }

    }

    revisar();

}
