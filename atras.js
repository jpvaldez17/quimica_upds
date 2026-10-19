/* =========================================
   QUÍMICA UPDS
   BOTÓN «ATRÁS» DEL CELULAR
   Developed by J. Poma · 2026

   - Estando en cualquier pestaña (Tabla, Enlaces, Reacciones,
     Compuestos), «atrás» vuelve a Inicio (la casita roja).
   - Estando en Inicio, «atrás» sale de la aplicación.

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

    /* La entrada actual del historial es siempre Inicio al abrir la app
       (así un «recargar» estando en otra pestaña no deja estados viejos) */

    try {

        history.replaceState({ pagina: "inicio" }, "", location.href);

    } catch (e) {

        return;

    }

    window.mostrarPagina = function (pagina) {

        if (pagina === "inicio") {

            var estado = history.state && history.state.pagina;

            /* Se toca «Inicio» en la barra: se retrocede en el historial
               para no acumular entradas (popstate muestra Inicio) */

            if (actual !== "inicio" && estado && estado !== "inicio") {

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

        actual = pagina;

        original(pagina);

    });

})();
