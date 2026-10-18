/* =========================================
   QUÍMICA UPDS
   ENLACES · Calculadora de Orbitales Moleculares (TOM)
   Developed by J. Poma · 2026
   Regla de clase: 2 elementos, esquema 2s-2p, máx. 16 e⁻,
   N impar = no existe.
   ========================================= */

(function () {

    "use strict";

    /* =========================================
       1. ELEMENTOS Y VALENCIA (criterio del docente)
       Madelung puro; solo Cu, Ag y Au con excepción.
       Valencia = e⁻ de la capa más externa (n máximo).
       ========================================= */

    var SIM = ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn " +
        "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm " +
        "Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu " +
        "Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og").split(" ");

    var NOM = ("Hidrógeno Helio Litio Berilio Boro Carbono Nitrógeno Oxígeno Flúor Neón Sodio Magnesio Aluminio " +
        "Silicio Fósforo Azufre Cloro Argón Potasio Calcio Escandio Titanio Vanadio Cromo Manganeso Hierro Cobalto " +
        "Níquel Cobre Zinc Galio Germanio Arsénico Selenio Bromo Kriptón Rubidio Estroncio Itrio Circonio Niobio " +
        "Molibdeno Tecnecio Rutenio Rodio Paladio Plata Cadmio Indio Estaño Antimonio Telurio Yodo Xenón Cesio Bario " +
        "Lantano Cerio Praseodimio Neodimio Prometio Samario Europio Gadolinio Terbio Disprosio Holmio Erbio Tulio " +
        "Iterbio Lutecio Hafnio Tántalo Wolframio Renio Osmio Iridio Platino Oro Mercurio Talio Plomo Bismuto Polonio " +
        "Astato Radón Francio Radio Actinio Torio Protactinio Uranio Neptunio Plutonio Americio Curio Berkelio " +
        "Californio Einstenio Fermio Mendelevio Nobelio Lawrencio Rutherfordio Dubnio Seaborgio Bohrio Hasio " +
        "Meitnerio Darmstatio Roentgenio Copernicio Nihonio Flerovio Moscovio Livermorio Teneso Oganesón").split(" ");

    var ORDEN = [["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2], ["3d", 10], ["4p", 6],
        ["5s", 2], ["4d", 10], ["5p", 6], ["6s", 2], ["4f", 14], ["5d", 10], ["6p", 6], ["7s", 2],
        ["5f", 14], ["6d", 10], ["7p", 6]];

    var EXC = { 29: ["4s", "3d"], 47: ["5s", "4d"], 79: ["6s", "5d"] };

    var SUP = "⁰¹²³⁴⁵⁶⁷⁸⁹";

    function sup(n) {
        return String(n).split("").map(function (d) { return SUP.charAt(+d); }).join("");
    }

    function configuracion(z) {

        var resto = z, lista = [];

        for (var i = 0; i < ORDEN.length && resto > 0; i++) {
            var e = Math.min(ORDEN[i][1], resto);
            lista.push([ORDEN[i][0], e]);
            resto -= e;
        }

        if (EXC[z]) {
            lista.forEach(function (p) {
                if (p[0] === EXC[z][0]) { p[1] -= 1; }
                if (p[0] === EXC[z][1]) { p[1] += 1; }
            });
        }

        var n = 0, v = 0;
        lista.forEach(function (p) { if (p[1] > 0) { n = Math.max(n, +p[0].charAt(0)); } });
        lista.forEach(function (p) { if (p[1] > 0 && +p[0].charAt(0) === n) { v += p[1]; } });

        return { lista: lista.filter(function (p) { return p[1] > 0; }), n: n, v: v };
    }

    var ELEMENTOS = SIM.map(function (s, i) {
        var c = configuracion(i + 1);
        return { z: i + 1, sym: s, nom: NOM[i], cfg: c.lista, n: c.n, v: c.v };
    });

    /* Lista principal del selector (los más usados en clase); «Mostrar todos» abre los 118 */
    var PRINC = {};
    ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Ti Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Ag Cd " +
        "In Sn Sb Te I Xe Cs Ba Pt Au Hg Tl Pb Bi").split(" ").forEach(function (s) { PRINC[s] = true; });

    function normalizar(t) {
        return String(t || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\.$/, "").trim();
    }

    function buscar(texto) {

        var t = normalizar(texto);
        if (!t) { return null; }

        if (/^\d+$/.test(t)) {
            var z = +t;
            return (z >= 1 && z <= 118) ? ELEMENTOS[z - 1] : null;
        }

        for (var i = 0; i < ELEMENTOS.length; i++) {
            if (normalizar(ELEMENTOS[i].sym) === t || normalizar(ELEMENTOS[i].nom) === t) { return ELEMENTOS[i]; }
        }
        return null;
    }

    function textoValencia(e) {
        return e.cfg.filter(function (p) { return +p[0].charAt(0) === e.n; })
            .map(function (p) { return p[0] + sup(p[1]); }).join(" ");
    }


    /* =========================================
       2. MOTOR DE CÁLCULO
       Esquema 2s-2p: 8 orbitales moleculares = máx. 16 e⁻.
       Con N ≥ 12 (O₂, F₂…) el σ2px baja por debajo de los π2p.
       Los e⁻ ocupan los mismos niveles en ambos órdenes, así que
       el resultado no cambia: solo cambia el dibujo y la notación.
       ========================================= */

    var BASE = [
        { k: "enl", t: "σ", n: ["σ2s"] },
        { k: "anti", t: "σ", n: ["σ*2s"] },
        { k: "enl", t: "π", n: ["π2py", "π2pz"] },
        { k: "enl", t: "σ", n: ["σ2px"] },
        { k: "anti", t: "π", n: ["π*2py", "π*2pz"] },
        { k: "anti", t: "σ", n: ["σ*2px"] }
    ];

    var MAX_E = 16;

    var ISO = { 2: "H₂", 4: "Be₂", 6: "B₂", 8: "C₂", 10: "N₂, CO, CN⁻ y NO⁺", 12: "O₂", 14: "F₂", 16: "Ne₂" };

    function niveles(N) {
        var orden = (N >= 12) ? [0, 1, 3, 2, 4, 5] : [0, 1, 2, 3, 4, 5];
        return orden.map(function (i) { return BASE[i]; });
    }

    /* Aufbau + Pauli + Hund: devuelve los e⁻ de cada orbital */
    function llenar(niv, N) {
        var q = N;
        return niv.map(function (nv) {
            var d = nv.n.length, e = Math.min(d * 2, q), oc = nv.n.map(function () { return 0; });
            q -= e;
            for (var j = 0; j < e; j++) { oc[j % d]++; }
            return oc;
        });
    }

    function analizar(e1, e2, c) {

        var N = e1.v + e2.v - c;
        var r = { e1: e1, e2: e2, c: c, N: N };

        if (N < 1) {
            r.err = "Con esa carga no quedan electrones de valencia (N = " + N + "). Reduce la carga positiva.";
            return r;
        }
        if (N > MAX_E) {
            r.err = "El esquema 2s–2p tiene 8 orbitales moleculares y admite como máximo " + MAX_E +
                " e⁻ de valencia; aquí hay " + N + ". Reduce la carga negativa o cambia de elementos.";
            return r;
        }

        r.niv = niveles(N);
        r.oc = llenar(r.niv, N);
        r.sigmaPrimero = (N >= 12);

        var enl = 0, anti = 0, pi = 0, pia = 0, des = [];

        r.niv.forEach(function (nv, i) {
            nv.n.forEach(function (nm, o) {
                var e = r.oc[i][o];
                if (nv.k === "enl") { enl += e; if (nv.t === "π") { pi += e; } }
                else { anti += e; if (nv.t === "π") { pia += e; } }
                if (e === 1) { des.push(nm); }
            });
        });

        r.enl = enl; r.anti = anti; r.pi = pi; r.pia = pia;
        r.OE = (enl - anti) / 2;
        r.piN = (pi - pia) / 2;
        r.sg = r.OE - r.piN;
        r.des = des;
        r.para = des.length > 0;
        r.impar = (N % 2 === 1);
        r.existe = !r.impar && r.OE > 0;

        return r;
    }


    /* =========================================
       3. UTILIDADES DE TEXTO
       ========================================= */

    function $(id) { return document.getElementById(id); }

    function fmt(x) { return String(Math.round(x * 10) / 10); }

    function textoCarga(c) {
        if (c > 0) { return (c > 1 ? sup(c) : "") + "⁺"; }
        return (c < -1 ? sup(-c) : "") + "⁻";
    }

    function producto(r) {
        var base = (r.e1.sym === r.e2.sym) ? r.e1.sym + "₂" : r.e1.sym + r.e2.sym;
        return r.c ? "[" + base + "]" + textoCarga(r.c) : base;
    }

    function desglose(r) {
        var p = [];
        if (r.piN > 0) { p.push(fmt(r.piN) + "π"); }
        if (r.sg > 0) { p.push(fmt(r.sg) + "σ"); }
        return p.join(" + ") || "—";
    }

    function formulaN(r) {
        var f = r.e1.v + " (" + r.e1.sym + ") + " + r.e2.v + " (" + r.e2.sym + ")";
        if (r.c > 0) { f += " − " + r.c; }
        if (r.c < 0) { f += " + " + (-r.c); }
        return f + " = <b>" + r.N + " e⁻</b>";
    }

    /* Configuración completa en orden de llenado; la capa de valencia va resaltada */
    function cfgHtml(e) {
        return e.cfg.map(function (p) {
            return '<span class="' + (+p[0].charAt(0) === e.n ? "tom-val" : "") + '">' + p[0] + sup(p[1]) + "</span>";
        }).join(" ");
    }

    function ordenTexto(r) {
        return r.niv.map(function (nv) {
            return nv.n.length === 2 ? nv.n[0].slice(0, -1) : nv.n[0];
        }).join(" &lt; ");
    }

    function aviso(t, c) { return '<div class="tom-aviso ' + (c || "") + '">' + t + "</div>"; }

    function tile(v, e, c) {
        return '<div class="tom-tile ' + c + '"><div class="tom-tile-v">' + v + '</div><div class="tom-tile-e">' + e + "</div></div>";
    }

    function paso(n, titulo, cuerpo) {
        return '<details class="tom-paso" data-n="' + n + '"' + (n === 1 ? " open" : "") + '><summary><span class="tom-num">' + n +
            "</span><span>" + titulo + '</span></summary><div class="tom-cuerpo">' + cuerpo + "</div></details>";
    }

    function cab(icono, titulo) {
        return '<div class="card-header"><div class="card-icon tom-ic"><i class="fa-solid ' + icono + '"></i></div><h2>' + titulo + "</h2></div>";
    }


    /* =========================================
       4. ESTRUCTURA MOLECULAR (SVG)
       σ = línea recta naranja · π = arco suave
       ========================================= */

    function svgEstructura(r) {

        var pi = Math.round(r.piN), sg = Math.round(r.sg), c = r.c;
        var s = '<svg viewBox="0 0 300 110" class="tom-est" role="img" aria-label="Estructura molecular">';

        if (c) {
            s += '<path class="br" d="M62 16H52V94H62"/><path class="br" d="M238 16H248V94H238"/>' +
                '<text class="t-q" x="256" y="30">' + (Math.abs(c) > 1 ? Math.abs(c) : "") + (c > 0 ? "+" : "−") + "</text>";
        }

        if (r.existe) {
            if (sg > 0) { s += '<line class="b-s" x1="120" y1="55" x2="180" y2="55"/>'; }
            if (pi > 0) { s += '<path class="b-p" d="M124 44Q150 33 176 44"/>'; }
            if (pi > 1) { s += '<path class="b-p" d="M124 66Q150 77 176 66"/>'; }
        } else {
            s += '<text class="t-q" x="150" y="63" text-anchor="middle">✕</text>';
        }

        return s + '<circle class="at" cx="92" cy="55" r="28"/><circle class="at" cx="208" cy="55" r="28"/>' +
            '<text class="t-at" x="92" y="64">' + r.e1.sym + '</text><text class="t-at" x="208" y="64">' + r.e2.sym + "</text></svg>";
    }


    /* =========================================
       5. DIAGRAMA DE NIVELES DE ENERGÍA (SVG estático)
       ========================================= */

    var Y = [300, 235, 190, 150, 100, 55];

    function segmentos(d) { return d === 1 ? [[128, 212]] : [[104, 160], [180, 236]]; }

    function svgDiagrama(r) {

        var s = '<svg viewBox="0 0 340 350" class="tom-svg" role="img" aria-label="Diagrama de niveles de energía de los orbitales moleculares">' +
            '<line class="eje" x1="10" y1="332" x2="10" y2="34"/><polygon class="eje-p" points="10,24 5,36 15,36"/>' +
            '<text class="t-s" x="20" y="30">Energía</text>';

        var conex = "", atom = "", niv = "";

        /* Orbitales atómicos de cada elemento y sus conexiones */
        [r.e1, r.e2].forEach(function (e, l) {

            var pc = Math.max(0, e.v - 2);
            var lista = [
                { y: 265, t: e.n + "s" + sup(Math.min(e.v, 2)), a: [0, 1] },
                { y: 125, t: e.n + "p" + (pc ? sup(pc) : ""), a: [2, 3, 4, 5] }
            ];

            lista.forEach(function (ao) {

                var x1 = l ? 268 : 16, xa = l ? 268 : 72;

                ao.a.forEach(function (i) {
                    var sg = segmentos(r.niv[i].n.length);
                    var q = l ? sg[sg.length - 1][1] : sg[0][0];
                    conex += '<line class="cx" x1="' + xa + '" y1="' + ao.y + '" x2="' + q + '" y2="' + Y[i] + '"/>';
                });

                atom += '<line class="ln-ao" x1="' + x1 + '" y1="' + ao.y + '" x2="' + (x1 + 56) + '" y2="' + ao.y + '"/>' +
                    '<text class="t-ao" x="' + (x1 + 28) + '" y="' + (ao.y - 8) + '">' + ao.t + "</text>";
            });
        });

        /* Orbitales moleculares con sus electrones */
        r.niv.forEach(function (nv, i) {

            var sg = segmentos(nv.n.length);

            nv.n.forEach(function (nm, o) {

                var e = r.oc[i][o], x1 = sg[o][0], x2 = sg[o][1], xm = (x1 + x2) / 2, y = Y[i];

                niv += '<g class="lv ' + nv.k + (e ? "" : " vac") + '">' +
                    '<line class="ln" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>' +
                    (e ? '<text class="t-e" x="' + xm + '" y="' + (y - 8) + '">' + (e === 2 ? "↑↓" : "↑") + "</text>" : "") +
                    '<text class="nm" x="' + xm + '" y="' + (y + 16) + '">' + nm + "</text></g>";
            });
        });

        return s + conex + atom + niv +
            '<text class="t-a" x="44" y="346">' + r.e1.sym + '</text><text class="t-a" x="296" y="346">' + r.e2.sym + "</text></svg>";
    }


    /* =========================================
       6. BLOQUES DE RESULTADOS (orden fijo)
       1 Resultados · 2 Notación · 3 Diagrama · 4 Paso a paso
       ========================================= */

    function deltaEN(r) {
        var xa = EN[r.e1.sym], xb = EN[r.e2.sym];
        return (xa !== undefined && xb !== undefined) ? Math.abs(xa - xb) : null;
    }

    /* Gas noble para la forma abreviada: el mayor con Z menor que el del elemento */
    var GN = [[2, "He"], [10, "Ne"], [18, "Ar"], [36, "Kr"], [54, "Xe"], [86, "Rn"]];

    function nucleoGN(e) {
        var g = null;
        GN.forEach(function (x) { if (x[0] < e.z) { g = x; } });
        return g;
    }

    function cfgAbrev(e) {
        var g = nucleoGN(e), acc = 0, partes = [];
        if (!g) { return cfgHtml(e); }
        e.cfg.forEach(function (p) {
            if (acc >= g[0]) {
                partes.push('<span class="' + (+p[0].charAt(0) === e.n ? "tom-val" : "") + '">' + p[0] + sup(p[1]) + "</span>");
            }
            acc += p[1];
        });
        return '<span class="cf-nuc">[' + g[1] + "]</span> " + partes.join(" ");
    }

    function flechas(c) {
        return (c >= 1 ? "<i>↑</i>" : "") + (c === 2 ? "<i>↓</i>" : "");
    }

    /* Cajitas con flechas de la capa de valencia (regla de Hund) */
    function cajasAtomo(e) {
        return e.cfg.filter(function (p) { return +p[0].charAt(0) === e.n; }).map(function (p) {
            var t = p[0].charAt(1), k = (t === "s") ? 1 : (t === "p" ? 3 : (t === "d" ? 5 : 7)), cs = [], j;
            for (j = 0; j < k; j++) { cs.push(0); }
            for (j = 0; j < p[1]; j++) { cs[j % k]++; }
            return '<div class="cf-sub"><span class="cf-sn">' + p[0] + "</span>" + cs.map(function (c) {
                return '<span class="cf-bx' + (c ? "" : " vac") + '">' + flechas(c) + "</span>";
            }).join("") + '<span class="cf-se">' + p[1] + " e⁻</span></div>";
        }).join("");
    }

    function bloqueAtomo(e) {
        return '<div class="cf-at"><div class="cf-at-h"><span class="tom-at">' + e.sym + '</span><span class="cf-nm">' + e.nom +
            '</span><span class="cf-z">Z = ' + e.z + "</span></div>" +
            '<div class="cf-l"><span class="cf-lt">Completa</span><div class="tom-cfg">' + cfgHtml(e) + "</div></div>" +
            (nucleoGN(e) ? '<div class="cf-l"><span class="cf-lt">Abreviada</span><div class="tom-cfg">' + cfgAbrev(e) + "</div></div>" : "") +
            '<div class="cf-l"><span class="cf-lt">Capa de valencia (n = ' + e.n + ')</span><div class="cf-cajas">' + cajasAtomo(e) + "</div></div>" +
            '<div class="cf-cnt"><span class="cf-i">' + (e.z - e.v) + ' e⁻ internos</span><span class="cf-v">' + e.v + " e⁻ de valencia</span></div></div>";
    }

    function cajasMO(r) {
        return r.niv.map(function (nv, i) {
            return '<div class="cf-niv">' + nv.n.map(function (nm, o) {
                var c = r.oc[i][o];
                return '<div class="cf-mo ' + nv.k + '"><span class="cf-bx ' + nv.k + (c ? "" : " vac") + '">' + flechas(c) + '</span><span class="cf-mon">' + nm + "</span></div>";
            }).join("") + "</div>";
        }).join("");
    }

    function pasoCf(n, titulo, cuerpo) {
        return '<div class="cf-s"><div class="cf-s-l"><span class="tom-num">' + n + '</span></div><div class="cf-s-c"><div class="cf-s-t">' +
            titulo + "</div>" + cuerpo + "</div></div>";
    }

    function htmlConfig(r, chips) {

        var interno = (r.e1.z - r.e1.v) + (r.e2.z - r.e2.v);
        var nota = r.c > 0 ? "La carga positiva <b>quita</b> " + r.c + " e⁻." : (r.c < 0 ? "La carga negativa <b>agrega</b> " + (-r.c) + " e⁻." : "La molécula es neutra: no se agregan ni se quitan e⁻.");
        var simpl = (r.e1.z <= 2 || r.e2.z <= 2);

        var p3 = '<p class="tom-p">Los <b>' + interno + " e⁻ internos</b> (capas llenas) forman <b>KK</b> y no participan en el enlace.</p>" +
            (simpl
                ? '<p class="tom-p tom-suave">Con H o He el esquema es una simplificación: solo tienen orbital 1s, pero se trabaja igual con el esquema 2s–2p.</p>'
                : '<p class="tom-p">De la capa de valencia de cada átomo se usan sus orbitales <b>s</b> (1) y <b>p</b> (3): 4 + 4 = <b>8 orbitales atómicos</b>, que se combinan en <b>8 orbitales moleculares</b>.</p>') +
            '<div class="cf-tipo"><span class="tom-lg enl">4 enlazantes</span><div>σ2s · π2py · π2pz · σ2px</div></div>' +
            '<div class="cf-tipo"><span class="tom-lg anti">4 antienlazantes</span><div>σ*2s · π*2py · π*2pz · σ*2px</div></div>';

        var p4 = '<div class="cf-eje"><span>menor energía</span><span>mayor energía →</span></div>' +
            '<div class="cf-mos">' + cajasMO(r) + "</div>" +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span></div>' +
            '<p class="tom-p tom-suave">Se llenan de abajo hacia arriba (Aufbau), máximo 2 e⁻ por caja con flechas opuestas (Pauli) y, en cajas de igual energía, 1 e⁻ en cada una antes de aparear (Hund). Las cajas punteadas están vacías.</p>';

        var p5 = '<div class="tom-notacion"><span class="tom-kk">KK</span><span class="tom-cor">[</span>' + chips + '<span class="tom-cor">]</span></div>' +
            '<p class="tom-p tom-suave">Este es el resumen que el programa hace por ti: lo que antes se dibujaba a mano capa por capa.</p>';

        return '<section class="card tom-cardacc"><details class="tom-paso" data-cf="1"' + (est.cfopen ? " open" : "") + "><summary>" +
            '<span class="tom-num"><i class="fa-solid fa-layer-group"></i></span><span>Del átomo a la molécula: configuración completa</span></summary>' +
            '<div class="tom-cuerpo"><p class="tom-p tom-suave">Toda la cadena, paso a paso, hasta llegar a la notación KK[…].</p><div class="cf-lin">' +
            pasoCf(1, "Configuración de cada átomo", '<div class="cf-dos">' + bloqueAtomo(r.e1) + bloqueAtomo(r.e2) + "</div>") +
            pasoCf(2, "Suma los e⁻ de valencia y ajusta por la carga", '<div class="tom-formula">' + formulaN(r) + '</div><p class="tom-p">' + nota + "</p>") +
            pasoCf(3, "Separa internos y valencia", p3) +
            pasoCf(4, "Llena los orbitales moleculares", p4) +
            pasoCf(5, "Resultado: notación molecular", p5) +
            "</div></div></details></section>";
    }

    function pasoConclusion(r) {
        var t = r.impar
            ? '<p class="tom-p">N = ' + r.N + " es impar: queda un e⁻ desapareado y el OE es fraccionario (" + fmt(r.OE) + "). Por la regla de clase, <b>no existe</b>.</p>"
            : '<p class="tom-p">OE = 0: los e⁻ antienlazantes cancelan a los enlazantes, así que <b>no se forma enlace</b>.</p>';
        t += '<p class="tom-p tom-suave">Como no existe, no corresponde hablar de su tipo de enlace ni de su magnetismo.</p>';
        var den = deltaEN(r);
        if (den !== null && den > 1.7) {
            t += '<p class="tom-p">Esta combinación es iónica: pruébala en <b>Compuesto</b>.</p>';
        }
        return t;
    }

    function htmlResultado(r) {

        var out = "";
        var nombres = { 1: "simple", 2: "doble", 3: "triple" };
        var prod = producto(r);

        /* Veredicto: la respuesta en una frase */
        if (r.existe) {
            out += '<div class="tom-vd ok"><b>' + prod + " existe.</b> Enlace " + (nombres[r.OE] || "de orden " + fmt(r.OE)) + " (" + desglose(r) +
                ") · orden de enlace " + fmt(r.OE) + " · " + (r.para ? "paramagnética" : "diamagnética") + ".</div>";
        } else if (r.impar) {
            out += '<div class="tom-vd no"><b>' + prod + " no existe como molécula.</b> Con " + r.N + " e⁻ (número impar) queda un electrón desapareado y el orden de enlace sale fraccionario (" +
                fmt(r.OE) + "). En clase se toma como «no existe».</div>";
        } else {
            out += '<div class="tom-vd no"><b>' + prod + " no se forma.</b> Los e⁻ antienlazantes cancelan a los enlazantes (OE = 0): no hay enlace estable.</div>";
        }

        /* Un solo aviso con todo lo que conviene saber */
        var notas = [], den = deltaEN(r), ion = (den !== null && den > 1.7);
        if (r.e1.z <= 2 || r.e2.z <= 2) { notas.push("Con H o He el esquema 2s–2p es una simplificación: solo tienen orbital 1s."); }
        if (ion) {
            notas.push("<b>ΔEN = " + coma(den) + ":</b> el enlace es de carácter <b>iónico</b>, así que esta combinación se resuelve mejor en <b>Compuesto</b>. Aquí la TOM covalente es solo una aproximación.");
        }
        if (notas.length) {
            out += aviso(notas.map(function (n) { return "<div>" + n + "</div>"; }).join("") +
                (ion ? '<button type="button" class="tom-ir" data-a="modo" data-m="comp">Resolver como compuesto</button>' : ""), "inf");
        }

        var tipo = r.existe ? (nombres[r.OE] || fmt(r.OE)) : "No existe";
        var det = r.existe ? desglose(r) : (r.impar ? "N impar" : "sin enlace");
        var el = r.c > 0 ? " − " + r.c + " e⁻" : (r.c < 0 ? " + " + (-r.c) + " e⁻" : "");

        /* 1 · Resultados (tarjeta oscura) */
        out += '<section class="card tom-dark">' + cab("fa-flask", "Resultados") +
            '<div class="tom-rx"><span class="tom-at">' + r.e1.sym + "</span><span>+</span>" +
            '<span class="tom-at">' + r.e2.sym + "</span>" + (el ? '<span class="tom-el">' + el + "</span>" : "") +
            '<span>→</span><span class="tom-pr">' + prod + "</span></div>" +
            svgEstructura(r) +
            (r.existe ? '<div class="tom-leyenda"><span class="tom-lg s">σ · línea recta</span><span class="tom-lg p">π · arco</span></div>' : "") +
            '<div class="tom-tiles">' +
            tile(fmt(r.OE), "Orden de enlace", r.existe ? "az" : "rj") +
            tile(tipo + "<small>" + det + "</small>", "Tipo de enlace", r.existe ? "na" : "rj") +
            (r.existe
                ? tile(r.para ? "Paramagnética" : "Diamagnética", r.para ? r.des.length + " e⁻ desapareado" + (r.des.length > 1 ? "s" : "") : "todos apareados", r.para ? "rj" : "vd")
                : tile("No aplica", "la molécula no existe", "gr")) +
            tile(r.N + " e⁻", "de valencia", "gr") +
            "</div></section>";

        /* Notación con píldoras */
        var chips = "";
        r.niv.forEach(function (nv, i) {
            nv.n.forEach(function (nm, o) {
                var e = r.oc[i][o];
                if (e) { chips += '<span class="tom-mo ' + nv.k + (e === 1 ? " des" : "") + '">(' + nm + ")<sup>" + e + "</sup></span>"; }
            });
        });

        /* 2 · Del átomo a la molécula (desplegable) */
        out += htmlConfig(r, chips);

        /* 3 · Notación */
        out += '<section class="card">' + cab("fa-atom", "Notación de orbitales moleculares") +
            '<div class="tom-notacion"><span class="tom-kk">KK</span><span class="tom-cor">[</span>' + chips + '<span class="tom-cor">]</span></div>' +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span><span class="tom-lg des">1 e⁻ solo</span></div>' +
            '<details class="tom-mini"' + (est.gopen ? " open" : "") + '><summary>Cómo leerla</summary><div class="tom-guia">' +
            "Cada píldora es un orbital molecular y el número pequeño son los electrones que tiene (máximo 2). " +
            "Los <b>azules</b> unen los átomos y los <b>rojos</b> los separan. Si alguna píldora tiene <b>1 solo e⁻</b> (halo naranja), hay electrones " +
            "desapareados y la molécula es <b>paramagnética</b>; si todas tienen 2, es <b>diamagnética</b>. <b>KK</b> son las capas internas, que no cuentan." +
            "</div></details></section>";

        /* 4 · Diagrama estático dentro de un acordeón */
        out += '<section class="card tom-cardacc"><details class="tom-paso" data-d="1"' + (est.dopen ? " open" : "") + "><summary>" +
            '<span class="tom-num"><i class="fa-solid fa-chart-simple"></i></span><span>Diagrama de niveles de energía</span></summary>' +
            '<div class="tom-cuerpo">' + svgDiagrama(r) +
            '<div class="tom-guia"><div><span class="tom-lg anti">▲ Antienlazantes</span> Van arriba: tienen más energía y <b>restan estabilidad</b>.</div>' +
            '<div><span class="tom-lg enl">▼ Enlazantes</span> Van abajo: tienen menos energía y <b>dan estabilidad</b>.</div></div>' +
            '<p class="tom-p tom-suave">Orden en este diagrama: ' + ordenTexto(r) + ". Los orbitales atómicos están a los lados y los moleculares en el centro. " +
            "Esquema cualitativo, no está a escala.</p></div></details></section>";

        /* 5 · Paso a paso */
        out += '<section class="card">' + cab("fa-list-check", "Paso a paso") +
            paso(1, "Cuenta los electrones de valencia", pasoElectrones(r)) +
            paso(2, "Llena los orbitales moleculares", pasoLlenado(r)) +
            paso(3, "Calcula el orden de enlace", pasoOrden(r)) +
            (r.existe ? paso(4, "Revisa el magnetismo", pasoMagnetismo(r)) : paso(4, "Conclusión", pasoConclusion(r))) + "</section>";

        return out;
    }

    function pasoElectrones(r) {

        var filas = [r.e1, r.e2].map(function (e) {
            return '<div class="tom-fila"><b>' + e.sym + "</b> " + e.nom + " · Z = " + e.z +
                '<div class="tom-cfg">' + cfgHtml(e) + "</div>Capa de valencia (n = " + e.n + "): <b>" + textoValencia(e) + " = " + e.v + " e⁻</b></div>";
        }).join("");

        var nota = r.c > 0 ? "La carga positiva <b>quita</b> " + r.c + " e⁻." : (r.c < 0 ? "La carga negativa <b>agrega</b> " + (-r.c) + " e⁻." : "La molécula es neutra: no se agregan ni se quitan e⁻.");

        return filas + '<div class="tom-formula">' + formulaN(r) + "</div>" +
            '<p class="tom-p">' + nota + '</p><p class="tom-p tom-suave">Los electrones internos (capas llenas) no participan en el enlace.</p>';
    }

    function pasoLlenado(r) {
        return '<p class="tom-p">Orden de energía para esta molécula, de menor a mayor:</p>' +
            '<div class="tom-formula">' + ordenTexto(r) + "</div>" +
            '<p class="tom-p tom-suave">' + (r.sigmaPrimero
                ? "Con N ≥ 12 (como O₂ y F₂) el σ2px queda por debajo de los π2p."
                : "Con N ≤ 11 (como N₂, CO y CN⁻) los π2p quedan por debajo del σ2px.") + "</p>" +
            '<ul class="tom-lista"><li><b>Aufbau:</b> los e⁻ ocupan primero los niveles de menor energía.</li>' +
            "<li><b>Pauli:</b> máximo 2 e⁻ por orbital, con espines opuestos.</li>" +
            "<li><b>Hund:</b> en orbitales de igual energía (π o π*) se pone 1 e⁻ en cada uno antes de aparear.</li></ul>" +
            '<p class="tom-p">Los <b>' + r.N + " e⁻</b> quedan como en la notación KK[…].</p>";
    }

    function pasoOrden(r) {

        var t = '<p class="tom-p">Orden de enlace = (e⁻ enlazantes − e⁻ antienlazantes) / 2</p>' +
            '<div class="tom-formula">OE = (' + r.enl + " − " + r.anti + ") / 2 = <b>" + fmt(r.OE) + "</b></div>" +
            '<div class="tom-dos"><div><span class="tom-lg enl">enlazantes</span> ' + r.enl + " e⁻</div>" +
            '<div><span class="tom-lg anti">antienlazantes</span> ' + r.anti + " e⁻</div></div>";

        if (r.existe) {
            t += '<p class="tom-p">Resultado: enlace <b>' + ({ 1: "simple", 2: "doble", 3: "triple" }[r.OE] || "de orden " + fmt(r.OE)) + "</b> (" + desglose(r) + ").</p>" +
                '<p class="tom-p tom-suave">π: (' + r.pi + " − " + r.pia + ") / 2 = " + fmt(r.piN) + " · σ: " + fmt(r.OE) + " − " + fmt(r.piN) + " = " + fmt(r.sg) +
                ".<br>A mayor orden de enlace, mayor energía de enlace y menor longitud.</p>";
        } else if (r.impar) {
            t += '<p class="tom-p">N = ' + r.N + " es impar, así que el OE no es un número entero. Por la regla de clase, <b>no existe</b>.</p>";
        } else {
            t += '<p class="tom-p">OE = 0: <b>no se forma un enlace estable</b>.</p>';
        }
        return t;
    }

    function pasoMagnetismo(r) {

        var t = r.para
            ? '<p class="tom-p"><b>' + r.des.length + " e⁻ desapareado" + (r.des.length > 1 ? "s" : "") + "</b> en " + r.des.join(" y ") +
            '.</p><p class="tom-p">Es <b>paramagnética</b>: un campo magnético la atrae.</p>'
            : '<p class="tom-p">Todos los e⁻ están apareados.</p><p class="tom-p">Es <b>diamagnética</b>: un campo magnético la repele débilmente.</p>';

        if (ISO[r.N]) {
            t += '<p class="tom-p tom-suave">Dato extra: con ' + r.N + " e⁻ de valencia tienen esta misma configuración " + ISO[r.N] + ".</p>";
        }
        return t;
    }


    /* =========================================
       6B. MODO COMPUESTO
       Iónico (metal + no metal, ΔEN > 1,7) y covalente de 3 átomos AB₂.
       Solo elementos representativos.
       ========================================= */

    var EN = {
        H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98, Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90,
        P: 2.19, S: 2.58, Cl: 3.16, K: 0.82, Ca: 1.00, Ge: 2.01, As: 2.18, Se: 2.55, Br: 2.96, Rb: 0.82, Sr: 0.95,
        Sn: 1.96, Sb: 2.05, Te: 2.10, I: 2.66, Cs: 0.79, Ba: 0.89, Pb: 2.33, Bi: 2.02
    };

    var CATIONES = "Li Na K Rb Cs Be Mg Ca Sr Ba Al".split(" ");
    var ANIONES = "H N P As O S Se Te F Cl Br I".split(" ");
    var GASES = { 2: "helio", 10: "neón", 18: "argón", 36: "kriptón", 54: "xenón" };
    var GEOM = { 0: ["Lineal", "180°"], 1: ["Angular", "≈120°"], 2: ["Angular", "≈104,5°"], 3: ["Lineal", "180°"] };

    var CASOS_C = [
        { t: "NaCl", s: ["Na", "Cl"], n: [1, 1] }, { t: "LiF", s: ["Li", "F"], n: [1, 1] }, { t: "MgO", s: ["Mg", "O"], n: [1, 1] },
        { t: "CaO", s: ["Ca", "O"], n: [1, 1] }, { t: "MgF₂", s: ["Mg", "F"], n: [1, 2] }, { t: "Na₂O", s: ["Na", "O"], n: [2, 1] },
        { t: "K₂O", s: ["K", "O"], n: [2, 1] }, { t: "AlF₃", s: ["Al", "F"], n: [1, 3] }, { t: "H₂O", s: ["O", "H"], n: [1, 2] },
        { t: "CO₂", s: ["C", "O"], n: [1, 2] }, { t: "H₂S", s: ["S", "H"], n: [1, 2] }, { t: "SO₂", s: ["S", "O"], n: [1, 2] }
    ];

    function coma(x) { return x.toFixed(2).replace(".", ","); }
    function r1(v) { return Math.round(v * 10) / 10; }
    function mcd(a, b) { return b ? mcd(b, a % b) : a; }

    function sub(n) {
        return n > 1 ? String(n).split("").map(function (d) { return "₀₁₂₃₄₅₆₇₈₉".charAt(+d); }).join("") : "";
    }

    function ionTxt(sym, c) {
        return sym + (Math.abs(c) > 1 ? sup(Math.abs(c)) : "") + (c > 0 ? "⁺" : "⁻");
    }

    /* Configuración de un ion según su número de electrones (Madelung) */
    function cfgIon(n) {
        var r = n, s = [];
        for (var i = 0; i < ORDEN.length && r > 0; i++) {
            var e = Math.min(ORDEN[i][1], r);
            s.push(ORDEN[i][0] + sup(e));
            r -= e;
        }
        return s.join(" ");
    }

    function analizarComp(e1, e2, n1, n2) {

        var r = { e1: e1, e2: e2, n1: n1, n2: n2 };

        if (e1.sym === e2.sym) { r.err = "Elige dos elementos distintos."; return r; }

        var x1 = EN[e1.sym], x2 = EN[e2.sym];
        if (x1 === undefined || x2 === undefined) {
            r.err = "No tengo la electronegatividad de " + (x1 === undefined ? e1.sym : e2.sym) + ". Este modo trabaja con elementos representativos.";
            return r;
        }

        r.d = Math.abs(x1 - x2);

        var c1 = CATIONES.indexOf(e1.sym) >= 0, c2 = CATIONES.indexOf(e2.sym) >= 0;
        var a1 = ANIONES.indexOf(e1.sym) >= 0, a2 = ANIONES.indexOf(e2.sym) >= 0;

        if (r.d > 1.7 && ((c1 && a2) || (c2 && a1))) { return ionico(r, c1 ? 0 : 1); }

        if (r.d > 1.7) {
            r.err = "ΔEN = " + coma(r.d) + ": el enlace es iónico, pero con estos elementos no puedo determinar los iones (por ejemplo, metales de transición).";
            return r;
        }

        return covalente(r);
    }

    function ionico(r, ic) {

        var cat = ic ? r.e2 : r.e1, ani = ic ? r.e1 : r.e2;
        var c = cat.v, a = (ani.sym === "H") ? 1 : 8 - ani.v, g = mcd(c, a);

        r.tipo = "ion";
        r.cat = cat; r.ani = ani; r.c = c; r.a = a;
        r.nc = a / g; r.na = c / g;
        r.difiere = ((ic ? r.n2 : r.n1) !== r.nc) || ((ic ? r.n1 : r.n2) !== r.na);
        r.enlaces = Math.max(r.nc, r.na);
        r.ambos = r.nc > 1 && r.na > 1;
        return r;
    }

    /* Covalente de 3 átomos: el elemento con cantidad 1 es el central */
    function covalente(r) {

        var n1 = r.n1, n2 = r.n2;

        if (n1 + n2 === 2) { r.tipo = "dos"; return r; }
        if (n1 + n2 !== 3) {
            r.err = "Por ahora este modo resuelve compuestos de 2 átomos (usa Orbitales moleculares) y de 3 átomos, como H₂O o CO₂.";
            return r;
        }

        var cen = (n1 === 1) ? r.e1 : r.e2, ter = (n1 === 1) ? r.e2 : r.e1;

        if (cen.z <= 2) { r.err = "El H no puede ser el átomo central: solo forma un enlace. Pon el otro elemento con cantidad 1."; return r; }

        var V = cen.v + 2 * ter.v;
        if (V % 2) { r.err = "Con " + V + " e⁻ de valencia (número impar) es un radical y no se resuelve con una única estructura de Lewis."; return r; }

        var objT = (ter.z <= 2) ? 2 : 8, mejor = null;

        for (var k = 1; k <= 3; k++) {
            var lt = (objT - 2 * k) / 2, lc = (V - 4 * k - 4 * lt) / 2;
            if (lt < 0 || lt % 1 !== 0 || lc < 0 || lc % 1 !== 0) { continue; }
            var ec = 4 * k + 2 * lc;
            if (cen.n === 2 && ec > 8) { continue; }
            var ft = ter.v - (2 * lt + k), fc = cen.v - (2 * lc + 2 * k);
            var s = 2 * Math.abs(ft) + Math.abs(fc), o = Math.abs(ec - 8);
            if (!mejor || s < mejor.s || (s === mejor.s && o < mejor.o)) {
                mejor = { k: k, lt: lt, lc: lc, ft: ft, fc: fc, s: s, o: o, ec: ec };
            }
        }

        if (!mejor) { r.err = "No encontré una estructura de Lewis simétrica para esta combinación (puede tener resonancia o ser un caso especial)."; return r; }

        r.tipo = "cov";
        r.cen = cen; r.ter = ter; r.V = V; r.est = mejor;
        r.geo = GEOM[mejor.lc];
        r.lineal = (mejor.lc === 0 || mejor.lc === 3);
        r.dCT = Math.abs(EN[cen.sym] - EN[ter.sym]);
        return r;
    }


    /* ---------- Dibujos (SVG) ---------- */

    function flecha(x1, y1, x2, y2) {

        var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
        var bx = x2 - ux * 10, by = y2 - uy * 10;

        return '<line class="ar" x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(bx) + '" y2="' + r1(by) + '"/>' +
            '<polygon class="ar-h" points="' + r1(x2) + "," + r1(y2) + " " + r1(bx - uy * 6) + "," + r1(by + ux * 6) + " " + r1(bx + uy * 6) + "," + r1(by - ux * 6) + '"/>';
    }

    function burbuja(x, y, rr, txt, cls) {
        return '<circle class="io ' + cls + '" cx="' + x + '" cy="' + y + '" r="' + rr + '"/><text class="t-i" x="' + x + '" y="' + (y + 5) + '">' + txt + "</text>";
    }

    /* Iones: el ion que está solo va al centro y las flechas salen (o llegan) a su alrededor */
    function svgIonico(r) {

        var ct = ionTxt(r.cat.sym, r.c), at = ionTxt(r.ani.sym, -r.a), s = "";
        var estrella = (r.nc === 1 || r.na === 1) && Math.max(r.nc, r.na) <= 3;

        if (!estrella) {
            s = burbuja(66, 56, 38, r.nc + " " + ct, "c") + burbuja(264, 56, 38, r.na + " " + at, "a") + flecha(110, 56, 218, 56) +
                '<text class="t-e" x="164" y="44">' + (r.nc * r.c) + " e⁻</text>";
            return '<svg viewBox="0 0 330 112" class="tom-cs" role="img" aria-label="Transferencia de electrones">' + s + "</svg>";
        }

        var cenCat = (r.nc === 1), k = cenCat ? r.na : r.nc, cy = 60;
        var pos = (k === 1) ? [[275, 60]] : (k === 2 ? [[55, 60], [275, 60]] : [[55, 60], [275, 60], [165, 175]]);

        s = burbuja(165, cy, 30, cenCat ? ct : at, cenCat ? "c" : "a");

        pos.forEach(function (p) {
            var dx = p[0] - 165, dy = p[1] - cy, L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L;
            var xi = 165 + ux * 34, yi = cy + uy * 34, xf = p[0] - ux * 26, yf = p[1] - uy * 26;
            s += burbuja(p[0], p[1], 22, cenCat ? at : ct, cenCat ? "a" : "c");
            s += cenCat ? flecha(xi, yi, xf, yf) : flecha(xf, yf, xi, yi);
            s += '<text class="t-e" x="' + Math.round((xi + xf) / 2 + (uy ? 16 : 0)) + '" y="' + Math.round((yi + yf) / 2 - (uy ? 0 : 8)) + '">e⁻</text>';
        });

        return '<svg viewBox="0 0 330 ' + (k === 3 ? 222 : 120) + '" class="tom-cs" role="img" aria-label="Transferencia de electrones">' + s + "</svg>";
    }

    /* Covalente: σ recta y π en arco, igual que en Orbitales moleculares */
    function svgCov(r) {

        var k = r.est.k;
        var s = '<svg viewBox="0 0 330 104" class="tom-est" role="img" aria-label="Estructura de la molécula">';

        [[98, 143], [187, 232]].forEach(function (b) {
            var m = (b[0] + b[1]) / 2;
            s += '<line class="b-s" x1="' + b[0] + '" y1="52" x2="' + b[1] + '" y2="52"/>';
            if (k > 1) { s += '<path class="b-p" d="M' + (b[0] + 3) + " 44Q" + m + " 35 " + (b[1] - 3) + ' 44"/>'; }
            if (k > 2) { s += '<path class="b-p" d="M' + (b[0] + 3) + " 60Q" + m + " 69 " + (b[1] - 3) + ' 60"/>'; }
        });

        [[76, r.ter.sym], [165, r.cen.sym], [254, r.ter.sym]].forEach(function (a) {
            s += '<circle class="at" cx="' + a[0] + '" cy="52" r="22"/><text class="t-at" x="' + a[0] + '" y="60">' + a[1] + "</text>";
        });

        return s + "</svg>";
    }


    /* ---------- Resultados del modo Compuesto ---------- */

    function chip(t) { return '<span class="tom-at">' + t + "</span>"; }

    function tarjetaOscura(rx, grafico, tiles) {
        return '<section class="card tom-dark">' + cab("fa-flask", "Resultados") + '<div class="tom-rx">' + rx + "</div>" + grafico +
            '<div class="tom-tiles">' + tiles + "</div></section>";
    }

    function htmlComp(r) {

        if (r.err) { return aviso("<b>No se puede calcular.</b> " + r.err, "err"); }

        if (r.tipo === "dos") {
            return aviso("<b>Son solo 2 átomos.</b> Para dos átomos se usa Orbitales moleculares: muestra el diagrama y el orden de enlace (ΔEN = " + coma(r.d) + ').' +
                '<button type="button" class="tom-ir" data-a="modo" data-m="tom">Ir a Orbitales moleculares</button>', "inf");
        }

        return (r.tipo === "ion") ? htmlIonico(r) : htmlCovalente(r);
    }

    function htmlIonico(r) {

        var cat = r.cat, ani = r.ani, ct = ionTxt(cat.sym, r.c), at = ionTxt(ani.sym, -r.a);
        var formula = cat.sym + sub(r.nc) + ani.sym + sub(r.na), out = "";

        if (r.difiere) {
            out += aviso("Con las cargas " + ct + " y " + at + " la fórmula neutra es <b>" + formula + "</b>; el cálculo usa esa fórmula.", "am");
        }
        if (r.ambos) {
            out += aviso("Con subíndices en ambos elementos el conteo de enlaces puede variar: confirma la convención con tu docente.", "inf");
        }

        var rx = chip((r.nc > 1 ? r.nc + " " : "") + cat.sym) + "<span>+</span>" + chip((r.na > 1 ? r.na + " " : "") + ani.sym) +
            '<span>→</span><span class="tom-pr">' + formula + "</span>";

        var iones = (r.nc > 1 ? r.nc + " " : "") + ct + " + " + (r.na > 1 ? r.na + " " : "") + at;

        out += tarjetaOscura(rx, svgIonico(r),
            tile(String(r.enlaces), "Nº de enlaces", "az") +
            tile("Iónico<small>ΔEN = " + coma(r.d) + "</small>", "Tipo de enlace", "na") +
            tile("Diamagnética<small>todos apareados</small>", "Magnetismo", "vd") +
            tile(iones, "iones formados", "gr"));

        var base = (r.na >= r.nc) ? ani : cat;

        out += '<section class="card">' + cab("fa-list-check", "Paso a paso") +
            paso(1, "Electronegatividad y ΔEN",
                "<p class=\"tom-p\">" + cat.sym + ": EN = <b>" + coma(EN[cat.sym]) + "</b> · " + ani.sym + ": EN = <b>" + coma(EN[ani.sym]) + "</b></p>" +
                '<div class="tom-formula">ΔEN = |' + coma(EN[ani.sym]) + " − " + coma(EN[cat.sym]) + "| = <b>" + coma(r.d) + "</b></div>" +
                '<p class="tom-p">' + coma(r.d) + " es mayor que 1,7 y hay un metal con un no metal: el enlace es <b>iónico</b>.</p>") +
            paso(2, "Transferencia de electrones",
                '<div class="tom-formula">' + cat.sym + " → " + ct + " + " + r.c + " e⁻</div>" +
                '<div class="tom-formula">' + ani.sym + " + " + r.a + " e⁻ → " + at + "</div>" +
                '<p class="tom-p">El ' + cat.nom.toLowerCase() + " tiene " + r.c + " e⁻ de valencia y los cede; el " + ani.nom.toLowerCase() + " tiene " + ani.v + " y recibe " + r.a + ".</p>" +
                '<p class="tom-p">Cargas: (+' + r.c + ")×" + r.nc + " + (−" + r.a + ")×" + r.na + " = 0 → <b>" + formula + "</b></p>") +
            paso(3, "Configuración de los iones", [[ct, cat.z - r.c], [at, ani.z + r.a]].map(function (p) {
                return '<div class="tom-fila"><b>' + p[0] + '</b> · ' + p[1] + ' e⁻<div class="tom-cfg">' + cfgIon(p[1]) + "</div>igual que el " + (GASES[p[1]] || "gas noble") + "</div>";
            }).join("")) +
            paso(4, "Enlaces y magnetismo",
                '<p class="tom-p"><b>' + r.enlaces + " enlace" + (r.enlaces > 1 ? "s" : "") + "</b>: un enlace " + cat.sym + "–" + ani.sym + " por cada átomo de " + base.nom.toLowerCase() + ".</p>" +
                '<p class="tom-p">Todos los e⁻ de ambos iones están apareados: es <b>diamagnética</b>.</p>' +
                '<p class="tom-p tom-suave">Estructura: red iónica (cationes rodeados de aniones), no moléculas discretas.</p>') +
            "</section>";

        return out;
    }

    function htmlCovalente(r) {

        var cen = r.cen, ter = r.ter, e = r.est, k = e.k, out = "";
        var formula = (ter.z <= 1) ? ter.sym + "₂" + cen.sym : cen.sym + ter.sym + "₂";
        var nombre = ["simple", "doble", "triple"][k - 1];

        if (e.ft !== 0 || e.fc !== 0) {
            out += aviso("Quedan cargas formales distintas de 0: esta molécula puede tener resonancia. Se muestra una de las estructuras posibles.", "am");
        }
        if (e.ec !== 8) {
            out += aviso("Excepción al octeto: " + cen.sym + " queda con " + e.ec + " e⁻ en su capa.", "inf");
        }

        var rx = chip(cen.sym) + "<span>+</span>" + chip("2 " + ter.sym) + "<span>→</span><span class=\"tom-pr\">" + formula + "</span>";

        out += tarjetaOscura(rx, svgCov(r) + '<div class="tom-leyenda"><span class="tom-lg s">σ · línea recta</span><span class="tom-lg p">π · arco</span></div>',
            tile("2", "Nº de enlaces", "az") +
            tile(nombre.charAt(0).toUpperCase() + nombre.slice(1) + " ×2<small>" + 2 + "σ" + (k > 1 ? " + " + 2 * (k - 1) + "π" : "") + "</small>", "Tipo de enlace", "na") +
            tile("Diamagnética<small>todos apareados</small>", "Magnetismo", "vd") +
            tile(r.geo[0] + "<small>" + (r.lineal ? "apolar" : "polar") + " · " + r.geo[1] + "</small>", "Geometría", "gr"));

        out += '<section class="card">' + cab("fa-list-check", "Paso a paso") +
            paso(1, "Cuenta los electrones de valencia",
                '<p class="tom-p">' + cen.sym + ": <b>" + cen.v + " e⁻</b> · " + ter.sym + ": <b>" + ter.v + " e⁻</b> (hay 2)</p>" +
                '<div class="tom-formula">' + cen.v + " (" + cen.sym + ") + 2 × " + ter.v + " (" + ter.sym + ") = <b>" + r.V + " e⁻</b></div>") +
            paso(2, "Dibuja la estructura de Lewis",
                '<p class="tom-p">Cada átomo busca completar su capa (8 e⁻; el H, 2 e⁻). Con ' + r.V + ' e⁻ la mejor estructura es:</p>' +
                '<div class="tom-formula">' + cen.sym + " con cada " + ter.sym + ": enlace <b>" + nombre + "</b></div>" +
                '<p class="tom-p">Pares libres: ' + e.lt + " en cada " + ter.sym + " y " + e.lc + " en " + cen.sym + ". Enlaces: 2σ" + (k > 1 ? " + " + 2 * (k - 1) + "π" : "") + ".</p>") +
            paso(3, "Calcula las cargas formales",
                '<p class="tom-p">Carga formal = e⁻ de valencia − (e⁻ de pares libres + enlaces)</p>' +
                '<div class="tom-formula">' + ter.sym + ": " + ter.v + " − (" + 2 * e.lt + " + " + k + ") = <b>" + e.ft + "</b><br>" +
                cen.sym + ": " + cen.v + " − (" + 2 * e.lc + " + " + 2 * k + ") = <b>" + e.fc + "</b></div>") +
            paso(4, "Geometría, polaridad y magnetismo",
                '<p class="tom-p">Dominios de e⁻ en ' + cen.sym + " = 2 + " + e.lc + " = <b>" + (2 + e.lc) + "</b> → <b>" + r.geo[0] + "</b> (" + r.geo[1] + ").</p>" +
                '<p class="tom-p">ΔEN (' + cen.sym + "–" + ter.sym + ") = " + coma(r.dCT) + ". " + (r.lineal
                    ? "Es simétrica: los dipolos se cancelan → molécula <b>apolar</b>."
                    : "Los dipolos no se cancelan → molécula <b>polar</b>.") + "</p>" +
                '<p class="tom-p">Todos los e⁻ están apareados: es <b>diamagnética</b>.</p>') +
            "</section>";

        return out;
    }


    /* =========================================
       7. INTERFAZ Y EVENTOS
       ========================================= */

    var CASOS = [
        { t: "Li₂", s: ["Li", "Li"], c: 0 }, { t: "B₂", s: ["B", "B"], c: 0 }, { t: "C₂", s: ["C", "C"], c: 0 },
        { t: "N₂", s: ["N", "N"], c: 0 }, { t: "O₂", s: ["O", "O"], c: 0 }, { t: "F₂", s: ["F", "F"], c: 0 },
        { t: "Ne₂", s: ["Ne", "Ne"], c: 0 }, { t: "CO", s: ["C", "O"], c: 0 }, { t: "NO⁺", s: ["N", "O"], c: 1 },
        { t: "CN⁻", s: ["C", "N"], c: -1 }, { t: "BO⁺", s: ["B", "O"], c: 1 }, { t: "PF⁻", s: ["P", "F"], c: -1 }
    ];

    var est = { t: ["", ""], c: 0, r: null, dopen: false, gopen: false, modo: "tom", n: [1, 1], todos: false, cfopen: false };
    var raiz;

    function shell() {

        var campos = [0, 1].map(function (i) {
            return '<div class="tom-campo"><label for="tom-e' + i + '">Elemento ' + (i + 1) + '<span class="tom-nm" id="tom-nm' + i + '"></span></label><div class="tom-sel">' +
                '<input type="text" id="tom-e' + i + '" class="tom-input" data-i="' + i + '" placeholder="Toca para elegir" readonly inputmode="none" autocomplete="off">' +
                '<button type="button" class="tom-dd" data-a="dd" data-i="' + i + '" aria-label="Elegir elemento de la lista" aria-haspopup="dialog">' +
                '<i class="fa-solid fa-chevron-down"></i></button></div>' +
                '<div class="tom-cant solo-comp"><div class="tom-cant-t">Cantidad de átomos <small>(subíndice)</small></div><span><button type="button" data-a="cant" data-i="' + i + '" data-d="-1" aria-label="Menos">−</button>' +
                '<b id="tom-n' + i + '">1</b><button type="button" data-a="cant" data-i="' + i + '" data-d="1" aria-label="Más">+</button></span></div>' +
                '<div class="tom-info" id="tom-i' + i + '"></div></div>';
        }).join("");

        var cargas = [-3, -2, -1, 0, 1, 2, 3].map(function (v) {
            return '<button type="button" class="tom-chip ' + (v > 0 ? "pos" : (v < 0 ? "neg" : "cero")) + '" data-a="carga" data-v="' + v + '">' + (v > 0 ? "+" + v : (v < 0 ? "−" + (-v) : "0")) + "</button>";
        }).join("");

        var casos = CASOS.map(function (c, i) {
            return '<button type="button" class="tom-caso" data-a="caso" data-i="' + i + '">' + c.t + "</button>";
        }).join("");


        var casosC = CASOS_C.map(function (c, i) {
            return '<button type="button" class="tom-caso" data-a="casoc" data-i="' + i + '">' + c.t + "</button>";
        }).join("");

        return '<section class="card tom-top"><div class="tom-cab"><h2>Enlaces · Calculadora</h2><span class="tom-badge"><i class="fa-solid fa-atom"></i></span></div>' +
            '<p class="tom-p solo-tom">La <b>Teoría de Orbitales Moleculares</b> combina los orbitales de dos átomos en orbitales de toda la molécula.</p>' +
            '<p class="tom-p solo-comp">Resuelve un compuesto: iónico (MgF₂, CaO…) o covalente de 3 átomos (H₂O, CO₂…).</p>' +
            '<div class="tom-casos"><h2>Casos de práctica</h2><p>Toca uno y se calcula al instante.</p>' +
            '<div class="tom-chips solo-tom">' + casos + '</div><div class="tom-chips solo-comp">' + casosC + "</div></div></section>" +
            '<section class="card tom-modo"><div class="tom-mod" role="group" aria-label="Modo de cálculo">' +
            '<button type="button" data-a="modo" data-m="tom">Orbitales moleculares</button>' +
            '<button type="button" data-a="modo" data-m="comp">Compuesto</button></div></section>' +
            '<section class="card tom-form"><div class="tom-campos">' + campos + "</div>" +
            '<div class="solo-tom"><div class="tom-sub">Carga de la molécula o ion</div><div class="tom-chips">' + cargas + "</div></div>" +
            '<button type="button" class="tom-borrar" data-a="borrar"><i class="fa-solid fa-eraser"></i> Borrar</button></section>' +
            '<div id="tom-res" aria-live="polite"></div>' +
            '<p class="tom-ver">Calculadora TOM · v10</p>';
    }

    function pintarModo() {
        raiz.dataset.modo = est.modo;
        raiz.querySelectorAll('.tom-mod [data-a="modo"]').forEach(function (b) {
            var on = (b.dataset.m === est.modo);
            b.classList.toggle("act", on);
            b.setAttribute("aria-pressed", String(on));
        });
    }

    function pintarCant() {
        $("tom-n0").textContent = est.n[0];
        $("tom-n1").textContent = est.n[1];
    }

    function marcarCarga() {
        raiz.querySelectorAll('[data-a="carga"]').forEach(function (b) {
            var on = (+b.dataset.v === est.c);
            b.classList.toggle("act", on);
            b.setAttribute("aria-pressed", String(on));
        });
    }

    function infoElemento(i, e, texto) {
        var d = $("tom-i" + i);
        $("tom-nm" + i).textContent = e ? " → " + e.nom : "";
        if (e) {
            d.className = "tom-info ok";
            d.innerHTML = '<div class="tom-z"><span>Z = <b class="tom-zv">' + e.z + '</b></span><span class="tom-sep">|</span><span>Valencia: <b class="tom-vv">' + e.v + "</b> e⁻</span></div>" +
                '<div class="tom-cfgl">' + cfgHtml(e) + "</div>";
        } else if (!texto.trim()) {
            d.className = "tom-info";
            d.textContent = "Toca para elegir un elemento";
        } else {
            d.className = "tom-info mal";
            d.textContent = "No encontré ese elemento";
        }
    }

    /* Panel de elementos en pantalla: lista con scroll + buscador.
       Los campos son de solo toque, así que el teclado solo se abre
       si el usuario toca el buscador del panel. */
    var ov, sel = 0;

    function filtrarElementos(t) {
        t = normalizar(t);
        return ELEMENTOS.filter(function (e) {
            if (!est.todos && !PRINC[e.sym]) { return false; }
            return !t || normalizar(e.sym).indexOf(t) === 0 || normalizar(e.nom).indexOf(t) === 0 || String(e.z).indexOf(t) === 0;
        });
    }

    function pintarLista(t, centrar) {

        var act = buscar(est.t[sel]), ls = $("tom-ls"), items = filtrarElementos(t);

        $("tom-todos").textContent = est.todos ? "Mostrar solo los principales" : "Mostrar todos los elementos";

        ls.innerHTML = items.length ? items.map(function (e) {
            return '<button type="button" role="option" class="tom-op' + (act && act.z === e.z ? " sel" : "") + '" data-a="pick" data-s="' + e.sym +
                '"><b>' + e.sym + "</b><span>" + e.nom + "</span><i>Z = " + e.z + "</i></button>";
        }).join("") : '<div class="tom-vacio">Sin coincidencias' + (est.todos ? "" : " en la lista principal.<br>Toca «Mostrar todos los elementos».") + "</div>";

        var s = ls.querySelector(".sel");
        ls.scrollTop = (centrar && s) ? Math.max(0, s.offsetTop - ls.clientHeight / 2 + 23) : 0;
    }

    /* Mantiene el panel dentro de la zona visible (también con el teclado abierto) */
    function ajustarPanel() {
        if (!ov || ov.hidden) { return; }
        var v = window.visualViewport, p = ov.firstChild;
        p.style.top = ((v ? v.offsetTop : 0) + 8) + "px";
        p.style.maxHeight = Math.min((v ? v.height : window.innerHeight) - 16, 320) + "px";
    }

    function abrirPanel(i) {
        sel = i;
        $("tom-pt").textContent = "Elemento " + (i + 1);
        $("tom-q").value = "";
        ov.hidden = false;
        document.body.classList.add("tom-bloq");
        ajustarPanel();
        pintarLista("", true);
    }

    function cerrarPanel() {
        ov.hidden = true;
        $("tom-q").blur();
        document.body.classList.remove("tom-bloq");
    }

    function elegir(sym) {
        est.t[sel] = sym;
        $("tom-e" + sel).value = sym;
        cerrarPanel();
        calcular();
    }

    function crearPanel() {

        ov = document.createElement("div");
        ov.id = "tom-ov";
        ov.className = "tom-ov";
        ov.hidden = true;
        ov.innerHTML = '<div class="tom-pnl" role="dialog" aria-modal="true" aria-label="Elegir elemento">' +
            '<div class="tom-ph"><b id="tom-pt">Elemento 1</b><button type="button" class="tom-x" data-a="cerrar" aria-label="Cerrar"><i class="fa-solid fa-xmark"></i></button></div>' +
            '<input type="text" id="tom-q" class="tom-q" placeholder="Buscar: símbolo, nombre o Z" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search">' +
            '<div class="tom-ls" id="tom-ls" role="listbox"></div>' +
            '<div class="tom-pf"><button type="button" class="tom-todos" id="tom-todos" data-a="todos"></button></div></div>';
        document.body.appendChild(ov);

        ov.addEventListener("click", function (ev) {
            if (ev.target === ov || ev.target.closest('[data-a="cerrar"]')) { cerrarPanel(); return; }
            if (ev.target.closest('[data-a="todos"]')) { est.todos = !est.todos; pintarLista($("tom-q").value, false); return; }
            var b = ev.target.closest('[data-a="pick"]');
            if (b) { elegir(b.dataset.s); }
        });

        ov.addEventListener("input", function (ev) {
            if (ev.target.id === "tom-q") { pintarLista(ev.target.value, false); }
        });

        ov.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape") { cerrarPanel(); }
            if (ev.key === "Enter" && ev.target.id === "tom-q") {
                var f = filtrarElementos(ev.target.value)[0];
                if (f) { elegir(f.sym); }
            }
        });

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", ajustarPanel);
            window.visualViewport.addEventListener("scroll", ajustarPanel);
        }
    }

    function calcular() {

        var els = [0, 1].map(function (i) {
            var e = buscar(est.t[i]);
            infoElemento(i, e, est.t[i]);
            return e;
        });

        var cont = $("tom-res");
        est.r = null;

        if (!els[0] || !els[1]) {
            cont.innerHTML = aviso("Elige los dos elementos para ver el análisis.", "inf");
            return;
        }

        if (est.modo === "comp") {
            est.r = null;
            cont.innerHTML = htmlComp(analizarComp(els[0], els[1], est.n[0], est.n[1]));
        } else {
            var r = analizar(els[0], els[1], est.c);
            est.r = r;
            cont.innerHTML = r.err
                ? aviso("<b>No se puede calcular.</b> " + r.err + '<div class="tom-formula">' + formulaN(r) + "</div>", "err")
                : htmlResultado(r);
        }

        cont.classList.remove("tom-in");
        void cont.offsetWidth;
        cont.classList.add("tom-in");
    }

    function alClick(ev) {

        if (ev.target.classList.contains("tom-input")) {
            abrirPanel(+ev.target.dataset.i);
            return;
        }

        var sm = ev.target.closest("summary");
        if (sm) {
            setTimeout(function () { sm.parentNode.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 80);
            return;
        }

        var b = ev.target.closest("[data-a]");
        if (!b) { return; }

        var a = b.dataset.a;

        if (a === "modo") {
            est.modo = b.dataset.m;
            pintarModo();
            calcular();
        } else if (a === "cant") {
            var q = +b.dataset.i;
            est.n[q] = Math.max(1, Math.min(4, est.n[q] + (+b.dataset.d)));
            pintarCant();
            calcular();
        } else if (a === "casoc") {
            var cc = CASOS_C[+b.dataset.i];
            est.t = cc.s.slice();
            est.n = cc.n.slice();
            $("tom-e0").value = est.t[0];
            $("tom-e1").value = est.t[1];
            pintarCant();
            calcular();
            $("tom-e0").closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (a === "carga") {
            est.c = +b.dataset.v;
            marcarCarga();
            calcular();
        } else if (a === "borrar") {
            est.t = ["", ""];
            est.c = 0;
            $("tom-e0").value = "";
            $("tom-e1").value = "";
            marcarCarga();
            calcular();
        } else if (a === "dd") {
            abrirPanel(+b.dataset.i);
        } else if (a === "caso") {
            var caso = CASOS[+b.dataset.i];
            est.t = caso.s.slice();
            est.c = caso.c;
            $("tom-e0").value = est.t[0];
            $("tom-e1").value = est.t[1];
            marcarCarga();
            calcular();
            $("tom-e0").closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* Paso a paso: uno abierto a la vez. El diagrama recuerda si estaba abierto. */
    function alAbrir(ev) {

        var d = ev.target;
        if (d.classList && d.classList.contains("tom-mini")) { est.gopen = d.open; return; }
        if (!d.classList || !d.classList.contains("tom-paso")) { return; }

        if (d.dataset.cf) { est.cfopen = d.open; return; }
        if (d.dataset.d) { est.dopen = d.open; return; }
        if (!d.open) { return; }

        raiz.querySelectorAll(".tom-paso[data-n]").forEach(function (o) { if (o !== d) { o.open = false; } });
    }

    function iniciar() {

        raiz = $("enlaces-app");
        if (!raiz) { return; }

        raiz.className = "tom";
        raiz.innerHTML = shell();
        $("tom-e0").value = est.t[0];
        $("tom-e1").value = est.t[1];

        raiz.addEventListener("click", alClick);
        raiz.addEventListener("toggle", alAbrir, true);
        crearPanel();

        marcarCarga();
        pintarModo();
        pintarCant();
        calcular();
    }

    /* Para probar desde la consola: TOM.analizar(TOM.buscar("N"), TOM.buscar("O"), 1) */
    window.TOM = { buscar: buscar, analizar: analizar, comp: analizarComp };

    document.addEventListener("DOMContentLoaded", iniciar);

})();
