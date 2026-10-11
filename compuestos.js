/* =========================================================
   COMPUESTOS · Química UPDS  (versión de prueba · 5 fichas)
   - Sin imágenes: todo es texto, CSS y Font Awesome
   - Pantallas: clasificaciones → lista → ficha
   - Más adelante los datos se separan por categoría
     (acidos.js, bases.js...) y se cargan solo al abrir
   ========================================================= */
(function () {
    'use strict';

    var root = document.getElementById('compuestos-app');
    if (!root) return;

    /* ---------------------------------------------------------
       1) CLASIFICACIONES (icono + color + cantidad planeada)
       --------------------------------------------------------- */
    var CATS = [
        { id: 'acidos',       nombre: 'Ácidos',                  icono: 'fa-vial',           color: '#e53935', total: 20 },
        { id: 'bases',        nombre: 'Bases',                   icono: 'fa-flask',          color: '#1e88e5', total: 12 },
        { id: 'sales',        nombre: 'Sales',                   icono: 'fa-cubes',          color: '#00acc1', total: 14 },
        { id: 'oxidos',       nombre: 'Óxidos',                  icono: 'fa-layer-group',    color: '#8d6e63', total: 12 },
        { id: 'gases',        nombre: 'Gases industriales',      icono: 'fa-wind',           color: '#78909c', total: 14 },
        { id: 'solventes',    nombre: 'Solventes y orgánicos',   icono: 'fa-bottle-droplet', color: '#fb8c00', total: 31 },
        { id: 'combustibles', nombre: 'Combustibles y explosivos', icono: 'fa-gas-pump',     color: '#bf360c', total: 16 },
        { id: 'limpieza',     nombre: 'Limpieza y hogar',        icono: 'fa-broom',          color: '#00897b', total: 18 },
        { id: 'agro',         nombre: 'Agro y fertilizantes',    icono: 'fa-seedling',       color: '#43a047', total: 12 },
        { id: 'alimentos',    nombre: 'Alimentos y aditivos',    icono: 'fa-utensils',       color: '#f9a825', total: 14 },
        { id: 'laboratorio',  nombre: 'Laboratorio y farmacia',  icono: 'fa-pills',          color: '#5e35b1', total: 15 },
        { id: 'plasticos',    nombre: 'Plásticos y polímeros',   icono: 'fa-recycle',        color: '#3949ab', total: 10 },
        { id: 'mineria',      nombre: 'Minería',                 icono: 'fa-gem',            color: '#455a64', total: 12 }
    ];

    /* Áreas de uso (filtros) */
    var AREAS = [
        { id: 'hogar',        nombre: 'Hogar',        icono: 'fa-house' },
        { id: 'laboratorio',  nombre: 'Laboratorio',  icono: 'fa-microscope' },
        { id: 'industria',    nombre: 'Industria',    icono: 'fa-industry' },
        { id: 'agro',         nombre: 'Agro',         icono: 'fa-tractor' },
        { id: 'salud',        nombre: 'Salud',        icono: 'fa-kit-medical' },
        { id: 'alimentacion', nombre: 'Alimentación', icono: 'fa-bowl-food' }
    ];

    /* ---------------------------------------------------------
       2) DATOS: todo viene de UN solo archivo, compuestosinformacion.js
          (se carga solo; no hay que tocar index.html)
       --------------------------------------------------------- */
    var DATA = [];
    var cargando = true;

    function datosListos() {
        DATA = window.CMP_DATOS || [];
        cargando = false;
        pintar();
    }

    if (window.CMP_DATOS) {
        DATA = window.CMP_DATOS;   // ya estaba cargado (por una etiqueta script)
        cargando = false;
    } else {
        var VER = '1';
        try {
            var csr = document.currentScript;
            var mv = csr && /[?&]v=([^&]+)/.exec(csr.src);
            if (mv) VER = mv[1];   // usa el mismo ?v= de compuestos.js
        } catch (e) { /* sin versión: se usa 1 */ }
        var sd = document.createElement('script');
        sd.src = 'compuestosinformacion.js?v=' + VER;
        sd.async = true;
        sd.onload = datosListos;
        sd.onerror = datosListos;   // si falla, se muestra vacío
        document.head.appendChild(sd);
    }

    /* ---------------------------------------------------------
       3) UTILIDADES
       --------------------------------------------------------- */
    var FAV_KEY = 'quimica_upds_favoritos';

    function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[\u2080-\u2089]/g, function (c) { return String(c.charCodeAt(0) - 8320); });  // H₂SO₄ → h2so4
    }
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
    function porId(lista, id) {
        for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i];
        return null;
    }
    function leerFavs() {
        try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); }
        catch (e) { return new Set(); }
    }
    function guardarFavs() {
        try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(state.favs))); }
        catch (e) { /* sin almacenamiento: se ignora */ }
    }

    var state = {
        cat: null, area: null, q: '', id: null,
        soloFavs: false, favs: leerFavs(), scrollLista: 0
    };

    /* ---------------------------------------------------------
       4) ESQUELETO (se crea una sola vez; el buscador no pierde foco)
       --------------------------------------------------------- */
    root.classList.add('cmp-app');
    root.innerHTML =
        '<div class="cmp-toolbar" id="cmp-toolbar">' +
            '<div class="cmp-search">' +
                '<i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>' +
                '<input id="cmp-q" type="search" placeholder="Buscar por nombre o fórmula..." autocomplete="off" aria-label="Buscar compuesto">' +
                '<button type="button" class="cmp-filtro-btn" id="cmp-filtro-btn" data-filtro="1" aria-label="Filtrar por uso" aria-expanded="false" aria-controls="cmp-filtros">' +
                    '<i class="fa-solid fa-sliders" aria-hidden="true"></i></button>' +
            '</div>' +
            '<div class="cmp-filtros" id="cmp-filtros" hidden>' +
                '<b>Filtrar por uso</b>' +
                '<div class="cmp-chips" id="cmp-chips"></div>' +
            '</div>' +
        '</div>' +
        '<div id="cmp-body"></div>';

    var elToolbar = root.querySelector('#cmp-toolbar');
    var elChips = root.querySelector('#cmp-chips');
    var elFiltros = root.querySelector('#cmp-filtros');
    var elFiltroBtn = root.querySelector('#cmp-filtro-btn');
    var elBody = root.querySelector('#cmp-body');
    var elQ = root.querySelector('#cmp-q');

    function hayFiltroUso() { return !!(state.area || state.soloFavs); }
    function abrirPanel(si) {
        elFiltros.hidden = !si;
        elFiltroBtn.setAttribute('aria-expanded', String(si));
    }

    /* ---------------------------------------------------------
       5) FILTRADO
       --------------------------------------------------------- */
    function filtrados() {
        var q = norm(state.q).trim();
        var lista = DATA.filter(function (c) {
            if (state.cat && c.cat !== state.cat) return false;
            if (state.area && c.areas.indexOf(state.area) < 0) return false;
            if (state.soloFavs && !state.favs.has(c.id)) return false;
            if (q) {
                var pajar = norm([c.nombre, c.formula, c.otros, (c.tags || []).join(' ')].join(' '));
                if (pajar.indexOf(q) < 0) return false;
            }
            return true;
        });
        if (q) {
            // lo más parecido primero: nombre exacto → nombre que empieza → fórmula → nombre que contiene → resto
            var puntos = function (c) {
                var n = norm(c.nombre), f = norm(c.formula);
                if (n === q || f === q) return 0;
                if (n.indexOf(q) === 0) return 1;
                if (f.indexOf(q) === 0) return 2;
                if (n.indexOf(q) > 0) return 3;
                return 4;
            };
            lista = lista.map(function (c, i) { return { c: c, p: puntos(c), i: i }; })
                         .sort(function (a, b) { return a.p - b.p || a.i - b.i; })
                         .map(function (x) { return x.c; });
        }
        return lista;
    }

    /* ---------------------------------------------------------
       6) PINTAR
       --------------------------------------------------------- */
    function pintarChips() {
        var h = '<button class="cmp-chip" data-favs="1" aria-pressed="' + state.soloFavs + '">' +
                '<i class="fa-solid fa-star" aria-hidden="true"></i>Favoritos</button>';
        AREAS.forEach(function (a) {
            h += '<button class="cmp-chip" data-area="' + a.id + '" aria-pressed="' + (state.area === a.id) + '">' +
                 '<i class="fa-solid ' + a.icono + '" aria-hidden="true"></i>' + a.nombre + '</button>';
        });
        if (hayFiltroUso()) {
            h += '<button class="cmp-chip" data-limpiar="1"><i class="fa-solid fa-xmark" aria-hidden="true"></i>Quitar filtros</button>';
        }
        elChips.innerHTML = h;
        elFiltroBtn.classList.toggle('activo', hayFiltroUso());
    }

    function pintarGrilla() {
        var h = '<div class="cmp-grid">';
        CATS.forEach(function (c) {
            var n = DATA.filter(function (d) { return d.cat === c.id; }).length;
            h += '<button class="cmp-cat" data-cat="' + c.id + '" style="--c:' + c.color + '"' +
                 (n === 0 ? ' data-vacio="1"' : '') + '>' +
                 '<span class="cmp-cat-ic"><i class="fa-solid ' + c.icono + '" aria-hidden="true"></i></span>' +
                 '<span><b>' + esc(c.nombre) + '</b>' +
                 (n === 0 ? '<small>Próximamente</small>' : '') + '</span>' +
                 '</button>';
        });
        return h + '</div>';
    }

    function filaCompuesto(c) {
        var cat = porId(CATS, c.cat);
        var fav = state.favs.has(c.id);
        var iconosAreas = c.areas.map(function (id) {
            var a = porId(AREAS, id);
            return a ? '<i class="fa-solid ' + a.icono + '" title="' + a.nombre + '" aria-label="' + a.nombre + '"></i>' : '';
        }).join('');
        return '<div class="cmp-item" style="--c:' + cat.color + '">' +
            '<button class="cmp-open" data-open="' + c.id + '">' +
                '<span class="cmp-item-ic"><i class="fa-solid ' + cat.icono + '" aria-hidden="true"></i></span>' +
                '<span class="cmp-item-main">' +
                    '<span class="cmp-formula">' + esc(c.formula) + '</span>' +
                    '<span class="cmp-nombre">' + esc(c.nombre) + '</span>' +
                    '<small>' + esc(c.estado.split(' (')[0]) + ' ' + iconosAreas + '</small>' +
                '</span>' +
            '</button>' +
            '<span class="cmp-item-side">' +
                '<span class="cmp-dot ' + c.riesgo + '" title="Riesgo ' + c.riesgo + '"></span>' +
                '<button class="cmp-star" data-fav="' + c.id + '" aria-pressed="' + fav + '" aria-label="Favorito">' +
                    '<i class="fa-' + (fav ? 'solid' : 'regular') + ' fa-star" aria-hidden="true"></i></button>' +
            '</span>' +
        '</div>';
    }

    function pintarLista() {
        var lista = filtrados();
        var cat = state.cat ? porId(CATS, state.cat) : null;
        var h = '<div class="cmp-nav">';
        if (cat) {
            h += '<button class="cmp-back" data-back="1" aria-label="Volver a clasificaciones"><i class="fa-solid fa-arrow-left"></i></button>' +
                 '<div><h2>' + esc(cat.nombre) + '</h2><small>' + lista.length + (lista.length === 1 ? ' resultado' : ' resultados') + '</small></div>';
        } else {
            var partes = [];
            if (state.area) { var ar = porId(AREAS, state.area); partes.push(ar ? ar.nombre : state.area); }
            if (state.soloFavs) partes.push('Favoritos');
            h += '<button class="cmp-back" data-back="1" aria-label="Volver a clasificaciones"><i class="fa-solid fa-arrow-left"></i></button>' +
                 '<div><h2>Resultados</h2><small>' + lista.length + (lista.length === 1 ? ' encontrado' : ' encontrados') +
                 (partes.length ? ' · ' + esc(partes.join(' · ')) : '') + '</small></div>';
        }
        h += '</div>';
        if (!lista.length) {
            h += '<div class="cmp-vacio"><i class="fa-solid fa-flask-vial fa-2x" aria-hidden="true"></i>' +
                 '<p>No hay compuestos con esos filtros. Prueba con otra palabra o quita un filtro.</p>' +
                 (hayFiltroUso() ? '<button class="cmp-chip" data-limpiar="1">Quitar filtros</button>' : '') + '</div>';
        } else {
            h += '<div class="cmp-list">' + lista.map(filaCompuesto).join('') + '</div>';
        }
        return h;
    }

    function dato(etq, val, ancho) {
        if (!val) return '';
        return '<div class="cmp-dato' + (ancho ? ' ancho' : '') + '"><small>' + etq + '</small><span>' + esc(val) + '</span></div>';
    }

    function acordeon(icono, titulo, cuerpo, abierto, extra) {
        return '<details class="cmp-acordeon ' + (extra || '') + '"' + (abierto ? ' open' : '') + '>' +
            '<summary><span class="cmp-sum-ic"><i class="fa-solid ' + icono + '" aria-hidden="true"></i></span>' + titulo + '</summary>' +
            '<div class="cmp-cuerpo">' + cuerpo + '</div></details>';
    }

    function pintarFicha(c) {
        var cat = porId(CATS, c.cat);
        var fav = state.favs.has(c.id);

        var usos = Object.keys(c.usos).map(function (id) {
            var a = porId(AREAS, id);
            return '<div class="cmp-uso"><i class="fa-solid ' + (a ? a.icono : 'fa-bolt') + '" aria-hidden="true"></i>' +
                   '<div><b>' + (a ? a.nombre : id) + '</b>' + esc(c.usos[id]) + '</div></div>';
        }).join('');

        var rel = c.rel.map(function (id) { return porId(DATA, id); }).filter(Boolean);

        var h = '<div class="cmp-nav">' +
                '<button class="cmp-back" data-back="1" aria-label="Volver"><i class="fa-solid fa-arrow-left"></i></button>' +
                '<div><small>' + esc(cat.nombre) + '</small></div></div>';

        h += '<article class="cmp-ficha" style="--c:' + cat.color + '">' +
            '<header class="cmp-cab">' +
                '<div class="cmp-cab-fila">' +
                    '<span class="cmp-badge"><i class="fa-solid ' + cat.icono + '" aria-hidden="true"></i>' + esc(cat.nombre) + '</span>' +
                    '<button class="cmp-star" data-fav="' + c.id + '" aria-pressed="' + fav + '" aria-label="Favorito">' +
                        '<i class="fa-' + (fav ? 'solid' : 'regular') + ' fa-star" aria-hidden="true"></i></button>' +
                '</div>' +
                '<div class="cmp-cab-main">' +
                    '<div><h2>' + esc(c.nombre) + '</h2>' +
                    '<p class="cmp-otros">' + esc(c.otros) + '</p></div>' +
                    '<p class="cmp-form" aria-label="Fórmula">' + esc(c.formula) + '</p>' +
                '</div>' +
            '</header>' +

            '<div class="cmp-datos">' +
                dato('Estado', c.estado, true) +
                dato('Concentración de referencia', c.conc, true) +
                dato('Masa molar', c.masa) +
                dato('Densidad', c.dens) +
                dato('Fusión', c.fusion) +
                dato('Ebullición', c.ebull) +
                dato('Solubilidad', c.solub, true) +
            '</div>' +

            acordeon('fa-circle-info', 'Descripción', esc(c.desc), false) +
            acordeon('fa-bolt', 'Usos', usos, false) +
            acordeon('fa-shield-halved', 'Seguridad y prevención', esc(c.seg), false) +
            acordeon('fa-lightbulb', 'Dato curioso', esc(c.curio), false) +

            (rel.length
                ? '<div class="cmp-rel"><b>Relacionados</b><div class="cmp-chips">' +
                  rel.map(function (r) {
                      return '<button class="cmp-chip" data-open="' + r.id + '"><strong>' + esc(r.formula) + '</strong> ' + esc(r.nombre) + '</button>';
                  }).join('') + '</div></div>'
                : '') +
        '</article>';
        return h;
    }

    function pintar() {
        if (cargando) {
            elToolbar.hidden = false;
            elBody.innerHTML = '<div class="cmp-vacio">Cargando compuestos…</div>';
            return;
        }
        var c = state.id ? porId(DATA, state.id) : null;
        elToolbar.hidden = !!c;
        if (c) {
            elBody.innerHTML = pintarFicha(c);
            window.scrollTo(0, 0);
            return;
        }
        pintarChips();
        var hayFiltro = state.cat || state.area || state.q.trim() || state.soloFavs;
        elBody.innerHTML = hayFiltro ? pintarLista() : pintarGrilla();
    }

    /* ---------------------------------------------------------
       7) EVENTOS (delegación: un solo listener)
       --------------------------------------------------------- */
    root.addEventListener('click', function (e) {
        var t = e.target.closest('[data-cat],[data-open],[data-fav],[data-area],[data-favs],[data-back],[data-filtro],[data-limpiar]');
        if (!t) return;

        if (t.dataset.fav) {
            var id = t.dataset.fav;
            if (state.favs.has(id)) state.favs.delete(id); else state.favs.add(id);
            guardarFavs();
            var y = window.scrollY;
            pintar();
            if (state.id) window.scrollTo(0, y);
            return;
        }
        if (t.dataset.filtro) {
            abrirPanel(elFiltros.hidden);
            return;
        }
        if (t.dataset.open) {
            if (!state.id) state.scrollLista = window.scrollY;
            state.id = t.dataset.open;
            abrirPanel(false);
        } else if (t.dataset.cat) {
            state.cat = t.dataset.cat;
        } else if (t.dataset.area) {
            state.area = state.area === t.dataset.area ? null : t.dataset.area;
            abrirPanel(false);
        } else if (t.dataset.favs) {
            state.soloFavs = !state.soloFavs;
            abrirPanel(false);
        } else if (t.dataset.limpiar) {
            state.area = null;
            state.soloFavs = false;
            abrirPanel(false);
        } else if (t.dataset.back) {
            if (state.id) {
                state.id = null;
                pintar();
                window.scrollTo(0, state.scrollLista);
                return;
            }
            if (state.cat) {
                state.cat = null;
            } else {
                state.q = '';
                elQ.value = '';
                state.area = null;
                state.soloFavs = false;
            }
        }
        pintar();
    });

    elQ.addEventListener('input', function () {
        state.q = elQ.value;
        pintar();
    });

    /* ---------------------------------------------------------
       8) API pública (para "Dato del día" y otros botones)
          Ejemplo: Compuestos.abrir('lavandina')
       --------------------------------------------------------- */
    window.Compuestos = {
        abrir: function (id) {
            if (!cargando && !porId(DATA, id)) return;
            if (typeof window.mostrarPagina === 'function') window.mostrarPagina('compuestos');
            state.id = id;
            pintar();
        }
    };

    pintar();
})();
