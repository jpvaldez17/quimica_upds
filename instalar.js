/* =========================================
   QUÍMICA UPDS
   BOTÓN «INSTALAR»
   Developed by J. Poma · 2026

   - Chrome / Edge / Android: abre el cuadro oficial de
     instalación al tocar el botón.
   - Si el navegador no lo permite (por ejemplo iPhone),
     muestra cómo instalar a mano.
   - Se oculta solo cuando la app ya está instalada.
   ========================================= */

(function () {
    "use strict";

    var boton = document.getElementById("btn-instalar");

    if (!boton) { return; }

    var invitacion = null;   /* evento beforeinstallprompt guardado */

    function yaInstalada() {

        return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
               window.navigator.standalone === true;

    }

    function ocultar() {

        boton.hidden = true;

    }

    if (yaInstalada()) {

        ocultar();
        return;

    }

    window.addEventListener("beforeinstallprompt", function (ev) {

        ev.preventDefault();
        invitacion = ev;

    });

    window.addEventListener("appinstalled", function () {

        invitacion = null;
        ocultar();

    });

    /* ---------- AVISO CON INSTRUCCIONES ---------- */

    function mostrarAyuda() {

        var esIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

        var texto = esIOS
            ? "Toca el botón Compartir del navegador y elige «Agregar a pantalla de inicio»."
            : "Abre el menú del navegador (⋮) y elige «Instalar app» o «Agregar a pantalla de inicio».";

        var fondo = document.createElement("div");

        fondo.className = "inst-fondo";

        fondo.innerHTML =
            '<div class="inst-caja" role="dialog" aria-modal="true">' +
            "<h3>Instalar QuímicApp</h3>" +
            "<p>" + texto + "</p>" +
            '<button type="button" class="inst-ok">Entendido</button>' +
            "</div>";

        function cerrar() {

            if (fondo.parentNode) { fondo.parentNode.removeChild(fondo); }

        }

        fondo.addEventListener("click", function (ev) {

            if (ev.target === fondo || ev.target.classList.contains("inst-ok")) {

                cerrar();

            }

        });

        document.body.appendChild(fondo);

    }

    /* ---------- CLIC ---------- */

    boton.addEventListener("click", function () {

        if (!invitacion) {

            mostrarAyuda();
            return;

        }

        var ev = invitacion;

        invitacion = null;

        ev.prompt();

        ev.userChoice.then(function (r) {

            if (r && r.outcome === "accepted") { ocultar(); }

        }).catch(function () {});

    });

})();
