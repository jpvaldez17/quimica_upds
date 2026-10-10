/* =========================================
   QUÍMICA UPDS
   ENLACES · Calculadora de Orbitales Moleculares (TOM)
   Developed by J. Poma · 2026
   ========================================= */

(function () {

    "use strict";


    /* =========================================
       1. DATOS DE LOS ELEMENTOS
       ========================================= */

    var SIMBOLOS = ("H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn " +
        "Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm " +
        "Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu " +
        "Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og").split(" ");

    var NOMBRES = ["Hidrógeno", "Helio", "Litio", "Berilio", "Boro", "Carbono", "Nitrógeno", "Oxígeno", "Flúor", "Neón",
        "Sodio", "Magnesio", "Aluminio", "Silicio", "Fósforo", "Azufre", "Cloro", "Argón", "Potasio", "Calcio",
        "Escandio", "Titanio", "Vanadio", "Cromo", "Manganeso", "Hierro", "Cobalto", "Níquel", "Cobre", "Zinc",
        "Galio", "Germanio", "Arsénico", "Selenio", "Bromo", "Kriptón", "Rubidio", "Estroncio", "Itrio", "Circonio",
        "Niobio", "Molibdeno", "Tecnecio", "Rutenio", "Rodio", "Paladio", "Plata", "Cadmio", "Indio", "Estaño",
        "Antimonio", "Telurio", "Yodo", "Xenón", "Cesio", "Bario", "Lantano", "Cerio", "Praseodimio", "Neodimio",
        "Prometio", "Samario", "Europio", "Gadolinio", "Terbio", "Disprosio", "Holmio", "Erbio", "Tulio", "Iterbio",
        "Lutecio", "Hafnio", "Tántalo", "Wolframio", "Renio", "Osmio", "Iridio", "Platino", "Oro", "Mercurio",
        "Talio", "Plomo", "Bismuto", "Polonio", "Astato", "Radón", "Francio", "Radio", "Actinio", "Torio",
        "Protactinio", "Uranio", "Neptunio", "Plutonio", "Americio", "Curio", "Berkelio", "Californio", "Einstenio", "Fermio",
        "Mendelevio", "Nobelio", "Lawrencio", "Rutherfordio", "Dubnio", "Seaborgio", "Bohrio", "Hasio", "Meitnerio", "Darmstatio",
        "Roentgenio", "Copernicio", "Nihonio", "Flerovio", "Moscovio", "Livermorio", "Teneso", "Oganesón"];

    /* Electronegatividad de Pauling (para polaridad y posición de los niveles) */
    var EN = {
        H: 2.20, Li: 0.98, Be: 1.57, B: 2.04, C: 2.55, N: 3.04, O: 3.44, F: 3.98,
        Na: 0.93, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Cl: 3.16,
        K: 0.82, Ca: 1.00, Sc: 1.36, Ti: 1.54, V: 1.63, Cr: 1.66, Mn: 1.55, Fe: 1.83, Co: 1.88, Ni: 1.91,
        Cu: 1.90, Zn: 1.65, Ga: 1.81, Ge: 2.01, As: 2.18, Se: 2.55, Br: 2.96, Kr: 3.00,
        Rb: 0.82, Sr: 0.95, Y: 1.22, Zr: 1.33, Nb: 1.60, Mo: 2.16, Tc: 1.90, Ru: 2.20, Rh: 2.28, Pd: 2.20,
        Ag: 1.93, Cd: 1.69, In: 1.78, Sn: 1.96, Sb: 2.05, Te: 2.10, I: 2.66, Xe: 2.60,
        Cs: 0.79, Ba: 0.89, La: 1.10, Hf: 1.30, Ta: 1.50, W: 2.36, Re: 1.90, Os: 2.20, Ir: 2.20, Pt: 2.28,
        Au: 2.54, Hg: 2.00, Tl: 1.62, Pb: 2.33, Bi: 2.02, Po: 2.00, At: 2.20, Rn: 2.20, Fr: 0.70, Ra: 0.90
    };

    /* Orden de llenado (regla de Madelung) */
    var ORDEN = [["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2], ["3d", 10], ["4p", 6],
        ["5s", 2], ["4d", 10], ["5p", 6], ["6s", 2], ["4f", 14], ["5d", 10], ["6p", 6], ["7s", 2],
        ["5f", 14], ["6d", 10], ["7p", 6]];

    /* Excepciones conocidas (se mueven electrones entre subniveles) */
    var EXCEPCIONES = {
        24: { "4s": -1, "3d": 1 }, 29: { "4s": -1, "3d": 1 }, 41: { "5s": -1, "4d": 1 },
        42: { "5s": -1, "4d": 1 }, 44: { "5s": -1, "4d": 1 }, 45: { "5s": -1, "4d": 1 },
        46: { "5s": -2, "4d": 2 }, 47: { "5s": -1, "4d": 1 }, 57: { "4f": -1, "5d": 1 },
        58: { "4f": -1, "5d": 1 }, 64: { "4f": -1, "5d": 1 }, 78: { "6s": -1, "5d": 1 },
        79: { "6s": -1, "5d": 1 }, 89: { "5f": -1, "6d": 1 }, 90: { "5f": -2, "6d": 2 },
        91: { "5f": -1, "6d": 1 }, 92: { "5f": -1, "6d": 1 }, 93: { "5f": -1, "6d": 1 },
        96: { "5f": -1, "6d": 1 }, 103: { "6d": -1, "7p": 1 }
    };

    var SUPERINDICES = "⁰¹²³⁴⁵⁶⁷⁸⁹";

    function sup(n) {
        return String(n).split("").map(function (d) { return SUPERINDICES.charAt(+d); }).join("");
    }

    /* Configuración electrónica + electrones de valencia (capa más externa) */
    function configuracion(z) {

        var resto = z;
        var sub = {};

        for (var i = 0; i < ORDEN.length && resto > 0; i++) {
            var n = Math.min(ORDEN[i][1], resto);
            sub[ORDEN[i][0]] = n;
            resto -= n;
        }

        var exc = EXCEPCIONES[z];
        if (exc) {
            for (var k in exc) {
                sub[k] = (sub[k] || 0) + exc[k];
            }
        }

        var letras = "spdf";
        var lista = Object.keys(sub).filter(function (k) { return sub[k] > 0; }).sort(function (a, b) {
            var na = parseInt(a.charAt(0), 10);
            var nb = parseInt(b.charAt(0), 10);
            return na !== nb ? na - nb : letras.indexOf(a.charAt(1)) - letras.indexOf(b.charAt(1));
        });

        var nMax = 0;
        lista.forEach(function (k) { nMax = Math.max(nMax, parseInt(k.charAt(0), 10)); });

        var valencia = 0;
        lista.forEach(function (k) {
            if (parseInt(k.charAt(0), 10) === nMax) { valencia += sub[k]; }
        });

        return { sub: sub, lista: lista, nMax: nMax, valencia: valencia };
    }

    var ELEMENTOS = SIMBOLOS.map(function (s, i) {
        var c = configuracion(i + 1);
        return {
            z: i + 1,
            sym: s,
            nombre: NOMBRES[i],
            en: (EN[s] === undefined ? null : EN[s]),
            cfg: c,
            v: c.valencia,
            n: c.nMax
        };
    });

    function normalizar(t) {
        return String(t || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .replace(/\.$/, "")
            .trim();
    }

    function buscarElemento(texto) {

        var t = normalizar(texto);
        if (!t) { return null; }

        if (/^\d+$/.test(t)) {
            var z = parseInt(t, 10);
            return (z >= 1 && z <= 118) ? ELEMENTOS[z - 1] : null;
        }

        for (var i = 0; i < ELEMENTOS.length; i++) {
            if (normalizar(ELEMENTOS[i].sym) === t || normalizar(ELEMENTOS[i].nombre) === t) {
                return ELEMENTOS[i];
            }
        }
        return null;
    }


    /* =========================================
       2. ESQUEMAS DE ORBITALES MOLECULARES
       (de menor a mayor energía)
       ========================================= */

    /* kind: enl = enlazante · anti = antienlazante · nb = no enlazante
       deg : orbitales de igual energía (π son 2) · y: altura en el diagrama */

    var ESQUEMAS = {

        /* El esquema de clase: 2s y 2p de cada átomo (hasta 16 e⁻) */
        general: {
            niveles: [
                { k: "s", kind: "enl", tipo: "σ", deg: 1, y: 350, nombres: function (n) { return ["σ" + n + "s"]; } },
                { k: "s*", kind: "anti", tipo: "σ", deg: 1, y: 262, nombres: function (n) { return ["σ*" + n + "s"]; } },
                { k: "pi", kind: "enl", tipo: "π", deg: 2, y: 212, nombres: function (n) { return ["π" + n + "py", "π" + n + "pz"]; } },
                { k: "sp", kind: "enl", tipo: "σ", deg: 1, y: 172, nombres: function (n) { return ["σ" + n + "px"]; } },
                { k: "pi*", kind: "anti", tipo: "π", deg: 2, y: 112, nombres: function (n) { return ["π*" + n + "py", "π*" + n + "pz"]; } },
                { k: "sp*", kind: "anti", tipo: "σ", deg: 1, y: 62, nombres: function (n) { return ["σ*" + n + "px"]; } }
            ]
        },

        /* Solo orbitales s (H₂, He₂, HeH⁺, LiH...) */
        ss: {
            niveles: [
                { k: "s", kind: "enl", tipo: "σ", deg: 1, y: 290, nombres: function (n) { return ["σ" + n + "s"]; } },
                { k: "s*", kind: "anti", tipo: "σ", deg: 1, y: 130, nombres: function (n) { return ["σ*" + n + "s"]; } }
            ]
        },

        /* Hidruro diatómico A–H (HF, OH⁻, HCl...) */
        hidruro: {
            niveles: [
                { k: "nb", kind: "nb", tipo: "σ", deg: 1, y: 340, nombres: function () { return ["σnb"]; } },
                { k: "enl", kind: "enl", tipo: "σ", deg: 1, y: 255, nombres: function () { return ["σ"]; } },
                { k: "pi", kind: "nb", tipo: "π", deg: 2, y: 195, nombres: function () { return ["πnb(y)", "πnb(z)"]; } },
                { k: "anti", kind: "anti", tipo: "σ", deg: 1, y: 70, nombres: function () { return ["σ*"]; } }
            ]
        }
    };

    function esquemaPara(e1, e2, criterio) {

        if (criterio === "docente") { return "general"; }

        var h1 = e1.z <= 2;
        var h2 = e2.z <= 2;

        if (h1 && h2) { return "ss"; }

        if (h1 || h2) {
            var otro = h1 ? e2 : e1;
            return otro.v >= 3 ? "hidruro" : "ss";
        }

        return "general";
    }

    function capacidad(esq) {
        return esq.niveles.reduce(function (s, nv) { return s + nv.deg * 2; }, 0);
    }


    /* =========================================
       3. MOTOR DE CÁLCULO · 2 ELEMENTOS
       ========================================= */

    function textoCarga(c) {
        if (c === 0) { return ""; }
        if (c > 0) { return (c > 1 ? sup(c) : "") + "⁺"; }
        return (c < -1 ? sup(-c) : "") + "⁻";
    }

    function fmt(x) {
        return String(Math.round(x * 10) / 10);
    }

    function analizar2(e1, e2, carga, criterio) {

        var N = e1.v + e2.v - carga;
        var clave = esquemaPara(e1, e2, criterio);
        var esq = ESQUEMAS[clave];
        var cap = capacidad(esq);

        var r = { e1: e1, e2: e2, carga: carga, N: N, criterio: criterio, clave: clave, esq: esq, cap: cap };

        if (N < 1) {
            r.error = "Con esa carga no quedan electrones de valencia (N = " + N + "). Reduce la carga positiva.";
            return r;
        }

        if (N > cap) {
            r.error = "Este esquema admite como máximo " + cap + " e⁻ de valencia y aquí hay " + N +
                ". Reduce la carga negativa o elige otros elementos.";
            return r;
        }

        var n = (e1.n === e2.n) ? String(e1.n) : "";
        var restante = N;
        var niveles = [];
        var orbs = [];

        esq.niveles.forEach(function (def, li) {

            var e = Math.min(def.deg * 2, restante);
            restante -= e;

            /* Regla de Hund: 1 e⁻ en cada orbital degenerado antes de aparear */
            var occ = [];
            for (var k = 0; k < def.deg; k++) { occ.push(0); }
            for (var i = 0; i < e; i++) { occ[i % def.deg]++; }

            var nombres = def.nombres(n);
            niveles.push({ def: def, occ: occ, nombres: nombres });

            occ.forEach(function (o, j) {
                orbs.push({ nombre: nombres[j], kind: def.kind, tipo: def.tipo, occ: o, nivel: li });
            });
        });

        var enl = 0, anti = 0, nb = 0, pi = 0, pia = 0;
        var desap = [];

        orbs.forEach(function (o) {
            if (o.kind === "enl") { enl += o.occ; if (o.tipo === "π") { pi += o.occ; } }
            if (o.kind === "anti") { anti += o.occ; if (o.tipo === "π") { pia += o.occ; } }
            if (o.kind === "nb") { nb += o.occ; }
            if (o.occ === 1) { desap.push(o.nombre); }
        });

        var OE = (enl - anti) / 2;
        var piNeto = (pi - pia) / 2;
        var sigmaNeto = OE - piNeto;

        r.niveles = niveles;
        r.orbs = orbs;
        r.enl = enl;
        r.anti = anti;
        r.nb = nb;
        r.pi = pi;
        r.pia = pia;
        r.OE = OE;
        r.piNeto = piNeto;
        r.sigmaNeto = sigmaNeto;
        r.desap = desap;
        r.para = desap.length > 0;
        r.n = n;
        r.impar = (N % 2 === 1);
        r.existe = OE > 0 && !(criterio === "docente" && r.impar);

        r.dEN = (e1.en !== null && e2.en !== null) ? Math.abs(e1.en - e2.en) : null;

        return r;
    }


    /* =========================================
       4. MOTOR DE CÁLCULO · 3 ELEMENTOS (lineal A–B–C)
       Estructura de Lewis con la regla del octeto
       ========================================= */

    function analizar3(a, b, c, carga) {

        var V = a.v + b.v + c.v - carga;
        var r = { a: a, b: b, c: c, carga: carga, V: V, atomos: [a, b, c] };

        if (b.z <= 2) {
            r.error = "El hidrógeno (y el helio) no pueden ser el átomo central: solo forman un enlace. Colócalo en un extremo.";
            return r;
        }

        if (V < 2) {
            r.error = "Con esa carga no quedan electrones de valencia suficientes (V = " + V + ").";
            return r;
        }

        if (V > 24) {
            r.error = "Con " + V + " e⁻ de valencia la regla del octeto no alcanza (máximo 24). Reduce la carga negativa.";
            return r;
        }

        r.impar = (V % 2 === 1);

        if (r.impar) {
            return r;
        }

        function objetivo(x) { return x.z <= 2 ? 2 : 8; }
        function maxEnlace(x) { return x.z <= 2 ? 1 : 3; }

        var S = objetivo(a) + objetivo(b) + objetivo(c);
        r.S = S;
        r.compartidos = S - V;

        var mejor = null;

        for (var b1 = 1; b1 <= maxEnlace(a); b1++) {
            for (var b2 = 1; b2 <= maxEnlace(c); b2++) {

                var usados = 2 * (b1 + b2);
                if (usados > V) { continue; }

                var pares = (V - usados) / 2;

                var lp1 = Math.min(pares, Math.max(0, (objetivo(a) - 2 * b1) / 2));
                pares -= lp1;
                var lp2 = Math.min(pares, Math.max(0, (objetivo(c) - 2 * b2) / 2));
                pares -= lp2;
                var lpB = pares;

                var bondsAtom = [b1, b1 + b2, b2];
                var lps = [lp1, lpB, lp2];
                var e = [2 * b1 + 2 * lp1, 2 * (b1 + b2) + 2 * lpB, 2 * b2 + 2 * lp2];
                var objs = [objetivo(a), objetivo(b), objetivo(c)];
                var atomos = [a, b, c];

                var viol = 0, suma = 0, pen = 0, maxAbs = 0;
                var fc = [];

                for (var i = 0; i < 3; i++) {
                    if (e[i] !== objs[i]) { viol++; }
                    var f = atomos[i].v - (2 * lps[i] + bondsAtom[i]);
                    fc.push(f);
                    suma += Math.abs(f);
                    maxAbs = Math.max(maxAbs, Math.abs(f));
                    pen += f * (atomos[i].en === null ? 2.5 : atomos[i].en);
                }

                var cand = { b1: b1, b2: b2, lp: lps, e: e, fc: fc, viol: viol, suma: suma, maxAbs: maxAbs, pen: pen };

                /* Criterios: menos excepciones al octeto → menor suma de cargas formales →
                   cargas más repartidas → carga negativa en el átomo más electronegativo */
                if (mejor === null ||
                    cand.viol < mejor.viol ||
                    (cand.viol === mejor.viol && cand.suma < mejor.suma) ||
                    (cand.viol === mejor.viol && cand.suma === mejor.suma && cand.maxAbs < mejor.maxAbs) ||
                    (cand.viol === mejor.viol && cand.suma === mejor.suma && cand.maxAbs === mejor.maxAbs && cand.pen < mejor.pen - 1e-9)) {
                    mejor = cand;
                }
            }
        }

        if (mejor === null) {
            r.error = "No hay electrones suficientes para formar los dos enlaces A–B y B–C (V = " + V + ").";
            return r;
        }

        r.est = mejor;
        r.dominios = 2 + mejor.lp[1];
        r.lineal = (r.dominios === 2);

        /* Polaridad */
        var d1 = (a.en !== null && b.en !== null) ? Math.abs(a.en - b.en) : null;
        var d2 = (c.en !== null && b.en !== null) ? Math.abs(c.en - b.en) : null;
        r.dEN = [d1, d2];

        var algunPolar = (d1 !== null && d1 >= 0.4) || (d2 !== null && d2 >= 0.4);
        if (r.lineal && a.z === c.z && mejor.b1 === mejor.b2) {
            r.polaridad = "apolar";
        } else if (algunPolar || r.lineal) {
            r.polaridad = "polar";
        } else {
            r.polaridad = "polar";
        }

        r.desapareados = 0;
        r.para = false;

        return r;
    }


    /* =========================================
       5. ESTADO DE LA INTERFAZ
       ========================================= */

    var estado = {
        modo: "2",
        criterio: "docente",
        diagrama: false,
        txt: { "2": ["N", "O"], "3": ["O", "C", "O"] },
        carga: { "2": 1, "3": 0 }
    };

    var EJEMPLOS_CLASE = [
        { t: "NO⁺", s: ["N", "O"], c: 1 }, { t: "SiCl⁻", s: ["Si", "Cl"], c: -1 }, { t: "PF⁻", s: ["P", "F"], c: -1 },
        { t: "CN⁻", s: ["C", "N"], c: -1 }, { t: "BO⁺", s: ["B", "O"], c: 1 }, { t: "AsBr²⁺", s: ["As", "Br"], c: 2 },
        { t: "PbI⁻", s: ["Pb", "I"], c: -1 }, { t: "NF²⁺", s: ["N", "F"], c: 2 }, { t: "HgF⁻", s: ["Hg", "F"], c: -1 },
        { t: "SbH⁻", s: ["Sb", "H"], c: -1 }
    ];

    var EJEMPLOS_CLASICOS = [
        { t: "N₂", s: ["N", "N"], c: 0 }, { t: "O₂", s: ["O", "O"], c: 0 }, { t: "B₂", s: ["B", "B"], c: 0 },
        { t: "F₂", s: ["F", "F"], c: 0 }, { t: "NO", s: ["N", "O"], c: 0 }, { t: "CO", s: ["C", "O"], c: 0 },
        { t: "HF", s: ["H", "F"], c: 0 }
    ];

    var EJEMPLOS_3 = [
        { t: "CO₂", s: ["O", "C", "O"], c: 0 }, { t: "HCN", s: ["H", "C", "N"], c: 0 }, { t: "N₂O", s: ["N", "N", "O"], c: 0 },
        { t: "OCS", s: ["O", "C", "S"], c: 0 }, { t: "CS₂", s: ["S", "C", "S"], c: 0 }, { t: "NO₂⁺", s: ["O", "N", "O"], c: 1 },
        { t: "N₃⁻", s: ["N", "N", "N"], c: -1 }, { t: "OCN⁻", s: ["O", "C", "N"], c: -1 }, { t: "BeH₂", s: ["H", "Be", "H"], c: 0 },
        { t: "H₂O", s: ["H", "O", "H"], c: 0 }, { t: "SO₂", s: ["O", "S", "O"], c: 0 }
    ];

    function $(id) { return document.getElementById(id); }


    /* =========================================
       6. PIEZAS DE HTML
       ========================================= */

    function htmlConfig(e) {
        return e.cfg.lista.map(function (k) {
            var esVal = parseInt(k.charAt(0), 10) === e.cfg.nMax;
            return '<span class="' + (esVal ? "tom-val" : "") + '">' + k + sup(e.cfg.sub[k]) + "</span>";
        }).join(" ");
    }

    function htmlValencia(e) {
        return e.cfg.lista.filter(function (k) { return parseInt(k.charAt(0), 10) === e.cfg.nMax; })
            .map(function (k) { return k + sup(e.cfg.sub[k]); }).join(" ");
    }

    function aviso(texto, clase) {
        return '<div class="tom-aviso ' + (clase || "") + '">' + texto + "</div>";
    }

    function paso(num, titulo, cuerpo, abierto) {
        return '<details class="tom-paso"' + (abierto === false ? "" : " open") + ">" +
            '<summary><span class="tom-num">' + num + "</span><span>" + titulo + "</span></summary>" +
            '<div class="tom-cuerpo">' + cuerpo + "</div></details>";
    }

    function tile(valor, etiqueta, clase) {
        return '<div class="tom-tile ' + (clase || "") + '"><div class="tom-tile-v">' + valor +
            '</div><div class="tom-tile-e">' + etiqueta + "</div></div>";
    }

    function chipMO(o) {
        return '<span class="tom-mo ' + o.kind + '"><span class="tom-mo-n">(' + o.nombre + ")</span><sup>" + o.occ + "</sup></span>";
    }

    function simboloEnlace(oe) {
        if (oe <= 0) { return "✕"; }
        if (oe === 1) { return "—"; }
        if (oe === 2) { return "═"; }
        if (oe >= 3) { return "≡"; }
        return "⋯";
    }

    function nombreOrden(oe) {
        var t = { 0: "sin enlace", 0.5: "enlace de medio orden", 1: "enlace simple", 1.5: "enlace de orden 1.5",
            2: "enlace doble", 2.5: "enlace de orden 2.5", 3: "enlace triple" };
        return t[oe] || ("orden " + fmt(oe));
    }

    function nombreCorto(oe) {
        var t = { 0: "Ninguno", 0.5: "Medio", 1: "Simple", 1.5: "1.5", 2: "Doble", 2.5: "2.5", 3: "Triple" };
        return t[oe] || fmt(oe);
    }

    function desglose(sigma, pi) {
        var partes = [];
        if (sigma > 0) { partes.push(fmt(sigma) + "σ"); }
        if (pi > 0) { partes.push(fmt(pi) + "π"); }
        return partes.length ? partes.join(" + ") : "—";
    }

    function textoPolaridad(d) {
        if (d === null) { return null; }
        if (d < 0.4) { return "enlace covalente apolar (casi sin diferencia de electronegatividad)"; }
        if (d <= 1.7) { return "enlace covalente polar (los e⁻ se desplazan hacia el más electronegativo)"; }
        return "enlace de carácter iónico (la TOM covalente lo describe solo de forma aproximada)";
    }

    function htmlPasoElectrones(e1, e2, carga, N) {

        var filas = [e1, e2].map(function (e) {
            return '<div class="tom-fila"><div class="tom-fila-t"><b>' + e.sym + "</b> " + e.nombre + " · Z = " + e.z + "</div>" +
                '<div class="tom-config">' + htmlConfig(e) + "</div>" +
                '<div class="tom-fila-v">Capa de valencia (n = ' + e.n + "): <b>" + htmlValencia(e) + " = " + e.v + " e⁻</b></div></div>";
        }).join("");

        var formula = e1.v + " (" + e1.sym + ") + " + e2.v + " (" + e2.sym + ")";
        var explica = "";

        if (carga > 0) {
            formula += " − " + carga;
            explica = "La carga positiva significa que se <b>quitan</b> " + carga + " e⁻.";
        } else if (carga < 0) {
            formula += " + " + (-carga);
            explica = "La carga negativa significa que se <b>agregan</b> " + (-carga) + " e⁻.";
        }

        return paso(1, "Cuenta los electrones de valencia",
            filas +
            '<div class="tom-formula">' + formula + " = <b>" + N + " e⁻</b></div>" +
            (explica ? '<p class="tom-p">' + explica + "</p>" : "") +
            '<p class="tom-p tom-suave">Los electrones internos (capas llenas) no participan en el enlace.</p>');
    }

    function htmlEstructura2(r) {

        var oe = r.OE;
        var c = textoCarga(r.carga);
        var abre = r.carga !== 0 ? '<span class="tom-corchete">[</span>' : "";
        var plana = (Math.abs(r.carga) > 1 ? Math.abs(r.carga) : "") + (r.carga > 0 ? "+" : "−");
        var cierra = r.carga !== 0 ? '<span class="tom-corchete">]</span><span class="tom-carga">' + plana + "</span>" : "";

        return '<div class="tom-estructura">' + abre +
            '<span class="tom-atomo">' + r.e1.sym + "</span>" +
            '<span class="tom-enlace' + (r.existe ? "" : " roto") + '">' + simboloEnlace(oe) + "</span>" +
            '<span class="tom-atomo">' + r.e2.sym + "</span>" + cierra + "</div>" +
            '<div class="tom-leyenda-e">' + (oe > 0 ? "Orden de enlace " + fmt(oe) + " · " + nombreOrden(oe) : "No se forma enlace") + "</div>";
    }

    function htmlPasoLlenado(r) {

        var ocupados = r.orbs.filter(function (o) { return o.occ > 0; });
        var chips = ocupados.map(chipMO).join(" ");

        var leyenda = '<span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span>' +
            (r.nb > 0 || r.clave === "hidruro" ? '<span class="tom-lg nb">no enlazante</span>' : "");

        var cuerpo = '<div class="tom-notacion"><span class="tom-kk">KK</span><span class="tom-corchete">[</span>' + chips +
            '<span class="tom-corchete">]</span></div>' +
            '<div class="tom-leyenda">' + leyenda + "</div>" +
            '<p class="tom-p">Los <b>' + r.N + " e⁻</b> se colocan de menor a mayor energía:</p>" +
            '<ul class="tom-lista"><li><b>Pauli:</b> máximo 2 e⁻ por orbital.</li>' +
            "<li><b>Hund:</b> en orbitales de igual energía (π o π*) se pone 1 e⁻ en cada uno antes de aparear.</li></ul>" +
            '<p class="tom-p tom-suave"><b>KK</b> = capas internas de ambos átomos (no cuentan).</p>';

        if (r.clave === "hidruro") {
            cuerpo += '<p class="tom-p tom-suave">σnb y πnb son orbitales <b>no enlazantes</b> del átomo distinto de H: no aportan al enlace.</p>';
        }

        return paso(2, "Llena los orbitales moleculares", cuerpo);
    }

    function htmlPasoOrden(r) {

        var oe = r.OE;
        var f = "(" + r.enl + " − " + r.anti + ") / 2 = <b>" + fmt(oe) + "</b>";

        var cuerpo = '<p class="tom-p">Orden de enlace = (e⁻ enlazantes − e⁻ antienlazantes) / 2</p>' +
            '<div class="tom-formula">OE = ' + f + "</div>" +
            '<div class="tom-dos"><div><span class="tom-lg enl">enlazantes</span> ' + r.enl + " e⁻</div>" +
            '<div><span class="tom-lg anti">antienlazantes</span> ' + r.anti + " e⁻</div></div>";

        if (r.nb > 0) {
            cuerpo += '<p class="tom-p tom-suave">Los ' + r.nb + " e⁻ no enlazantes no se cuentan.</p>";
        }

        if (oe > 0) {
            cuerpo += '<p class="tom-p">Resultado: <b>' + nombreOrden(oe) + "</b> (" + desglose(r.sigmaNeto, r.piNeto) + ").</p>" +
                '<p class="tom-p tom-suave">π: (' + r.pi + " − " + r.pia + ") / 2 = " + fmt(r.piNeto) +
                " · σ: " + fmt(oe) + " − " + fmt(r.piNeto) + " = " + fmt(r.sigmaNeto) + ".</p>" +
                '<p class="tom-p tom-suave">A mayor orden de enlace: mayor energía de enlace y menor longitud.</p>';
        } else {
            cuerpo += '<p class="tom-p">OE = 0: los electrones antienlazantes cancelan a los enlazantes, <b>no se forma un enlace estable</b>.</p>';
        }

        return paso(3, "Calcula el orden de enlace", cuerpo);
    }

    function htmlPasoMagnetismo(r) {

        var cuerpo;

        if (r.para) {
            cuerpo = '<p class="tom-p"><b>' + r.desap.length + " e⁻ desapareado" + (r.desap.length > 1 ? "s" : "") +
                "</b> en " + r.desap.join(" y ") + ".</p>" +
                '<p class="tom-p">Con electrones desapareados es <b>paramagnética</b>: es atraída por un campo magnético.</p>';
        } else {
            cuerpo = '<p class="tom-p">Todos los e⁻ están apareados.</p>' +
                '<p class="tom-p">Es <b>diamagnética</b>: es repelida débilmente por un campo magnético.</p>';
        }

        return paso(4, "Revisa el magnetismo", cuerpo);
    }

    function htmlPasoPolaridad(r) {

        var cuerpo;

        if (r.e1.sym === r.e2.sym) {
            cuerpo = '<p class="tom-p">Los dos átomos son iguales: ΔEN = 0, enlace <b>covalente apolar</b>.</p>';
        } else if (r.dEN === null) {
            cuerpo = '<p class="tom-p">No hay un valor de electronegatividad registrado para uno de los elementos.</p>';
        } else {
            cuerpo = '<p class="tom-p">ΔEN = |' + r.e1.en.toFixed(2) + " − " + r.e2.en.toFixed(2) + "| = <b>" + r.dEN.toFixed(2) +
                "</b> → " + textoPolaridad(r.dEN) + ".</p>";
        }

        return paso(5, "Dato extra: polaridad", cuerpo, false);
    }


    /* =========================================
       7. DIAGRAMA DE NIVELES DE ENERGÍA (SVG)
       ========================================= */

    function svgDiagrama(r) {

        var W = 340, H = 412;
        var e1 = r.e1, e2 = r.e2;
        var colores = { enl: "#1686c9", anti: "#d4144e", nb: "#6b7280" };

        /* Desplazamiento de los niveles atómicos según la electronegatividad */
        var d = 0;
        if (e1.en !== null && e2.en !== null && r.clave !== "hidruro") {
            d = Math.max(-26, Math.min(26, (e2.en - e1.en) * 13));
        }
        var sh = [-d / 2, d / 2];

        /* Niveles atómicos y a qué niveles moleculares se conectan */
        var ao = [];

        if (r.clave === "general") {
            [0, 1].forEach(function (i) {
                var e = (i === 0 ? e1 : e2);
                var ns = Math.min(e.v, 2);
                var np = Math.max(0, Math.min(6, e.v - 2));
                ao.push({ lado: i, y: 300 + sh[i], txt: e.n + "s" + sup(ns), vincula: ["s", "s*"] });
                ao.push({ lado: i, y: 150 + sh[i], txt: e.n + "p" + (np > 0 ? sup(np) : ""), vincula: ["pi", "sp", "pi*", "sp*"] });
            });
        } else if (r.clave === "ss") {
            [0, 1].forEach(function (i) {
                var e = (i === 0 ? e1 : e2);
                ao.push({ lado: i, y: 210 + sh[i], txt: e.n + "s" + sup(Math.min(e.v, 2)), vincula: ["s", "s*"] });
            });
        } else {
            var iH = (e1.z <= 2) ? 0 : 1;
            var iX = 1 - iH;
            var X = (iX === 0 ? e1 : e2);
            var Hh = (iH === 0 ? e1 : e2);
            ao.push({ lado: iX, y: 320, txt: X.n + "s" + sup(Math.min(X.v, 2)), vincula: ["nb"] });
            ao.push({ lado: iX, y: 185, txt: X.n + "p" + sup(Math.max(0, X.v - 2)), vincula: ["enl", "pi", "anti"] });
            ao.push({ lado: iH, y: 165, txt: Hh.n + "s" + sup(Math.min(Hh.v, 2)), vincula: ["enl", "anti"] });
        }

        /* Posición horizontal de cada segmento de nivel molecular */
        function segmentos(deg) {
            return deg === 1 ? [[130, 210]] : [[112, 160], [180, 228]];
        }

        var s = '<svg viewBox="0 0 ' + W + " " + H + '" class="tom-svg" role="img" aria-label="Diagrama de niveles de energía de los orbitales moleculares">';

        /* Eje de energía */
        s += '<line x1="8" y1="378" x2="8" y2="30" class="tom-eje"/>' +
            '<polygon points="8,20 3,32 13,32" class="tom-eje-p"/>' +
            '<text x="18" y="26" class="tom-t-s">Energía</text>';

        /* Mapa de niveles moleculares por clave */
        var mapa = {};
        r.niveles.forEach(function (nv) { mapa[nv.def.k] = nv; });

        /* Conectores (líneas punteadas) */
        ao.forEach(function (a) {
            var xAO = (a.lado === 0) ? 88 : 252;
            a.vincula.forEach(function (k) {
                var nv = mapa[k];
                if (!nv) { return; }
                var segs = segmentos(nv.def.deg);
                var seg = (a.lado === 0) ? segs[0] : segs[segs.length - 1];
                var xMO = (a.lado === 0) ? seg[0] : seg[1];
                s += '<line x1="' + xAO + '" y1="' + a.y.toFixed(1) + '" x2="' + xMO + '" y2="' + nv.def.y + '" class="tom-cx"/>';
            });
        });

        /* Niveles atómicos */
        ao.forEach(function (a) {
            var x1 = (a.lado === 0) ? 28 : 252;
            var x2 = x1 + 60;
            s += '<line x1="' + x1 + '" y1="' + a.y.toFixed(1) + '" x2="' + x2 + '" y2="' + a.y.toFixed(1) + '" class="tom-ao"/>' +
                '<text x="' + (x1 + 30) + '" y="' + (a.y - 7).toFixed(1) + '" class="tom-t-ao">' + a.txt + "</text>";
        });

        /* Niveles moleculares */
        r.niveles.forEach(function (nv) {

            var segs = segmentos(nv.def.deg);
            var color = colores[nv.def.kind];

            segs.forEach(function (seg, j) {

                var o = nv.occ[j];
                var cx = (seg[0] + seg[1]) / 2;
                var y = nv.def.y;

                s += '<line x1="' + seg[0] + '" y1="' + y + '" x2="' + seg[1] + '" y2="' + y + '" stroke="' + color +
                    '" stroke-width="3.5" stroke-linecap="round" opacity="' + (o > 0 ? 1 : 0.45) + '"/>';

                if (o > 0) {
                    s += '<text x="' + cx + '" y="' + (y - 7) + '" class="tom-t-e">' + (o === 2 ? "↑↓" : "↑") + "</text>";
                }

                s += '<text x="' + cx + '" y="' + (y + 15) + '" class="tom-t-n" fill="' + color + '">' + nv.nombres[j] + "</text>";
            });
        });

        /* Símbolos de los átomos */
        s += '<text x="58" y="404" class="tom-t-a">' + e1.sym + "</text>" +
            '<text x="282" y="404" class="tom-t-a">' + e2.sym + "</text>";

        s += "</svg>";

        return s;
    }

    function htmlDiagrama(r) {

        var abierto = estado.diagrama;

        return '<div class="tom-diag">' +
            '<button type="button" class="tom-btn-diag" data-diagrama="1" aria-expanded="' + abierto + '">' +
            '<i class="fa-solid fa-chart-simple"></i> <span>' + (abierto ? "Ocultar" : "Ver") + " diagrama de niveles de energía</span></button>" +
            '<div class="tom-diag-cuerpo"' + (abierto ? "" : " hidden") + ">" +
            svgDiagrama(r) +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span>' +
            (r.clave === "hidruro" ? '<span class="tom-lg nb">no enlazante</span>' : "") + "</div>" +
            '<p class="tom-p tom-suave">Esquema cualitativo (no está a escala). A la izquierda y a la derecha, los orbitales atómicos; ' +
            "en el centro, los moleculares.</p></div></div>";
    }


    /* =========================================
       8. RESULTADOS · 2 ELEMENTOS
       ========================================= */

    function htmlDos(r) {

        var out = "";

        if (r.error) {
            return htmlPasoElectrones(r.e1, r.e2, r.carga, r.N) + aviso(r.error);
        }

        /* Avisos */
        if (r.criterio === "docente" && r.impar) {
            out += aviso("<b>No existe como molécula (criterio del docente).</b> Con " + r.N +
                " e⁻ (número impar) queda un electrón desapareado. En la realidad especies así sí existen " +
                "(por ejemplo NO, con OE = 2.5): cambia a <b>Real</b> para verlo.", "tom-aviso-amarillo");
        } else if (r.OE <= 0) {
            out += aviso("<b>No se forma enlace estable</b>: el orden de enlace es 0.", "tom-aviso-amarillo");
        }

        if (r.criterio === "docente" && (r.e1.z <= 2 || r.e2.z <= 2)) {
            out += aviso("Con H o He el esquema 2s-2p no es correcto (solo tienen orbital 1s). " +
                "Cambia a <b>Real</b> para el cálculo adecuado de hidruros.", "tom-aviso-amarillo");
        }

        if (r.clave === "hidruro") {
            out += aviso("Se usó el esquema de <b>hidruro diatómico</b>: el H aporta su orbital 1s y el otro átomo sus " +
                "orbitales s y p (solo el p alineado con el enlace participa).", "tom-aviso-info");
        }

        if (r.dEN !== null && r.dEN > 1.7) {
            out += aviso("ΔEN = " + r.dEN.toFixed(2) + " (> 1.7): este enlace es mayormente <b>iónico</b>. " +
                "La TOM covalente es solo una aproximación.", "tom-aviso-info");
        }

        /* Resumen en fichas */
        var tipo = r.OE > 0 ? nombreCorto(r.OE) : "—";
        var detalleTipo = r.OE > 0 ? desglose(r.sigmaNeto, r.piNeto) : "sin enlace";

        out += '<section class="card tom-resumen"><div class="card-header"><div class="card-icon blue-icon"><i class="fa-solid fa-flask"></i></div>' +
            "<h2>Resultado</h2></div>" + htmlEstructura2(r) +
            '<div class="tom-tiles">' +
            tile(fmt(r.OE), "Orden de enlace", r.OE > 0 ? "azul" : "rojo") +
            tile(tipo + '<small>' + detalleTipo + "</small>", "Tipo de enlace", "naranja") +
            tile(r.para ? "Para-<br>magnética" : "Dia-<br>magnética", r.para ? r.desap.length + " e⁻ desapareado" + (r.desap.length > 1 ? "s" : "") : "todos apareados", r.para ? "rojo" : "verde") +
            tile(r.N + " e⁻", "de valencia", "gris") +
            "</div></section>";

        /* Notación */
        out += '<section class="card tom-card-notacion"><div class="card-header"><div class="card-icon red-icon"><i class="fa-solid fa-atom"></i></div>' +
            "<h2>Notación de orbitales moleculares</h2></div>" +
            '<div class="tom-notacion"><span class="tom-kk">KK</span><span class="tom-corchete">[</span>' +
            r.orbs.filter(function (o) { return o.occ > 0; }).map(chipMO).join(" ") +
            '<span class="tom-corchete">]</span></div>' +
            '<div class="tom-leyenda"><span class="tom-lg enl">enlazante</span><span class="tom-lg anti">antienlazante</span>' +
            (r.clave === "hidruro" ? '<span class="tom-lg nb">no enlazante</span>' : "") + "</div></section>";

        /* Diagrama */
        out += '<section class="card tom-card-diag">' + htmlDiagrama(r) + "</section>";

        /* Paso a paso */
        out += '<section class="card tom-pasos"><div class="card-header"><div class="card-icon blue-icon"><i class="fa-solid fa-list-check"></i></div>' +
            "<h2>Paso a paso</h2></div>" +
            htmlPasoElectrones(r.e1, r.e2, r.carga, r.N) +
            htmlPasoLlenado(r) +
            htmlPasoOrden(r) +
            htmlPasoMagnetismo(r) +
            htmlPasoPolaridad(r) +
            "</section>";

        return out;
    }


    /* =========================================
       9. RESULTADOS · 3 ELEMENTOS
       ========================================= */

    function htmlPasoElectrones3(r) {

        var filas = r.atomos.map(function (e, i) {
            var rol = (i === 1) ? "central" : "extremo";
            return '<div class="tom-fila"><div class="tom-fila-t"><b>' + e.sym + "</b> " + e.nombre + " · Z = " + e.z +
                ' <span class="tom-rol">' + rol + "</span></div>" +
                '<div class="tom-config">' + htmlConfig(e) + "</div>" +
                '<div class="tom-fila-v">Capa de valencia (n = ' + e.n + "): <b>" + htmlValencia(e) + " = " + e.v + " e⁻</b></div></div>";
        }).join("");

        var formula = r.a.v + " (" + r.a.sym + ") + " + r.b.v + " (" + r.b.sym + ") + " + r.c.v + " (" + r.c.sym + ")";
        if (r.carga > 0) { formula += " − " + r.carga; }
        if (r.carga < 0) { formula += " + " + (-r.carga); }

        return paso(1, "Cuenta los electrones de valencia",
            filas + '<div class="tom-formula">' + formula + " = <b>" + r.V + " e⁻</b></div>");
    }

    function htmlEstructura3(r) {

        var est = r.est;
        var atomos = r.atomos;
        var bonds = [est.b1, est.b2];

        function nombreFC(f) {
            if (f === 0) { return "FC 0"; }
            return "FC " + (f > 0 ? "+" + f : "−" + (-f));
        }

        var s = '<div class="tom-lewis">';
        for (var i = 0; i < 3; i++) {
            s += '<div class="tom-lw-a"><span class="tom-atomo">' + atomos[i].sym + "</span>" +
                '<span class="tom-lw-d">' + est.lp[i] + " par" + (est.lp[i] === 1 ? "" : "es") + " libre" + (est.lp[i] === 1 ? "" : "s") + "<br>" +
                '<span class="tom-fc fc' + (est.fc[i] === 0 ? "0" : (est.fc[i] > 0 ? "p" : "n")) + '">' + nombreFC(est.fc[i]) + "</span></span></div>";
            if (i < 2) {
                s += '<div class="tom-lw-e"><span class="tom-enlace">' + simboloEnlace(bonds[i]) + "</span></div>";
            }
        }
        s += "</div>";

        return s;
    }

    function nombreGeometria(dom) {
        if (dom === 2) { return "Lineal (180°)"; }
        if (dom === 3) { return "Angular (≈120°)"; }
        return "Angular (≈104–109°)";
    }

    function htmlTres(r) {

        if (r.error) {
            return aviso(r.error);
        }

        if (r.impar) {
            return htmlPasoElectrones3(r) +
                aviso("<b>Número impar de electrones (" + r.V + " e⁻): es un radical.</b> La regla del octeto no se puede cumplir en " +
                    "todos los átomos y habrá un electrón desapareado, así que será <b>paramagnética</b>. " +
                    "Por eso no se dibuja una estructura de Lewis única.", "tom-aviso-amarillo");
        }

        var est = r.est;
        var out = "";

        /* Avisos */
        if (!r.lineal) {
            out += aviso("<b>Esta molécula en realidad no es lineal.</b> El átomo central tiene " + r.dominios +
                " dominios de electrones (2 enlaces + " + est.lp[1] + " par" + (est.lp[1] === 1 ? "" : "es") +
                " libre" + (est.lp[1] === 1 ? "" : "s") + "), por eso es " + nombreGeometria(r.dominios).toLowerCase() +
                ". La calculadora coloca los átomos en línea solo para dibujar.", "tom-aviso-amarillo");
        }

        var incompletos = [];
        for (var i = 0; i < 3; i++) {
            var objetivo = r.atomos[i].z <= 2 ? 2 : 8;
            if (est.e[i] !== objetivo) {
                incompletos.push(r.atomos[i].sym + " (" + est.e[i] + " e⁻)");
            }
        }
        if (incompletos.length) {
            out += aviso("Excepción al octeto: " + incompletos.join(", ") +
                ". Elementos como Be, B o Al suelen quedar con menos de 8 e⁻; los de periodo 3 o mayor pueden superar el octeto.", "tom-aviso-info");
        }

        /* Resumen */
        var tipoA = nombreCorto(est.b1);
        var tipoB = nombreCorto(est.b2);

        out += '<section class="card tom-resumen"><div class="card-header"><div class="card-icon blue-icon"><i class="fa-solid fa-flask"></i></div>' +
            "<h2>Resultado</h2></div>" +
            (r.carga !== 0 ? '<div class="tom-leyenda-e tom-sup-carga">Carga del ion: <b>' + textoCarga(r.carga) + "</b></div>" : "") +
            htmlEstructura3(r) +
            '<div class="tom-tiles">' +
            tile(r.V + " e⁻", "de valencia", "gris") +
            tile(nombreGeometria(r.dominios).replace(" (", "<small>(").replace(")", ")</small>"), "Geometría", r.lineal ? "azul" : "rojo") +
            tile(tipoA + " · " + tipoB + "<small>" + r.a.sym + "–" + r.b.sym + " · " + r.b.sym + "–" + r.c.sym + "</small>", "Enlaces", "naranja") +
            tile(r.polaridad === "apolar" ? "Apolar" : "Polar", "Molécula", r.polaridad === "apolar" ? "verde" : "rojo") +
            "</div></section>";

        /* Paso a paso */
        var p2;
        var enlacesTotales = est.b1 + est.b2;
        if (r.compartidos === 2 * enlacesTotales) {
            p2 = '<p class="tom-p">Cada átomo quiere completar su capa (8 e⁻; el H, 2 e⁻).</p>' +
                '<div class="tom-formula">Necesarios: ' + r.S + " e⁻ · Disponibles: " + r.V + " e⁻</div>" +
                '<div class="tom-formula">Compartidos = ' + r.S + " − " + r.V + " = <b>" + r.compartidos + " e⁻</b> → " + enlacesTotales + " enlaces</div>";
        } else {
            p2 = '<p class="tom-p">Cada átomo quiere completar su capa (8 e⁻; el H, 2 e⁻).</p>' +
                '<div class="tom-formula">Necesarios: ' + r.S + " e⁻ · Disponibles: " + r.V + " e⁻</div>" +
                '<p class="tom-p">Con esos electrones se forman <b>' + enlacesTotales + " enlaces</b> y algún átomo queda con el octeto incompleto.</p>";
        }
        p2 += '<p class="tom-p">Los ' + enlacesTotales + " enlaces se reparten en <b>" + r.a.sym + "–" + r.b.sym + ": " + est.b1 +
            "</b> y <b>" + r.b.sym + "–" + r.c.sym + ": " + est.b2 + "</b>. El resto de e⁻ son pares libres.</p>";

        var filasFC = r.atomos.map(function (e, i) {
            var enlacesAtomo = (i === 0) ? est.b1 : (i === 1 ? est.b1 + est.b2 : est.b2);
            return "<tr><td><b>" + e.sym + "</b></td><td>" + e.v + " − (" + (2 * est.lp[i]) + " + " + enlacesAtomo + ") = <b>" +
                est.fc[i] + "</b></td></tr>";
        }).join("");

        var p3 = '<p class="tom-p">Carga formal = e⁻ de valencia − (e⁻ de pares libres + enlaces)</p>' +
            '<table class="tom-tabla">' + filasFC + "</table>" +
            '<p class="tom-p tom-suave">De varias estructuras posibles se elige la de cargas formales más cercanas a 0 ' +
            "(y la carga negativa en el átomo más electronegativo).</p>";

        var p4 = '<p class="tom-p"><b>' + r.a.sym + "–" + r.b.sym + ":</b> orden " + est.b1 + " → " + nombreOrden(est.b1) +
            " (1σ" + (est.b1 > 1 ? " + " + (est.b1 - 1) + "π" : "") + ").</p>" +
            '<p class="tom-p"><b>' + r.b.sym + "–" + r.c.sym + ":</b> orden " + est.b2 + " → " + nombreOrden(est.b2) +
            " (1σ" + (est.b2 > 1 ? " + " + (est.b2 - 1) + "π" : "") + ").</p>" +
            '<p class="tom-p tom-suave">En TOM, los 3 átomos combinan sus orbitales y los π quedan <b>deslocalizados</b> sobre toda la molécula, ' +
            "pero el orden de enlace por pares coincide con este resultado en la mayoría de los casos.</p>";

        var p5 = '<p class="tom-p">Dominios de e⁻ en el átomo central ' + r.b.sym + " = 2 enlaces + " + est.lp[1] + " par" +
            (est.lp[1] === 1 ? "" : "es") + " libre" + (est.lp[1] === 1 ? "" : "s") + " = <b>" + r.dominios + "</b>.</p>" +
            '<p class="tom-p">Geometría: <b>' + nombreGeometria(r.dominios) + "</b>.</p>";

        var p6 = "";
        if (r.dEN[0] !== null && r.dEN[1] !== null) {
            p6 += '<p class="tom-p">ΔEN (' + r.a.sym + "–" + r.b.sym + ") = " + r.dEN[0].toFixed(2) + " · ΔEN (" + r.b.sym + "–" + r.c.sym + ") = " + r.dEN[1].toFixed(2) + ".</p>";
        }
        if (r.polaridad === "apolar") {
            p6 += '<p class="tom-p">Los dos enlaces son iguales y opuestos (molécula lineal simétrica): los momentos dipolares se cancelan → molécula <b>apolar</b>.</p>';
        } else {
            p6 += '<p class="tom-p">Los momentos dipolares no se cancelan → molécula <b>polar</b>.</p>';
        }

        var p7 = '<p class="tom-p">Número par de electrones y todos apareados en la estructura de Lewis: <b>diamagnética</b>.</p>';

        out += '<section class="card tom-pasos"><div class="card-header"><div class="card-icon blue-icon"><i class="fa-solid fa-list-check"></i></div>' +
            "<h2>Paso a paso</h2></div>" +
            htmlPasoElectrones3(r) +
            paso(2, "Reparte los electrones (regla del octeto)", p2) +
            paso(3, "Calcula las cargas formales", p3) +
            paso(4, "Orden de enlace de cada par", p4) +
            paso(5, "Geometría (VSEPR)", p5) +
            paso(6, "Polaridad", p6, false) +
            paso(7, "Magnetismo", p7, false) +
            "</section>";

        return out;
    }


    /* =========================================
       10. FORMULARIO Y EVENTOS
       ========================================= */

    function htmlFormulario() {

        var modo = estado.modo;
        var n = (modo === "2") ? 2 : 3;
        var etiquetas = (n === 2) ? ["Elemento 1", "Elemento 2"] : ["Átomo 1 (extremo)", "Átomo 2 (central)", "Átomo 3 (extremo)"];

        var campos = "";
        for (var i = 0; i < n; i++) {
            campos += '<div class="tom-campo"><label for="tom-el-' + i + '">' + etiquetas[i] + "</label>" +
                '<input type="text" id="tom-el-' + i + '" class="tom-input" data-i="' + i + '" list="tom-lista" ' +
                'placeholder="Símbolo, nombre o Z" autocomplete="off" autocapitalize="off" spellcheck="false">' +
                '<div class="tom-info" id="tom-info-' + i + '"></div></div>';
        }

        var actual = estado.carga[modo];
        var chipsCarga = [-3, -2, -1, 0, 1, 2, 3].map(function (v) {
            var t = v === 0 ? "0 neutro" : (v > 0 ? "+" + v : "−" + (-v));
            return '<button type="button" class="tom-chip' + (v === actual ? " activo" : "") + '" data-carga="' + v +
                '" aria-pressed="' + (v === actual) + '">' + t + "</button>";
        }).join("");

        var lista = (n === 2) ? EJEMPLOS_CLASE.concat(EJEMPLOS_CLASICOS) : EJEMPLOS_3;
        var chipsEj = "";

        function chipsDe(arr, offset) {
            return arr.map(function (ej, k) {
                return '<button type="button" class="tom-chip ej" data-ej="' + (offset + k) + '">' + ej.t + "</button>";
            }).join("");
        }

        if (n === 2) {
            chipsEj = '<div class="tom-sub">Ejercicios de la pizarra</div><div class="tom-chips">' + chipsDe(EJEMPLOS_CLASE, 0) + "</div>" +
                '<div class="tom-sub">Clásicos</div><div class="tom-chips">' + chipsDe(EJEMPLOS_CLASICOS, EJEMPLOS_CLASE.length) + "</div>";
        } else {
            chipsEj = '<div class="tom-chips">' + chipsDe(lista, 0) + "</div>";
        }

        var criterio = "";
        if (n === 2) {
            criterio = '<div class="tom-sub">Criterio de cálculo</div>' +
                '<div class="tom-seg tom-seg-chico" role="group">' +
                '<button type="button" data-criterio="docente" class="' + (estado.criterio === "docente" ? "activo" : "") + '">Docente</button>' +
                '<button type="button" data-criterio="real" class="' + (estado.criterio === "real" ? "activo" : "") + '">Real</button></div>' +
                '<p class="tom-p tom-suave">' + (estado.criterio === "docente"
                    ? "Igual que en clase: esquema 2s-2p para todos, máximo 16 e⁻ y número impar de e⁻ = no existe."
                    : "Más cercano a la realidad: los radicales (NO, O₂⁺) sí existen y el H/He y los hidruros usan su propio esquema.") + "</p>";
        }

        var ayuda3 = (n === 3)
            ? '<p class="tom-p tom-suave">Se asume una molécula <b>A–B–C</b> con el átomo del centro como átomo central. ' +
            "La calculadora te avisa si la molécula real no es lineal.</p>"
            : "";

        var opciones = ELEMENTOS.map(function (e) {
            return '<option value="' + e.sym + '">' + e.nombre + " · Z = " + e.z + "</option>";
        }).join("");

        return '<section class="card tom-hero"><div class="card-header"><div class="card-icon red-icon"><i class="fa-solid fa-atom"></i></div>' +
            "<h2>ENLACES · CALCULADORA TOM</h2></div>" +
            '<p class="tom-p">La <b>Teoría de Orbitales Moleculares</b> combina los orbitales de los átomos para formar orbitales de toda la molécula. ' +
            "Elige los elementos y la carga: se calcula al instante y se explica cada paso.</p></section>" +

            '<section class="card tom-form">' +
            '<div class="tom-seg" role="group">' +
            '<button type="button" data-modo="2" class="' + (modo === "2" ? "activo" : "") + '">2 elementos</button>' +
            '<button type="button" data-modo="3" class="' + (modo === "3" ? "activo" : "") + '">3 elementos · lineal</button></div>' +
            '<div class="tom-sub">1. Elementos</div>' +
            '<div class="tom-campos">' + campos + "</div>" + ayuda3 +
            '<div class="tom-sub">2. Carga de la molécula o ion</div>' +
            '<div class="tom-chips tom-chips-carga">' + chipsCarga + "</div>" +
            criterio +
            '<div class="tom-sub">Ejemplos</div>' + chipsEj.replace('<div class="tom-sub">Ejercicios', '<div class="tom-sub tom-sub2">Ejercicios').replace('<div class="tom-sub">Clásicos', '<div class="tom-sub tom-sub2">Clásicos') +
            '<div class="tom-acciones"><button type="button" class="tom-btn-borrar" data-borrar="1"><i class="fa-solid fa-eraser"></i> Borrar</button></div>' +
            "</section>" +

            '<div id="tom-resultados" aria-live="polite"></div>' +

            '<section class="card tom-proximamente"><div class="card-content"><h3>Próximamente</h3>' +
            '<p class="tom-p">Enlace iónico, covalente, metálico, polaridad y más.</p></div></section>' +

            '<datalist id="tom-lista">' + opciones + "</datalist>";
    }

    function render() {
        var raiz = $("enlaces-app");
        if (!raiz) { return; }

        raiz.innerHTML = htmlFormulario();

        var n = (estado.modo === "2") ? 2 : 3;
        for (var i = 0; i < n; i++) {
            $("tom-el-" + i).value = estado.txt[estado.modo][i];
        }

        actualizar();
    }

    function actualizar() {

        var modo = estado.modo;
        var n = (modo === "2") ? 2 : 3;
        var els = [];
        var completo = true;

        for (var i = 0; i < n; i++) {

            var texto = estado.txt[modo][i];
            var e = buscarElemento(texto);
            els.push(e);

            var info = $("tom-info-" + i);

            if (e) {
                info.className = "tom-info ok";
                info.innerHTML = "<b>" + e.sym + "</b> · Z = " + e.z + " · valencia: <b>" + e.v + " e⁻</b> · " + htmlValencia(e);
            } else if (String(texto || "").trim() === "") {
                info.className = "tom-info";
                info.innerHTML = "Escribe un elemento";
            } else {
                info.className = "tom-info mal";
                info.innerHTML = "No encontré ese elemento";
            }

            if (!e) { completo = false; }
        }

        var cont = $("tom-resultados");
        if (!cont) { return; }

        if (!completo) {
            cont.innerHTML = aviso("Elige " + (n === 2 ? "los dos elementos" : "los tres elementos") +
                " (símbolo, nombre o número atómico) para ver el análisis.", "tom-aviso-info");
            return;
        }

        var carga = estado.carga[modo];

        cont.innerHTML = (modo === "2")
            ? htmlDos(analizar2(els[0], els[1], carga, estado.criterio))
            : htmlTres(analizar3(els[0], els[1], els[2], carga));
    }

    function alClick(ev) {

        var t = ev.target;
        while (t && t !== ev.currentTarget && t.nodeType === 1 && !t.hasAttribute("data-modo") && !t.hasAttribute("data-carga") &&
            !t.hasAttribute("data-criterio") && !t.hasAttribute("data-ej") && !t.hasAttribute("data-borrar") && !t.hasAttribute("data-diagrama")) {
            t = t.parentNode;
        }
        if (!t || t === ev.currentTarget || t.nodeType !== 1) { return; }

        if (t.hasAttribute("data-modo")) {
            estado.modo = t.getAttribute("data-modo");
            render();
            return;
        }

        if (t.hasAttribute("data-carga")) {
            estado.carga[estado.modo] = parseInt(t.getAttribute("data-carga"), 10);
            render();
            return;
        }

        if (t.hasAttribute("data-criterio")) {
            estado.criterio = t.getAttribute("data-criterio");
            render();
            return;
        }

        if (t.hasAttribute("data-ej")) {
            var idx = parseInt(t.getAttribute("data-ej"), 10);
            var lista = (estado.modo === "2") ? EJEMPLOS_CLASE.concat(EJEMPLOS_CLASICOS) : EJEMPLOS_3;
            var ej = lista[idx];
            estado.txt[estado.modo] = ej.s.slice();
            estado.carga[estado.modo] = ej.c;
            render();
            return;
        }

        if (t.hasAttribute("data-borrar")) {
            estado.txt[estado.modo] = (estado.modo === "2") ? ["", ""] : ["", "", ""];
            estado.carga[estado.modo] = 0;
            render();
            var primero = $("tom-el-0");
            if (primero) { primero.focus(); }
            return;
        }

        if (t.hasAttribute("data-diagrama")) {
            estado.diagrama = !estado.diagrama;
            var cuerpo = t.parentNode.querySelector(".tom-diag-cuerpo");
            if (cuerpo) { cuerpo.hidden = !estado.diagrama; }
            t.setAttribute("aria-expanded", String(estado.diagrama));
            var rotulo = t.querySelector("span");
            if (rotulo) { rotulo.textContent = (estado.diagrama ? "Ocultar" : "Ver") + " diagrama de niveles de energía"; }
        }
    }

    function alEscribir(ev) {
        var t = ev.target;
        if (!t || !t.classList || !t.classList.contains("tom-input")) { return; }
        var i = parseInt(t.getAttribute("data-i"), 10);
        estado.txt[estado.modo][i] = t.value;
        actualizar();
    }

    function iniciar() {
        var raiz = $("enlaces-app");
        if (!raiz) { return; }
        raiz.className = "tom";
        raiz.addEventListener("click", alClick);
        raiz.addEventListener("input", alEscribir);
        render();
    }

    /* Se expone para pruebas desde la consola del navegador */
    window.TOM = {
        elementos: ELEMENTOS,
        buscar: buscarElemento,
        analizar2: analizar2,
        analizar3: analizar3
    };

    if (typeof document !== "undefined" && document.addEventListener) {
        document.addEventListener("DOMContentLoaded", iniciar);
    }

})();
