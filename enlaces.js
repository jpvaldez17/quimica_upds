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
            s += '<line class="b-x" x1="120" y1="55" x2="180" y2="55"/>';
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

    function htmlResultado(r) {

        var out = "";

        if (r.impar) {
            out += aviso("<b>No existe como molécula.</b> Con " + r.N + " e⁻ (número impar) queda un electrón desapareado y el orden de enlace sale fraccionario (" +
                fmt(r.OE) + "). En clase se toma como «no existe».", "am");
        } else if (r.OE <= 0) {
            out += aviso("<b>No se forma enlace estable:</b> los e⁻ antienlazantes cancelan a los enlazantes (OE = 0).", "am");
        }

        if (r.e1.z <= 2 || r.e2.z <= 2) {
            out += aviso("Con H o He el esquema 2s–2p es una simplificación: solo tienen orbital 1s.", "inf");
        }

        var nombres = { 1: "Simple", 2: "Doble", 3: "Triple" };
        var tipo = r.existe ? (nombres[r.OE] || fmt(r.OE)) : "No existe";
        var det = r.existe ? desglose(r) : (r.impar ? "N impar" : "sin enlace");
        var el = r.c > 0 ? " − " + r.c + " e⁻" : (r.c < 0 ? " + " + (-r.c) + " e⁻" : "");

        /* 1 · Resultados (tarjeta oscura) */
        out += '<section class="card tom-dark">' + cab("fa-flask", "Resultados") +
            '<div class="tom-rx"><span class="tom-at">' + r.e1.sym + "</span><span>+</span>" +
            '<span class="tom-at">' + r.e2.sym + "</span>" + (el ? '<span class="tom-el">' + el + "</span>" : "") +
            '<span>→</span><span class="tom-pr">' + producto(r) + "</span></div>" +
            svgEstructura(r) +
            '<div class="tom-leyenda"><span class="tom-lg s">σ · línea recta</span><span class="tom-lg p">π · arco</span></div>' +
            '<div class="tom-tiles">' +
            tile(fmt(r.OE), "Orden de enlace", r.existe ? "az" : "rj") +
            tile(tipo + "<small>" + det + "</small>", "Tipo de enlace", r.existe ? "na" : "rj") +
            tile(r.para ? "Paramagnética" : "Diamagnética", r.para ? r.des.length + " e⁻ desapareado" + (r.des.length > 1 ? "s" : "") : "todos apareados", r.para ? "rj" : "vd") +
            tile(r.N + " e⁻", "de valencia", "gr") +
            "</div></section>";

        /* 2 · Notación con píldoras */
        var chips = "";
        r.niv.forEach(function (nv, i) {
            nv.n.forEach(function (nm, o) {
                var e = r.oc[i][o];
                if (e) { chips += '<span class="tom-mo ' + nv.k + (e === 1 ? " des" : "") + '">(' + nm + ")<sup>" + e + "</sup></span>"; }
            });
        });

        out += '<section class="card">' + cab("fa-atom", "Notación de orbitales moleculares") +
            '<div class="tom-notacion"><span class="tom-kk">KK</span><span class="tom-cor">[</span>' + chips + '<span class="tom-cor">]</span></div>' +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span><span class="tom-lg des">1 e⁻ solo</span></div>' +
            '<div class="tom-guia"><b>Cómo leerla:</b> cada píldora es un orbital molecular y el número pequeño son los electrones que tiene (máximo 2). ' +
            "Los <b>azules</b> unen los átomos y los <b>rojos</b> los separan. Si alguna píldora tiene <b>1 solo e⁻</b> (halo naranja), hay electrones " +
            "desapareados y la molécula es <b>paramagnética</b>; si todas tienen 2, es <b>diamagnética</b>. <b>KK</b> son las capas internas, que no cuentan.</div></section>";

        /* 3 · Diagrama estático dentro de un acordeón */
        out += '<section class="card tom-cardacc"><details class="tom-paso" data-d="1"' + (est.dopen ? " open" : "") + "><summary>" +
            '<span class="tom-num"><i class="fa-solid fa-chart-simple"></i></span><span>Diagrama de niveles de energía</span></summary>' +
            '<div class="tom-cuerpo">' + svgDiagrama(r) +
            '<div class="tom-guia"><div><span class="tom-lg anti">▲ Antienlazantes</span> Van arriba: tienen más energía y <b>restan estabilidad</b>.</div>' +
            '<div><span class="tom-lg enl">▼ Enlazantes</span> Van abajo: tienen menos energía y <b>dan estabilidad</b>.</div></div>' +
            '<p class="tom-p tom-suave">Orden en este diagrama: ' + ordenTexto(r) + ". Los orbitales atómicos están a los lados y los moleculares en el centro. " +
            "Esquema cualitativo, no está a escala.</p></div></details></section>";

        /* 4 · Paso a paso */
        out += '<section class="card">' + cab("fa-list-check", "Paso a paso") +
            paso(1, "Cuenta los electrones de valencia", pasoElectrones(r)) +
            paso(2, "Llena los orbitales moleculares", pasoLlenado(r)) +
            paso(3, "Calcula el orden de enlace", pasoOrden(r)) +
            paso(4, "Revisa el magnetismo", pasoMagnetismo(r)) + "</section>";

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
       7. INTERFAZ Y EVENTOS
       ========================================= */

    var CASOS = [
        { t: "NO⁺", s: ["N", "O"], c: 1 }, { t: "SiCl⁻", s: ["Si", "Cl"], c: -1 }, { t: "PF⁻", s: ["P", "F"], c: -1 },
        { t: "CN⁻", s: ["C", "N"], c: -1 }, { t: "BO⁺", s: ["B", "O"], c: 1 }, { t: "AsBr²⁺", s: ["As", "Br"], c: 2 },
        { t: "PbI⁻", s: ["Pb", "I"], c: -1 }, { t: "NF²⁺", s: ["N", "F"], c: 2 }, { t: "HgF⁻", s: ["Hg", "F"], c: -1 },
        { t: "SbH⁻", s: ["Sb", "H"], c: -1 }, { t: "N₂", s: ["N", "N"], c: 0 }, { t: "O₂", s: ["O", "O"], c: 0 },
        { t: "F₂", s: ["F", "F"], c: 0 }
    ];

    var est = { t: ["N", "O"], c: 1, r: null, dopen: false };
    var raiz;

    function shell() {

        var campos = [0, 1].map(function (i) {
            return '<div class="tom-campo"><label for="tom-e' + i + '">Elemento ' + (i + 1) + "</label>" +
                '<input type="text" id="tom-e' + i + '" class="tom-input" data-i="' + i + '" list="tom-lista" placeholder="N, nitrógeno o 7" ' +
                'autocomplete="off" autocapitalize="off" spellcheck="false"><div class="tom-info" id="tom-i' + i + '"></div></div>';
        }).join("");

        var cargas = [-3, -2, -1, 0, 1, 2, 3].map(function (v) {
            return '<button type="button" class="tom-chip" data-a="carga" data-v="' + v + '">' + (v > 0 ? "+" + v : (v < 0 ? "−" + (-v) : "0 neutro")) + "</button>";
        }).join("");

        var casos = CASOS.map(function (c, i) {
            return '<button type="button" class="tom-caso" data-a="caso" data-i="' + i + '">' + c.t + "</button>";
        }).join("");

        var lista = ELEMENTOS.map(function (e) { return '<option value="' + e.sym + '">' + e.nom + " · Z = " + e.z + "</option>"; }).join("");

        return '<section class="card">' + cab("fa-atom", "ENLACES · CALCULADORA TOM") +
            '<p class="tom-p">La <b>Teoría de Orbitales Moleculares</b> combina los orbitales de dos átomos en orbitales de toda la molécula. ' +
            "Elige los elementos y la carga: el resultado es inmediato y cada paso se explica abajo.</p></section>" +
            '<section class="card tom-form"><div class="tom-campos">' + campos + "</div>" +
            '<div class="tom-sub">Carga de la molécula o ion</div><div class="tom-chips">' + cargas + "</div>" +
            '<button type="button" class="tom-borrar" data-a="borrar"><i class="fa-solid fa-eraser"></i> Borrar</button></section>' +
            '<div id="tom-res" aria-live="polite"></div>' +
            '<section class="tom-casos"><h2>Casos de práctica</h2><p>Toca uno y se calcula al instante.</p><div class="tom-chips">' + casos + "</div></section>" +
            '<datalist id="tom-lista">' + lista + "</datalist>";
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
        if (e) {
            d.className = "tom-info ok";
            d.innerHTML = '<div class="tom-z"><span class="tom-zv">Z = ' + e.z + '</span><span class="tom-sep">|</span>Valencia: <b>' + e.v + "</b> e⁻</div>" +
                '<div class="tom-cfgl">' + cfgHtml(e) + "</div>";
        } else if (!texto.trim()) {
            d.className = "tom-info";
            d.textContent = "Escribe un elemento";
        } else {
            d.className = "tom-info mal";
            d.textContent = "No encontré ese elemento";
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
            cont.innerHTML = aviso("Elige los dos elementos (símbolo, nombre o número atómico) para ver el análisis.", "inf");
            return;
        }

        var r = analizar(els[0], els[1], est.c);
        est.r = r;

        cont.innerHTML = r.err
            ? aviso("<b>No se puede calcular.</b> " + r.err + '<div class="tom-formula">' + formulaN(r) + "</div>", "err")
            : htmlResultado(r);

        cont.classList.remove("tom-in");
        void cont.offsetWidth;
        cont.classList.add("tom-in");
    }

    function alClick(ev) {

        var sm = ev.target.closest("summary");
        if (sm) {
            setTimeout(function () { sm.parentNode.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 80);
            return;
        }

        var b = ev.target.closest("[data-a]");
        if (!b) { return; }

        var a = b.dataset.a;

        if (a === "carga") {
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
            $("tom-e0").focus();
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

    function alEscribir(ev) {
        if (ev.target.classList && ev.target.classList.contains("tom-input")) {
            est.t[+ev.target.dataset.i] = ev.target.value;
            calcular();
        }
    }

    /* Paso a paso: uno abierto a la vez. El diagrama recuerda si estaba abierto. */
    function alAbrir(ev) {

        var d = ev.target;
        if (!d.classList || !d.classList.contains("tom-paso")) { return; }

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
        raiz.addEventListener("input", alEscribir);
        raiz.addEventListener("toggle", alAbrir, true);

        marcarCarga();
        calcular();
    }

    /* Para probar desde la consola: TOM.analizar(TOM.buscar("N"), TOM.buscar("O"), 1) */
    window.TOM = { buscar: buscar, analizar: analizar };

    document.addEventListener("DOMContentLoaded", iniciar);

})();
