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
