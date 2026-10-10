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
       Niveles de menor a mayor energía (esquema 2s-2p).
       k: enl / anti · t: tipo de enlace · n: orbitales
       ========================================= */

    var NIV = [
        { k: "enl", t: "σ", n: ["σ2s"] },
        { k: "anti", t: "σ", n: ["σ*2s"] },
        { k: "enl", t: "π", n: ["π2py", "π2pz"] },
        { k: "enl", t: "σ", n: ["σ2px"] },
        { k: "anti", t: "π", n: ["π*2py", "π*2pz"] },
        { k: "anti", t: "σ", n: ["σ*2px"] }
    ];

    var ISO = { 2: "H₂", 4: "Be₂", 6: "B₂", 8: "C₂", 10: "N₂, CO, CN⁻ y NO⁺", 12: "O₂", 14: "F₂", 16: "Ne₂" };

    /* Orden en que entra cada electrón: Aufbau + Hund + Pauli */
    function secuencia(N) {
        var seq = [], q = N;
        NIV.forEach(function (nv, i) {
            var d = nv.n.length, e = Math.min(d * 2, q);
            q -= e;
            for (var j = 0; j < e; j++) { seq.push({ i: i, o: j % d, up: j < d }); }
        });
        return seq;
    }

    /* Ocupación de cada orbital cuando hay k electrones colocados */
    function ocupacion(seq, k) {
        var oc = NIV.map(function (nv) { return nv.n.map(function () { return 0; }); });
        for (var j = 0; j < k; j++) { oc[seq[j].i][seq[j].o]++; }
        return oc;
    }

    function analizar(e1, e2, c) {

        var N = e1.v + e2.v - c;
        var r = { e1: e1, e2: e2, c: c, N: N };

        if (N < 1) {
            r.err = "Con esa carga no quedan electrones de valencia (N = " + N + "). Reduce la carga positiva.";
            return r;
        }
        if (N > 16) {
            r.err = "El esquema de clase admite como máximo 16 e⁻ de valencia y aquí hay " + N +
                ". Reduce la carga negativa o elige otros elementos.";
            return r;
        }

        r.seq = secuencia(N);
        r.oc = ocupacion(r.seq, N);

        var enl = 0, anti = 0, pi = 0, pia = 0, des = [];

        NIV.forEach(function (nv, i) {
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
       σ = línea recta · π = arcos
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
            if (pi > 0) { s += '<path class="b-p" d="M124 49Q150 18 176 49"/>'; }
            if (pi > 1) { s += '<path class="b-p" d="M124 61Q150 92 176 61"/>'; }
        } else {
            s += '<line class="b-x" x1="120" y1="55" x2="180" y2="55"/>';
        }

        s += '<circle class="at" cx="92" cy="55" r="28"/><circle class="at" cx="208" cy="55" r="28"/>' +
            '<text class="t-at" x="92" y="64">' + r.e1.sym + '</text><text class="t-at" x="208" y="64">' + r.e2.sym + "</text></svg>";

        return s;
    }


    /* =========================================
       5. DIAGRAMA DE NIVELES DE ENERGÍA (SVG)
       Muestra k electrones colocados, uno a uno.
       ========================================= */

    var Y = [300, 235, 190, 150, 100, 55];

    function segmentos(d) { return d === 1 ? [[128, 212]] : [[104, 160], [180, 236]]; }

    function svgDiagrama(r, k, nuevo) {

        var oc = ocupacion(r.seq, k);
        var ult = (nuevo && k > 0) ? r.seq[k - 1] : null;

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
                    var sg = segmentos(NIV[i].n.length);
                    var q = l ? sg[sg.length - 1][1] : sg[0][0];
                    conex += '<line class="cx" x1="' + xa + '" y1="' + ao.y + '" x2="' + q + '" y2="' + Y[i] + '"/>';
                });

                atom += '<g class="ao"><line class="ln-ao" x1="' + x1 + '" y1="' + ao.y + '" x2="' + (x1 + 56) + '" y2="' + ao.y + '"/>' +
                    '<text class="t-ao" x="' + (x1 + 28) + '" y="' + (ao.y - 8) + '">' + ao.t + "</text></g>";
            });
        });

        /* Orbitales moleculares */
        NIV.forEach(function (nv, i) {

            var sg = segmentos(nv.n.length);

            nv.n.forEach(function (nm, o) {

                var e = oc[i][o], x1 = sg[o][0], x2 = sg[o][1], xm = (x1 + x2) / 2, y = Y[i];
                var esNuevo = ult && ult.i === i && ult.o === o;

                niv += '<g class="lv ' + nv.k + (e ? "" : " vac") + (e === 1 ? " des" : "") + '">' +
                    '<line class="ln" x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '"/>' +
                    (e ? '<text class="t-e' + (esNuevo ? " nuevo" : "") + '" x="' + xm + '" y="' + (y - 8) + '">' + (e === 2 ? "↑↓" : "↑") + "</text>" : "") +
                    '<text class="nm" x="' + xm + '" y="' + (y + 16) + '">' + nm + "</text></g>";
            });
        });

        return s + conex + atom + niv +
            '<text class="t-a" x="44" y="346">' + r.e1.sym + '</text><text class="t-a" x="296" y="346">' + r.e2.sym + "</text></svg>";
    }

    /* Explica qué regla se aplicó al último electrón colocado */
    function regla(r, k) {

        if (!k) { return "Pulsa + o ▶ para colocar los electrones de menor a mayor energía."; }

        var q = r.seq[k - 1], nv = NIV[q.i], d = nv.n.length, por;

        if (!q.up) { por = "Pauli: el segundo e⁻ del orbital entra con espín opuesto (↓)."; }
        else if (d === 2) { por = "Hund: 1 e⁻ en cada orbital de igual energía antes de aparearlos."; }
        else { por = "Aufbau: se ocupa el nivel libre de menor energía."; }

        return "e⁻ " + k + " → " + nv.n[q.o] + ". " + por;
    }


    /* =========================================
       6. PANTALLA DE RESULTADOS
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

        /* 1 · Resultado */
        out += '<section class="card">' + cab("fa-flask", "Resultado") +
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

        /* 2 · Diagrama (los electrones entran uno a uno) */
        out += '<section class="card">' + cab("fa-chart-simple", "Diagrama de niveles de energía") +
            '<div id="tom-dg" class="tom-dg" data-foco=""></div>' +
            '<div class="tom-ctl">' +
            '<button type="button" data-a="menos" aria-label="Quitar un electrón">−</button>' +
            '<div class="tom-cnt"><b id="tom-k">0</b> / ' + r.N + " e⁻</div>" +
            '<button type="button" data-a="mas" aria-label="Poner un electrón">+</button>' +
            '<button type="button" data-a="play" class="tom-play"></button>' +
            '<button type="button" data-a="reset" aria-label="Reiniciar"><i class="fa-solid fa-rotate-left"></i></button></div>' +
            '<p id="tom-regla" class="tom-regla"></p>' +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span></div>' +
            '<p class="tom-p tom-suave">Esquema cualitativo (no está a escala). Los orbitales atómicos están a los lados y los moleculares en el centro. ' +
            "Se usa el esquema de clase 2s–2p.</p></section>";

        /* 3 · Notación */
        var chips = "";
        NIV.forEach(function (nv, i) {
            nv.n.forEach(function (nm, o) {
                if (r.oc[i][o]) { chips += '<span class="tom-mo ' + nv.k + '">(' + nm + ")<sup>" + r.oc[i][o] + "</sup></span>"; }
            });
        });

        out += '<section class="card">' + cab("fa-atom", "Notación de orbitales moleculares") +
            '<div class="tom-notacion"><span class="tom-kk">KK</span><span class="tom-cor">[</span>' + chips + '<span class="tom-cor">]</span></div>' +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span></div>' +
            '<p class="tom-p tom-suave"><b>KK</b> = capas internas de ambos átomos (no cuentan).</p></section>';

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
            var cfg = e.cfg.map(function (p) {
                return '<span class="' + (+p[0].charAt(0) === e.n ? "tom-val" : "") + '">' + p[0] + sup(p[1]) + "</span>";
            }).join(" ");
            return '<div class="tom-fila"><b>' + e.sym + "</b> " + e.nom + " · Z = " + e.z +
                '<div class="tom-cfg">' + cfg + "</div>Capa de valencia (n = " + e.n + "): <b>" + textoValencia(e) + " = " + e.v + " e⁻</b></div>";
        }).join("");

        var nota = r.c > 0 ? "La carga positiva <b>quita</b> " + r.c + " e⁻." : (r.c < 0 ? "La carga negativa <b>agrega</b> " + (-r.c) + " e⁻." : "La molécula es neutra: no se agregan ni se quitan e⁻.");

        return filas + '<div class="tom-formula">' + formulaN(r) + "</div>" +
            '<p class="tom-p">' + nota + '</p><p class="tom-p tom-suave">Los electrones internos (capas llenas) no participan en el enlace.</p>';
    }

    function pasoLlenado(r) {
        return '<p class="tom-p">Orden de energía, de menor a mayor:</p>' +
            '<div class="tom-formula">σ2s &lt; σ*2s &lt; π2p &lt; σ2px &lt; π*2p &lt; σ*2px</div>' +
            '<ul class="tom-lista"><li><b>Aufbau:</b> los e⁻ ocupan primero los niveles de menor energía.</li>' +
            "<li><b>Pauli:</b> máximo 2 e⁻ por orbital, con espines opuestos.</li>" +
            "<li><b>Hund:</b> en orbitales de igual energía (π o π*) se pone 1 e⁻ en cada uno antes de aparear.</li></ul>" +
            '<p class="tom-p">Los <b>' + r.N + ' e⁻</b> quedan como en la notación KK[…]. Usa ▶ en el diagrama para verlos entrar uno a uno.</p>';
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
            ".</p><p class=\"tom-p\">Es <b>paramagnética</b>: un campo magnético la atrae.</p>"
            : '<p class="tom-p">Todos los e⁻ están apareados.</p><p class="tom-p">Es <b>diamagnética</b>: un campo magnético la repele débilmente.</p>';

        if (ISO[r.N]) {
            t += '<p class="tom-p tom-suave">Dato extra: con ' + r.N + " e⁻ de valencia tienen esta misma configuración " + ISO[r.N] + ".</p>";
        }
        return t;
    }


    /* =========================================
       7. INTERFAZ Y EVENTOS
       ========================================= */

    var est = { t: ["N", "O"], c: 1, r: null, k: 0, nuevo: false, timer: null };
    var raiz;

    function shell() {

        var campos = [0, 1].map(function (i) {
            return '<div class="tom-campo"><label for="tom-e' + i + '">Elemento ' + (i + 1) + "</label>" +
                '<input type="text" id="tom-e' + i + '" class="tom-input" data-i="' + i + '" list="tom-lista" placeholder="N, nitrógeno o 7" ' +
                'autocomplete="off" autocapitalize="off" spellcheck="false"><div class="tom-info" id="tom-i' + i + '"></div></div>';
        }).join("");

        var cargas = [-3, -2, -1, 0, 1, 2, 3].map(function (v) {
            return '<button type="button" class="tom-chip" data-a="carga" data-v="' + v + '">' + (v > 0 ? "+" + v : (v < 0 ? "−" + (-v) : "0")) + "</button>";
        }).join("");

        var lista = ELEMENTOS.map(function (e) { return '<option value="' + e.sym + '">' + e.nom + " · Z = " + e.z + "</option>"; }).join("");

        return '<section class="card">' + cab("fa-atom", "ENLACES · CALCULADORA TOM") +
            '<p class="tom-p">La <b>Teoría de Orbitales Moleculares</b> combina los orbitales de dos átomos en orbitales de toda la molécula. ' +
            "Elige los elementos y la carga: el resultado es inmediato y cada paso se explica abajo.</p></section>" +
            '<section class="card"><div class="tom-campos">' + campos + "</div>" +
            '<div class="tom-sub">Carga de la molécula o ion</div><div class="tom-chips">' + cargas + "</div>" +
            '<button type="button" class="tom-borrar" data-a="borrar"><i class="fa-solid fa-eraser"></i> Borrar</button></section>' +
            '<div id="tom-res" aria-live="polite"></div><datalist id="tom-lista">' + lista + "</datalist>";
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
            d.innerHTML = "Z = " + e.z + " · valencia <b>" + e.v + " e⁻</b> · " + textoValencia(e);
        } else if (!texto.trim()) {
            d.className = "tom-info";
            d.textContent = "Escribe un elemento";
        } else {
            d.className = "tom-info mal";
            d.textContent = "No encontré ese elemento";
        }
    }

    function detener() {
        if (est.timer) { clearInterval(est.timer); est.timer = null; }
        var p = raiz.querySelector('[data-a="play"]');
        if (p) { p.innerHTML = '<i class="fa-solid fa-play"></i> Reproducir'; }
    }

    function pintarDiagrama() {

        var r = est.r;
        if (!r || r.err || !$("tom-dg")) { return; }

        $("tom-dg").innerHTML = svgDiagrama(r, est.k, est.nuevo);
        $("tom-k").textContent = est.k;
        $("tom-regla").textContent = regla(r, est.k);

        raiz.querySelector('[data-a="menos"]').disabled = (est.k === 0);
        raiz.querySelector('[data-a="mas"]').disabled = (est.k >= r.N);

        var p = raiz.querySelector('[data-a="play"]');
        p.innerHTML = est.timer ? '<i class="fa-solid fa-pause"></i> Pausa' : '<i class="fa-solid fa-play"></i> Reproducir';
    }

    function calcular() {

        detener();

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
        est.k = r.err ? 0 : r.N;
        est.nuevo = false;

        cont.innerHTML = r.err
            ? aviso("<b>No se puede calcular.</b> " + r.err + '<div class="tom-formula">' + formulaN(r) + "</div>", "err")
            : htmlResultado(r);

        cont.classList.remove("tom-in");
        void cont.offsetWidth;
        cont.classList.add("tom-in");

        pintarDiagrama();
    }

    function alClick(ev) {

        var sm = ev.target.closest("summary");
        if (sm) {
            setTimeout(function () { sm.parentNode.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, 80);
            return;
        }

        var b = ev.target.closest("[data-a]");
        if (!b || b.disabled) { return; }

        var a = b.dataset.a, r = est.r;

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
        } else if (a === "mas" || a === "menos") {
            detener();
            est.k = Math.max(0, Math.min(r.N, est.k + (a === "mas" ? 1 : -1)));
            est.nuevo = true;
            pintarDiagrama();
        } else if (a === "reset") {
            detener();
            est.k = 0;
            est.nuevo = false;
            pintarDiagrama();
        } else if (a === "play") {
            if (est.timer) { detener(); return; }
            if (est.k >= r.N) { est.k = 0; }
            est.nuevo = true;
            est.timer = setInterval(function () {
                if (est.k >= r.N) { detener(); pintarDiagrama(); return; }
                est.k++;
                pintarDiagrama();
            }, 700);
            pintarDiagrama();
        }
    }

    function alEscribir(ev) {
        if (ev.target.classList && ev.target.classList.contains("tom-input")) {
            est.t[+ev.target.dataset.i] = ev.target.value;
            calcular();
        }
    }

    /* Un solo paso abierto a la vez; el diagrama resalta lo que se explica */
    function alAbrirPaso(ev) {

        var d = ev.target;
        if (!d.classList || !d.classList.contains("tom-paso") || !d.open) { return; }

        raiz.querySelectorAll(".tom-paso").forEach(function (o) { if (o !== d) { o.open = false; } });

        var dg = $("tom-dg");
        if (dg) { dg.dataset.foco = ({ "3": "oe", "4": "mag" })[d.dataset.n] || ""; }
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
        raiz.addEventListener("toggle", alAbrirPaso, true);

        marcarCarga();
        calcular();
    }

    /* Para probar desde la consola: TOM.analizar(TOM.buscar("N"), TOM.buscar("O"), 1) */
    window.TOM = { buscar: buscar, analizar: analizar };

    document.addEventListener("DOMContentLoaded", iniciar);

})();
