/* =========================================
   QUÍMICA UPDS
   BOTÓN «ATRÁS» DEL CELULAR
   Developed by J. Poma · 2026

   Orden al presionar «atrás»:
   1) Compuestos: si hay una ficha o una lista abierta, vuelve un
      nivel (ficha → lista → clasificaciones).
   2) Tabla periódica: si estás viendo la ficha del elemento (más
      abajo), sube a la tabla principal.
   3) Si no queda nada interno, vuelve a Inicio (la casita roja).
   4) Estando en Inicio, «atrás» sale de la aplicación.

   El botón «Inicio» de la barra inferior va directo a Inicio.
   No modifica app.js: envuelve la función mostrarPagina().
   ========================================= */

(function () {
    "use strict";

    if (typeof window.mostrarPagina !== "function" ||
        !window.history || typeof history.pushState !== "function") {

        return;

    }

    var original = window.mostrarPagina;

    var actual = "inicio";

    /* true cuando se toca «Inicio» en la barra: salta los pasos internos */

    var irDirectoAInicio = false;

    /* La entrada actual del historial es siempre Inicio al abrir la app
       (así un «recargar» estando en otra pestaña no deja estados viejos) */

    try {

        history.replaceState({ pagina: "inicio" }, "", location.href);

    } catch (e) {

        return;

    }


    /* ---------- PASOS INTERNOS DE CADA PESTAÑA ---------- */

    function accionInterna(pagina) {

        if (pagina === "compuestos") {

            /* El botón de flecha «volver» solo existe dentro de una lista
               o de una ficha; en la pantalla de clasificaciones no hay */

            var volver = document.querySelector("#compuestos-app [data-back]");

            if (volver) {

                return function () { volver.click(); };

            }

        }

        if (pagina === "tabla") {

            var tarjeta = document.querySelector("#tabla .tp-tarjeta");

            /* La tabla ya quedó por encima de la pantalla: se está viendo
               la ficha del elemento (o se bajó); se sube a la tabla */

            if (tarjeta && tarjeta.getBoundingClientRect().top < -40) {

                return function () {

                    tarjeta.scrollIntoView({ behavior: "smooth", block: "start" });

                };

            }

        }

        return null;

    }


    /* ---------- NAVEGACIÓN ---------- */

    window.mostrarPagina = function (pagina) {

        if (pagina === "inicio") {

            var estado = history.state && history.state.pagina;

            /* Se toca «Inicio» en la barra: se retrocede en el historial
               para no acumular entradas (popstate muestra Inicio) */

            if (actual !== "inicio" && estado && estado !== "inicio") {

                irDirectoAInicio = true;

                history.back();

                return;

            }

            actual = "inicio";

            original("inicio");

            return;

        }

        try {

            if (actual === "inicio") {

                /* Inicio → otra pestaña: nueva entrada, para que «atrás» vuelva a Inicio */

                history.pushState({ pagina: pagina }, "", location.href);

            } else {

                /* Entre pestañas: se reemplaza, así un solo «atrás» lleva a Inicio */

                history.replaceState({ pagina: pagina }, "", location.href);

            }

        } catch (e) {

            /* sin historial: funciona igual, solo sin el control de «atrás» */

        }

        actual = pagina;

        original(pagina);

    };

    window.addEventListener("popstate", function (ev) {

        var pagina = (ev.state && ev.state.pagina) || "inicio";

        var directo = irDirectoAInicio;

        irDirectoAInicio = false;

        /* «Atrás» desde una pestaña hacia Inicio: antes se revisa si la
           pestaña tiene un paso interno (ficha, lista, tabla principal) */

        if (!directo && pagina === "inicio" && actual !== "inicio") {

            var accion = accionInterna(actual);

            if (accion) {

                try {

                    history.pushState({ pagina: actual }, "", location.href);

                } catch (e) {

                    /* si falla, se sigue a Inicio */

                    actual = "inicio";

                    original("inicio");

                    return;

                }

                accion();

                return;

            }

        }

        actual = pagina;

        original(pagina);

    });

})();
