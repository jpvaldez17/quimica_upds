/* =========================================
   QUÍMICA UPDS
   BUSCADOR GLOBAL DE INICIO
   Developed by J. Poma · 2026

   Lo que hace:
   - Escribes "litio" → te lleva a la Tabla periódica
     y baja directo a la ficha técnica del elemento.
   - Escribes "gasolina", "H2SO4"... → abre la ficha
     del compuesto en la pestaña Compuestos.
   - Mientras escribes muestra sugerencias (Elemento /
     Compuesto). Enter abre la primera.

   No modifica tabla.js ni los archivos de Compuestos:
   solo usa lo que ya existe (las celdas de la tabla y
   window.Compuestos.abrir). Funciona sin internet.
   ========================================= */

(function () {
    "use strict";

    /* ---------- AJUSTES ---------- */

    var MAX_SUGERENCIAS = 6;

    /* Si un nombre coincide EXACTAMENTE con un elemento y con un
       compuesto (ej. "nitrógeno"), ¿cuál va primero?
       true  → el compuesto (como pediste)
       false → el elemento */
    var EMPATE_COMPUESTO_PRIMERO = true;

    /* ---------- UTILIDADES ---------- */

    /* Sin tildes, minúsculas, y subíndices → dígitos (H₂SO₄ → h2so4).
       Igual que el buscador de Compuestos. */
    function norm(s) {
        return String(s == null ? "" : s)
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[\u2080-\u2089]/g, function (c) {
                return String(c.charCodeAt(0) - 8320);
            })
            .trim();
    }

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    /* ---------- DATOS ---------- */

    /* Los elementos se leen de las celdas que ya dibuja tabla.js:
       <button class="tp-cell" data-z="3"><small>3</small><b>Li</b><em>Litio</em> */
    function leerElementos() {
        var lista = [];
        var celdas = document.querySelectorAll("#tp-grid .tp-cell");

        for (var i = 0; i < celdas.length; i++) {
            var c = celdas[i];
            var b = c.querySelector("b");
            var em = c.querySelector("em");

            lista.push({
                z: parseInt(c.getAttribute("data-z"), 10),
                s: b ? b.textContent : "",
                n: em ? em.textContent : "",
                celda: c
            });
        }

        return lista;
    }

    function leerCompuestos() {
        return Array.isArray(window.CMP_DATOS) ? window.CMP_DATOS : [];
    }

    /* ---------- COINCIDENCIAS ---------- */

    /* Puntaje: menor = mejor.
       0 exacto · 1 empieza igual · 2 fórmula empieza · 3 contiene · 4 en otros nombres/etiquetas */

    function puntajeElemento(e, q) {
        var nombre = norm(e.n);
        var simbolo = norm(e.s);

        if (/^\d+$/.test(q)) {
            return parseInt(q, 10) === e.z ? 0 : -1;
        }

        if (nombre === q) { return 0; }
        if (q.length <= 2 && simbolo === q) { return 0; }
        if (q.length >= 2 && nombre.indexOf(q) === 0) { return 1; }
        if (q.length >= 3 && nombre.indexOf(q) > 0) { return 3; }

        return -1;
    }

    function puntajeCompuesto(c, q) {
        var nombre = norm(c.nombre);
        var formula = norm(c.formula);

        if (nombre === q || formula === q) { return 0; }
        if (nombre.indexOf(q) === 0) { return 1; }
        if (formula.indexOf(q) === 0) { return 2; }
        if (nombre.indexOf(q) > 0) { return 3; }

        var otros = norm([c.otros, (c.tags || []).join(" ")].join(" "));
        if (otros.indexOf(q) !== -1) { return 4; }

        return -1;
    }

    function coincidencias(consulta, elementos, compuestos) {
        var q = norm(consulta);
        var res = [];
        var i, p;

        if (!q) { return res; }

        for (i = 0; i < elementos.length; i++) {
            p = puntajeElemento(elementos[i], q);
            if (p >= 0) {
                res.push({ tipo: "elemento", p: p, i: i, dato: elementos[i] });
            }
        }

        for (i = 0; i < compuestos.length; i++) {
            p = puntajeCompuesto(compuestos[i], q);
            if (p >= 0) {
                res.push({ tipo: "compuesto", p: p, i: i, dato: compuestos[i] });
            }
        }

        function rango(x) {
            var esCompuesto = x.tipo === "compuesto";
            return EMPATE_COMPUESTO_PRIMERO ? (esCompuesto ? 0 : 1) : (esCompuesto ? 1 : 0);
        }

        res.sort(function (a, b) {
            return a.p - b.p || rango(a) - rango(b) || a.i - b.i;
        });

        return res.slice(0, MAX_SUGERENCIAS);
    }

    /* Para pruebas en Node (no afecta al navegador) */
    if (typeof module !== "undefined" && module.exports) {
        module.exports = { norm: norm, coincidencias: coincidencias };
    }

    if (typeof document === "undefined") { return; }

    /* ---------- NAVEGACIÓN ---------- */

    function irAElemento(e) {
        var grid = document.getElementById("tp-grid");
        var pagina = grid ? grid.closest(".app-page") : null;

        if (!pagina || !e.celda) { return; }

        window.mostrarPagina(pagina.id);

        /* Esperar a que la pestaña esté visible; luego el clic de la
           celda hace exactamente lo mismo que tocar el elemento en la
           tabla: lo selecciona y baja a su ficha técnica. */
        setTimeout(function () {
            e.celda.click();
        }, 80);
    }

    function irACompuesto(c) {
        if (window.Compuestos && typeof window.Compuestos.abrir === "function") {
            window.Compuestos.abrir(c.id);
        } else {
            window.mostrarPagina("compuestos");
        }
    }

    function abrir(item) {
        if (item.tipo === "elemento") {
            irAElemento(item.dato);
        } else {
            irACompuesto(item.dato);
        }
    }

    /* ---------- ESTILOS (propios, no tocan style.css) ---------- */

    function inyectarEstilos() {
        if (document.getElementById("bq-estilos")) { return; }

        var css =
            ".bq-lista{position:fixed;z-index:1000;margin:0;padding:6px;list-style:none;" +
            "background:#121417;border:1px solid #2a2f36;border-radius:16px;" +
            "box-shadow:0 12px 28px rgba(0,0,0,.35);max-height:60vh;overflow-y:auto}" +
            ".bq-lista[hidden]{display:none}" +
            ".bq-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;" +
            "background:transparent;border:0;border-radius:12px;color:#fff;font:inherit;" +
            "text-align:left;cursor:pointer}" +
            ".bq-item:hover,.bq-item.bq-activo{background:#1f2933}" +
            ".bq-tag{flex:none;padding:3px 8px;border-radius:999px;font-size:.68rem;" +
            "font-weight:700;letter-spacing:.02em;color:#fff}" +
            ".bq-tag.bq-el{background:#1e88e5}" +
            ".bq-tag.bq-cp{background:#8d6e63}" +
            ".bq-nom{flex:1;min-width:0;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
            ".bq-sub{flex:none;color:#9aa5b1;font-size:.82rem}" +
            ".bq-vacio{padding:12px;color:#9aa5b1;font-size:.9rem}";

        var st = document.createElement("style");
        st.id = "bq-estilos";
        st.textContent = css;
        document.head.appendChild(st);
    }

    /* ---------- INTERFAZ ---------- */

    function iniciar() {
        var campo = document.querySelector("#inicio input");

        if (!campo) {
            console.warn("busqueda.js: no se encontró el campo de búsqueda dentro de #inicio.");
            return;
        }

        inyectarEstilos();

        campo.setAttribute("autocomplete", "off");
        campo.setAttribute("enterkeyhint", "search");

        var lista = document.createElement("ul");
        lista.className = "bq-lista";
        lista.hidden = true;
        lista.setAttribute("role", "listbox");
        document.body.appendChild(lista);

        var actuales = [];
        var activo = -1;

        function ubicar() {
            var barra = campo.closest(".search-box") || campo.parentElement || campo;
            var r = barra.getBoundingClientRect();

            lista.style.left = r.left + "px";
            lista.style.width = r.width + "px";
            lista.style.top = (r.bottom + 6) + "px";
        }

        function ocultar() {
            lista.hidden = true;
            activo = -1;
        }

        function marcarActivo() {
            var items = lista.querySelectorAll(".bq-item");

            for (var i = 0; i < items.length; i++) {
                items[i].classList.toggle("bq-activo", i === activo);
            }
        }

        function elegir(item) {
            ocultar();
            campo.blur();
            abrir(item);
        }

        function pintar(mostrarVacio) {
            var q = campo.value;

            actuales = coincidencias(q, leerElementos(), leerCompuestos());
            activo = -1;

            if (!norm(q)) {
                ocultar();
                return;
            }

            if (actuales.length === 0) {
                if (!mostrarVacio) {
                    ocultar();
                    return;
                }

                lista.innerHTML = '<li class="bq-vacio">Sin resultados para «' + esc(q.trim()) + '».</li>';
            } else {
                lista.innerHTML = actuales.map(function (it, n) {
                    var d = it.dato;
                    var esEl = it.tipo === "elemento";
                    var nombre = esEl ? d.n : d.nombre;
                    var sub = esEl ? d.s + " · Z " + d.z : (d.formula || "");

                    return '<li role="option"><button type="button" class="bq-item" data-n="' + n + '">' +
                        '<span class="bq-tag ' + (esEl ? "bq-el" : "bq-cp") + '">' +
                        (esEl ? "Elemento" : "Compuesto") + "</span>" +
                        '<span class="bq-nom">' + esc(nombre) + "</span>" +
                        '<span class="bq-sub">' + esc(sub) + "</span></button></li>";
                }).join("");
            }

            ubicar();
            lista.hidden = false;
        }

        campo.addEventListener("input", function () {
            pintar(false);
        });

        campo.addEventListener("focus", function () {
            if (norm(campo.value)) { pintar(false); }
        });

        campo.addEventListener("keydown", function (ev) {
            if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
                if (!actuales.length) { return; }

                ev.preventDefault();
                activo += ev.key === "ArrowDown" ? 1 : -1;

                if (activo < 0) { activo = actuales.length - 1; }
                if (activo >= actuales.length) { activo = 0; }

                marcarActivo();
                return;
            }

            if (ev.key === "Escape") {
                ocultar();
                return;
            }

            if (ev.key === "Enter") {
                ev.preventDefault();   /* evita que un <form> recargue la página */

                pintar(true);

                if (actuales.length) {
                    elegir(actuales[activo >= 0 ? activo : 0]);
                }
            }
        });

        lista.addEventListener("click", function (ev) {
            var b = ev.target.closest(".bq-item");

            if (b) {
                elegir(actuales[parseInt(b.getAttribute("data-n"), 10)]);
            }
        });

        document.addEventListener("click", function (ev) {
            if (ev.target !== campo && !lista.contains(ev.target)) {
                ocultar();
            }
        });

        window.addEventListener("resize", function () {
            if (!lista.hidden) { ubicar(); }
        });

        window.addEventListener("scroll", function () {
            if (!lista.hidden) { ubicar(); }
        }, { passive: true });
    }

    /* Se inicia después de que tabla.js haya dibujado la tabla */

    window.addEventListener("load", iniciar);

})();
