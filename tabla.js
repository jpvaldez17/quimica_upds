/* =========================================
QUÍMICA UPDS
TABLA PERIÓDICA INTERACTIVA
Developed by J. Poma · 2026
========================================= */

(function () {
    "use strict";

    /* =========================================
    CATEGORÍAS
    ========================================= */

    var CATEGORIAS = [
        { id: "alcalino",       nombre: "Metales alcalinos" },
        { id: "alcalinoterreo", nombre: "Alcalinotérreos" },
        { id: "transicion",     nombre: "Metales de transición" },
        { id: "postransicion",  nombre: "Otros metales" },
        { id: "metaloide",      nombre: "Metaloides" },
        { id: "nometal",        nombre: "No metales" },
        { id: "halogeno",       nombre: "Halógenos" },
        { id: "noble",          nombre: "Gases nobles" },
        { id: "lantanido",      nombre: "Lantánidos" },
        { id: "actinido",       nombre: "Actínidos" }
    ];

    function nombreCategoria(id) {
        for (var i = 0; i < CATEGORIAS.length; i++) {
            if (CATEGORIAS[i].id === id) { return CATEGORIAS[i].nombre; }
        }
        return id;
    }

    function categoriaDe(z) {
        var l = function (arr) { return arr.indexOf(z) !== -1; };
        if (l([3, 11, 19, 37, 55, 87])) { return "alcalino"; }
        if (l([4, 12, 20, 38, 56, 88])) { return "alcalinoterreo"; }
        if (l([2, 10, 18, 36, 54, 86, 118])) { return "noble"; }
        if (l([9, 17, 35, 53, 85, 117])) { return "halogeno"; }
        if (l([1, 6, 7, 8, 15, 16, 34])) { return "nometal"; }
        if (l([5, 14, 32, 33, 51, 52])) { return "metaloide"; }
        if (z >= 57 && z <= 71) { return "lantanido"; }
        if (z >= 89 && z <= 103) { return "actinido"; }
        if (l([13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116])) { return "postransicion"; }
        return "transicion";
    }

    /* =========================================
    DATOS BÁSICOS
    Z | Símbolo | Nombre | Masa | EN | Valencias
    ========================================= */

    var RAW = [
        "1|H|Hidrógeno|1.008|2.20|-1, +1",
        "2|He|Helio|4.0026|—|0",
        "3|Li|Litio|6.94|0.98|+1",
        "4|Be|Berilio|9.0122|1.57|+2",
        "5|B|Boro|10.81|2.04|+3",
        "6|C|Carbono|12.011|2.55|-4, +2, +4",
        "7|N|Nitrógeno|14.007|3.04|-3, +3, +5",
        "8|O|Oxígeno|15.999|3.44|-2",
        "9|F|Flúor|18.998|3.98|-1",
        "10|Ne|Neón|20.180|—|0",
        "11|Na|Sodio|22.990|0.93|+1",
        "12|Mg|Magnesio|24.305|1.31|+2",
        "13|Al|Aluminio|26.982|1.61|+3",
        "14|Si|Silicio|28.085|1.90|-4, +4",
        "15|P|Fósforo|30.974|2.19|-3, +3, +5",
        "16|S|Azufre|32.06|2.58|-2, +4, +6",
        "17|Cl|Cloro|35.45|3.16|-1, +1, +3, +5, +7",
        "18|Ar|Argón|39.948|—|0",
        "19|K|Potasio|39.098|0.82|+1",
        "20|Ca|Calcio|40.078|1.00|+2",
        "21|Sc|Escandio|44.956|1.36|+3",
        "22|Ti|Titanio|47.867|1.54|+2, +3, +4",
        "23|V|Vanadio|50.942|1.63|+2, +3, +4, +5",
        "24|Cr|Cromo|51.996|1.66|+2, +3, +6",
        "25|Mn|Manganeso|54.938|1.55|+2, +3, +4, +6, +7",
        "26|Fe|Hierro|55.845|1.83|+2, +3",
        "27|Co|Cobalto|58.933|1.88|+2, +3",
        "28|Ni|Níquel|58.693|1.91|+2, +3",
        "29|Cu|Cobre|63.546|1.90|+1, +2",
        "30|Zn|Zinc|65.38|1.65|+2",
        "31|Ga|Galio|69.723|1.81|+3",
        "32|Ge|Germanio|72.630|2.01|+2, +4",
        "33|As|Arsénico|74.922|2.18|-3, +3, +5",
        "34|Se|Selenio|78.971|2.55|-2, +4, +6",
        "35|Br|Bromo|79.904|2.96|-1, +1, +3, +5",
        "36|Kr|Kriptón|83.798|3.00|0",
        "37|Rb|Rubidio|85.468|0.82|+1",
        "38|Sr|Estroncio|87.62|0.95|+2",
        "39|Y|Itrio|88.906|1.22|+3",
        "40|Zr|Circonio|91.224|1.33|+4",
        "41|Nb|Niobio|92.906|1.60|+3, +5",
        "42|Mo|Molibdeno|95.95|2.16|+4, +6",
        "43|Tc|Tecnecio|98|1.90|+4, +7",
        "44|Ru|Rutenio|101.07|2.20|+3, +4",
        "45|Rh|Rodio|102.91|2.28|+3",
        "46|Pd|Paladio|106.42|2.20|+2, +4",
        "47|Ag|Plata|107.87|1.93|+1",
        "48|Cd|Cadmio|112.41|1.69|+2",
        "49|In|Indio|114.82|1.78|+3",
        "50|Sn|Estaño|118.71|1.96|+2, +4",
        "51|Sb|Antimonio|121.76|2.05|-3, +3, +5",
        "52|Te|Telurio|127.60|2.10|-2, +4, +6",
        "53|I|Yodo|126.90|2.66|-1, +1, +5, +7",
        "54|Xe|Xenón|131.29|2.60|0",
        "55|Cs|Cesio|132.91|0.79|+1",
        "56|Ba|Bario|137.33|0.89|+2",
        "57|La|Lantano|138.91|1.10|+3",
        "58|Ce|Cerio|140.12|1.12|+3, +4",
        "59|Pr|Praseodimio|140.91|1.13|+3",
        "60|Nd|Neodimio|144.24|1.14|+3",
        "61|Pm|Prometio|145|—|+3",
        "62|Sm|Samario|150.36|1.17|+2, +3",
        "63|Eu|Europio|151.96|1.20|+2, +3",
        "64|Gd|Gadolinio|157.25|1.20|+3",
        "65|Tb|Terbio|158.93|—|+3",
        "66|Dy|Disprosio|162.50|1.22|+3",
        "67|Ho|Holmio|164.93|1.23|+3",
        "68|Er|Erbio|167.26|1.24|+3",
        "69|Tm|Tulio|168.93|1.25|+3",
        "70|Yb|Iterbio|173.05|1.10|+2, +3",
        "71|Lu|Lutecio|174.97|1.27|+3",
        "72|Hf|Hafnio|178.49|1.30|+4",
        "73|Ta|Tántalo|180.95|1.50|+5",
        "74|W|Wolframio|183.84|2.36|+4, +6",
        "75|Re|Renio|186.21|1.90|+4, +7",
        "76|Os|Osmio|190.23|2.20|+4, +8",
        "77|Ir|Iridio|192.22|2.20|+3, +4",
        "78|Pt|Platino|195.08|2.28|+2, +4",
        "79|Au|Oro|196.97|2.54|+1, +3",
        "80|Hg|Mercurio|200.59|2.00|+1, +2",
        "81|Tl|Talio|204.38|1.62|+1, +3",
        "82|Pb|Plomo|207.2|2.33|+2, +4",
        "83|Bi|Bismuto|208.98|2.02|+3, +5",
        "84|Po|Polonio|209|2.00|+2, +4",
        "85|At|Astato|210|2.20|-1, +1",
        "86|Rn|Radón|222|—|0",
        "87|Fr|Francio|223|—|+1",
        "88|Ra|Radio|226|0.90|+2",
        "89|Ac|Actinio|227|1.10|+3",
        "90|Th|Torio|232.04|1.30|+4",
        "91|Pa|Protactinio|231.04|1.50|+4, +5",
        "92|U|Uranio|238.03|1.38|+4, +6",
        "93|Np|Neptunio|237|1.36|+5",
        "94|Pu|Plutonio|244|1.28|+3, +4",
        "95|Am|Americio|243|1.13|+3",
        "96|Cm|Curio|247|1.28|+3",
        "97|Bk|Berkelio|247|1.30|+3, +4",
        "98|Cf|Californio|251|1.30|+3",
        "99|Es|Einstenio|252|1.30|+3",
        "100|Fm|Fermio|257|1.30|+3",
        "101|Md|Mendelevio|258|1.30|+2, +3",
        "102|No|Nobelio|259|1.30|+2, +3",
        "103|Lr|Lawrencio|266|1.30|+3",
        "104|Rf|Rutherfordio|267|—|+4",
        "105|Db|Dubnio|268|—|+5",
        "106|Sg|Seaborgio|269|—|+6",
        "107|Bh|Bohrio|270|—|+7",
        "108|Hs|Hassio|277|—|+8",
        "109|Mt|Meitnerio|278|—|—",
        "110|Ds|Darmstatio|281|—|—",
        "111|Rg|Roentgenio|282|—|—",
        "112|Cn|Copernicio|285|—|+2",
        "113|Nh|Nihonio|286|—|—",
        "114|Fl|Flerovio|289|—|—",
        "115|Mc|Moscovio|290|—|—",
        "116|Lv|Livermorio|293|—|—",
        "117|Ts|Teneso|294|—|—",
        "118|Og|Oganesón|294|—|—"
    ];

    var ELEMENTOS = RAW.map(function (linea) {
        var p = linea.split("|");
        var z = parseInt(p[0], 10);
        var pos = periodoGrupo(z);
        return {
            z: z,
            s: p[1],
            n: p[2],
            masa: p[3],
            en: p[4],
            val: p[5],
            cat: categoriaDe(z),
            periodo: pos.p,
            grupo: pos.g
        };
    });

    /* Elementos cuya masa se expresa como número másico del isótopo más estable */
    function masaEsNumeroMasico(z) {
        return z === 43 || z === 61 || (z >= 84 && z <= 89) || z >= 93;
    }

    function esRadiactivo(z) {
        return z === 43 || z === 61 || z >= 84;
    }

    /* =========================================
    PERIODO Y GRUPO
    ========================================= */

    function periodoGrupo(z) {
        if (z <= 2)  { return { p: 1, g: z === 1 ? 1 : 18 }; }
        if (z <= 10) { return { p: 2, g: z <= 4 ? z - 2 : z + 8 }; }
        if (z <= 18) { return { p: 3, g: z <= 12 ? z - 10 : z }; }
        if (z <= 36) { return { p: 4, g: z - 18 }; }
        if (z <= 54) { return { p: 5, g: z - 36 }; }
        if (z <= 56) { return { p: 6, g: z - 54 }; }
        if (z <= 71) { return { p: 6, g: null }; }
        if (z <= 86) { return { p: 6, g: z - 68 }; }
        if (z <= 88) { return { p: 7, g: z - 86 }; }
        if (z <= 103) { return { p: 7, g: null }; }
        return { p: 7, g: z - 100 };
    }

    /* =========================================
    CONFIGURACIÓN ELECTRÓNICA
    ========================================= */

    var ORDEN = [
        ["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2],
        ["3d", 10], ["4p", 6], ["5s", 2], ["4d", 10], ["5p", 6], ["6s", 2],
        ["4f", 14], ["5d", 10], ["6p", 6], ["7s", 2], ["5f", 14], ["6d", 10],
        ["7p", 6]
    ];

    var NOBLES = [[86, "[Rn]"], [54, "[Xe]"], [36, "[Kr]"], [18, "[Ar]"], [10, "[Ne]"], [2, "[He]"]];

    var EXCEPCIONES = {
        24: "[Ar] 3d5 4s1",
        29: "[Ar] 3d10 4s1",
        41: "[Kr] 4d4 5s1",
        42: "[Kr] 4d5 5s1",
        44: "[Kr] 4d7 5s1",
        45: "[Kr] 4d8 5s1",
        46: "[Kr] 4d10",
        47: "[Kr] 4d10 5s1",
        57: "[Xe] 5d1 6s2",
        58: "[Xe] 4f1 5d1 6s2",
        64: "[Xe] 4f7 5d1 6s2",
        78: "[Xe] 4f14 5d9 6s1",
        79: "[Xe] 4f14 5d10 6s1",
        89: "[Rn] 6d1 7s2",
        90: "[Rn] 6d2 7s2",
        91: "[Rn] 5f2 6d1 7s2",
        92: "[Rn] 5f3 6d1 7s2",
        93: "[Rn] 5f4 6d1 7s2",
        96: "[Rn] 5f7 6d1 7s2",
        103: "[Rn] 5f14 7s2 7p1"
    };

    function configuracion(z) {
        var texto;

        if (EXCEPCIONES[z]) {
            texto = EXCEPCIONES[z];
        } else {
            var llenos = [];
            var restantes = z;
            for (var i = 0; i < ORDEN.length && restantes > 0; i++) {
                var n = Math.min(restantes, ORDEN[i][1]);
                llenos.push({ sub: ORDEN[i][0], e: n });
                restantes -= n;
            }

            var nucleo = "";
            var corte = 0;
            for (var k = 0; k < NOBLES.length; k++) {
                if (NOBLES[k][0] < z) {
                    nucleo = NOBLES[k][1];
                    corte = NOBLES[k][0];
                    break;
                }
            }

            var acumulado = 0;
            var resto = [];
            llenos.forEach(function (x) {
                if (acumulado >= corte) { resto.push(x); }
                acumulado += x.e;
            });

            var letras = "spdf";
            resto.sort(function (a, b) {
                var na = parseInt(a.sub.charAt(0), 10);
                var nb = parseInt(b.sub.charAt(0), 10);
                if (na !== nb) { return na - nb; }
                return letras.indexOf(a.sub.charAt(1)) - letras.indexOf(b.sub.charAt(1));
            });

            texto = (nucleo ? nucleo + " " : "") + resto.map(function (x) {
                return x.sub + x.e;
            }).join(" ");
        }

        return texto.replace(/([spdf])(\d+)/g, "$1<sup>$2</sup>");
    }

    function estadoFisico(z) {
        var gases = [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86];
        if (gases.indexOf(z) !== -1) { return "Gas"; }
        if (z === 35 || z === 80) { return "Líquido"; }
        if (z >= 100) { return "Desconocido (elemento sintético)"; }
        if (z === 85 || z === 87) { return "Sólido (probable)"; }
        return "Sólido";
    }

    /* =========================================
    INFORMACIÓN AMPLIADA
    Plantillas por categoría y datos específicos
    ========================================= */

    var PLANTILLAS = {
        alcalino: {
            dato: "Metal blando, de baja densidad y con un único electrón de valencia; forma cationes +1.",
            apl: "Sus sales y compuestos se emplean en química industrial, baterías, fertilizantes y vidrio.",
            reac: "Reacciona de forma vigorosa con agua y con el aire. Se almacena en atmósfera inerte o bajo aceite mineral."
        },
        alcalinoterreo: {
            dato: "Metal reactivo con dos electrones de valencia; forma cationes +2.",
            apl: "Sus compuestos se usan en construcción, metalurgia, cerámicas y química industrial.",
            reac: "Reacciona con agua y ácidos liberando hidrógeno; los óxidos e hidróxidos suelen ser cáusticos."
        },
        transicion: {
            dato: "Metal con orbitales d parcialmente llenos; suele presentar varios estados de oxidación y compuestos coloreados.",
            apl: "Aleaciones estructurales, catalizadores, recubrimientos y materiales de ingeniería.",
            reac: "Reactividad variable según el metal y su estado de oxidación; consulte la hoja de seguridad (SDS) de cada compuesto."
        },
        postransicion: {
            dato: "Metal de dureza baja a moderada y puntos de fusión relativamente bajos.",
            apl: "Aleaciones, soldaduras, electrónica y recubrimientos.",
            reac: "Varios de estos metales y sus compuestos son tóxicos; evite la inhalación de polvos y humos."
        },
        metaloide: {
            dato: "Propiedades intermedias entre metales y no metales; varios actúan como semiconductores.",
            apl: "Electrónica, vidrios, cerámicas, aleaciones y retardantes de llama.",
            reac: "Muchos de sus compuestos son tóxicos o irritantes; manipule con ventilación y protección adecuadas."
        },
        nometal: {
            dato: "Elemento no metálico que forma enlaces covalentes y es esencial en la química orgánica e inorgánica.",
            apl: "Química industrial, fertilizantes, polímeros, combustibles y procesos de tratamiento.",
            reac: "La reactividad depende del compuesto; consulte la hoja de seguridad (SDS) antes de manipularlo."
        },
        halogeno: {
            dato: "Elemento muy electronegativo, con siete electrones de valencia; forma sales con los metales.",
            apl: "Desinfección, polímeros, refrigerantes, farmacia y química analítica.",
            reac: "En forma elemental son oxidantes fuertes, tóxicos y corrosivos; sus compuestos requieren precaución."
        },
        noble: {
            dato: "Gas monoatómico con la capa de valencia completa, por lo que es muy poco reactivo.",
            apl: "Atmósferas inertes, iluminación, láseres y criogenia.",
            reac: "Inerte; el riesgo principal es la asfixia por desplazamiento de oxígeno en espacios cerrados y la presión de los cilindros."
        },
        lantanido: {
            dato: "Tierra rara de la serie f, con propiedades magnéticas y luminiscentes características.",
            apl: "Imanes permanentes, fósforos de pantallas, catalizadores, vidrios especiales y aleaciones.",
            reac: "Se oxidan con facilidad al aire; los polvos metálicos finos pueden ser inflamables."
        },
        actinido: {
            dato: "Elemento de la serie f, radiactivo en todos sus isótopos.",
            apl: "Energía nuclear, investigación científica y fuentes de radiación.",
            reac: "Radiactivo: requiere blindaje, control de dosis y manejo regulado por la normativa nuclear."
        }
    };

    var SUPERPESADO = {
        dato: "Elemento sintético superpesado; solo se obtiene en aceleradores de partículas y sus isótopos duran desde milisegundos hasta pocos minutos.",
        apl: "Sin aplicaciones industriales; se estudia en investigación de física nuclear y química de los elementos superpesados.",
        reac: "Radiactivo. Sus propiedades químicas son en buena parte predichas; solo se maneja en laboratorios especializados."
    };

    var INFO = {
        1:  { dato: "Es el elemento más abundante del universo y el más ligero.", apl: "Producción de amoníaco (proceso Haber-Bosch), refinación de petróleo, celdas de combustible y soldadura.", reac: "Gas inflamable; forma mezclas explosivas con el aire en un rango muy amplio de concentración. Evite fuentes de ignición." },
        2:  { dato: "Segundo elemento más abundante del universo; no solidifica a presión atmosférica.", apl: "Refrigerante criogénico (resonancia magnética), atmósferas inertes, detección de fugas y globos.", reac: "Inerte. El riesgo es la asfixia por desplazamiento de oxígeno y la alta presión de los cilindros." },
        3:  { dato: "Es el metal más ligero y de menor densidad; flota sobre el agua.", apl: "Baterías de ion-litio, vidrios y cerámicas, lubricantes y aleaciones ligeras de aluminio.", reac: "Reacciona con el agua formando hidróxido de litio e hidrógeno. Se almacena bajo aceite mineral o en atmósfera inerte." },
        5:  { dato: "Metaloide duro y de alto punto de fusión; esencial en trazas para las plantas.", apl: "Vidrio borosilicato, fibra de vidrio, detergentes, abrasivos y barras de control en reactores nucleares.", reac: "El ácido bórico tiene baja toxicidad aguda; los polvos finos pueden irritar las vías respiratorias." },
        6:  { dato: "Base de la química orgánica; presenta alótropos como grafito, diamante y fullerenos.", apl: "Aceros (aleación con hierro), combustibles, polímeros, electrodos de grafito, carbón activado y fibra de carbono.", reac: "Estable a temperatura ambiente; su combustión produce CO₂ y, con poco oxígeno, monóxido de carbono (CO), muy tóxico." },
        7:  { dato: "Constituye cerca del 78 % del aire atmosférico.", apl: "Fertilizantes (amoníaco, nitratos), atmósferas inertes, nitrógeno líquido como criogénico y explosivos.", reac: "Gas poco reactivo por su triple enlace N≡N. El nitrógeno líquido causa quemaduras por frío y asfixia en espacios cerrados." },
        8:  { dato: "Representa cerca del 21 % del aire y es el elemento más abundante de la corteza terrestre.", apl: "Siderurgia, oxicorte y soldadura, tratamiento de aguas, medicina y propulsores.", reac: "Comburente: intensifica la combustión. Evite el contacto de equipos de oxígeno con grasas y aceites." },
        9:  { dato: "Es el elemento más electronegativo de la tabla periódica.", apl: "Fluoruros, teflón (PTFE), refrigerantes, enriquecimiento de uranio (UF₆) y pastas dentales.", reac: "Extremadamente reactivo y tóxico. El ácido fluorhídrico (HF) causa quemaduras profundas y exige protocolos específicos." },
        10: { dato: "Emite una luz rojo-anaranjada característica en tubos de descarga.", apl: "Letreros luminosos, láseres y refrigerante criogénico.", reac: "Inerte; riesgo de asfixia en espacios confinados." },
        11: { dato: "Metal blando y plateado; el sodio es uno de los elementos más abundantes de la corteza.", apl: "Sal común (NaCl), sosa cáustica (NaOH), carbonato de sodio, lámparas de vapor de sodio y refrigerante en reactores rápidos.", reac: "Reacciona violentamente con el agua; se guarda bajo aceite. En incendios de metales no use agua." },
        12: { dato: "Metal ligero y esencial para la clorofila.", apl: "Aleaciones ligeras para automoción y aeronáutica, desoxidante en metalurgia y ánodos de sacrificio.", reac: "Las virutas y el polvo arden con llama muy brillante; no se apagan con agua ni con CO₂." },
        13: { dato: "Es el metal más abundante de la corteza terrestre.", apl: "Estructuras ligeras, aeronáutica, automoción, envases, cables eléctricos y perfiles de construcción.", reac: "Forma una capa pasiva de Al₂O₃ que lo protege de la corrosión; el polvo fino es inflamable." },
        14: { dato: "Segundo elemento más abundante de la corteza terrestre.", apl: "Semiconductores y celdas solares, vidrio, cemento, siliconas y aleaciones aluminio-silicio.", reac: "Estable; el polvo de sílice cristalina puede causar silicosis al inhalarse de forma prolongada." },
        15: { dato: "Presenta alótropos como el fósforo blanco, rojo y negro.", apl: "Fertilizantes fosfatados, detergentes, retardantes de llama y baterías de fosfato de hierro y litio.", reac: "El fósforo blanco es pirofórico y muy tóxico; el rojo es más estable." },
        16: { dato: "Sólido amarillo que forma moléculas de S₈.", apl: "Ácido sulfúrico (el químico industrial más producido), vulcanización del caucho, fertilizantes y pólvora.", reac: "Su combustión produce SO₂ (irritante y causante de lluvia ácida); el H₂S es un gas muy tóxico." },
        17: { dato: "Gas amarillo-verdoso, denso y de olor penetrante.", apl: "Potabilización del agua, PVC, disolventes clorados, blanqueadores y desinfectantes.", reac: "Gas tóxico y corrosivo. Nunca mezcle lejía con amoníaco ni con ácidos." },
        18: { dato: "Tercer gas más abundante de la atmósfera (cerca del 0.93 %).", apl: "Atmósfera protectora en soldadura TIG/MIG, lámparas incandescentes y fabricación de semiconductores.", reac: "Inerte; riesgo de asfixia en espacios cerrados." },
        19: { dato: "Metal blando, esencial para los seres vivos.", apl: "Fertilizantes (KCl), jabones blandos, vidrios y baterías.", reac: "Reacciona con el agua aún más violentamente que el sodio; se almacena bajo aceite." },
        20: { dato: "Quinto elemento más abundante de la corteza terrestre.", apl: "Cemento, cal y yeso, desoxidación del acero y aleaciones.", reac: "Reacciona con el agua liberando hidrógeno; la cal viva (CaO) es cáustica." },
        22: { dato: "Metal de gran resistencia mecánica y baja densidad.", apl: "Aeronáutica, implantes médicos, intercambiadores de calor y pigmento blanco (TiO₂).", reac: "Muy resistente a la corrosión; las virutas finas son inflamables." },
        24: { dato: "Metal duro y brillante; su nombre proviene de sus compuestos coloreados.", apl: "Acero inoxidable, cromado decorativo y anticorrosivo, pigmentos y curtido de cueros.", reac: "El cromo(VI) es tóxico y cancerígeno; el cromo(III) es mucho menos peligroso." },
        25: { dato: "Metal duro y quebradizo, muy usado en metalurgia.", apl: "Aleante del acero (desoxida y endurece), pilas alcalinas y fertilizantes.", reac: "La exposición crónica a polvos o humos puede afectar el sistema nervioso." },
        26: { dato: "Principal componente del acero y gran parte del núcleo terrestre.", apl: "Acero y fundición, estructuras, maquinaria y catalizador del proceso Haber-Bosch.", reac: "Se oxida en presencia de agua y oxígeno (corrosión); el polvo muy fino puede ser pirofórico." },
        27: { dato: "Metal ferromagnético de color gris azulado.", apl: "Superaleaciones, imanes, cátodos de baterías de ion-litio y catalizadores.", reac: "El polvo es irritante y puede sensibilizar; el cobalto-60 es radiactivo." },
        28: { dato: "Metal resistente a la corrosión y ferromagnético.", apl: "Acero inoxidable, baterías Ni-MH, catalizadores de hidrogenación y monedas.", reac: "Es un sensibilizante cutáneo frecuente; algunos compuestos, como el tetracarbonilo de níquel, son muy tóxicos." },
        29: { dato: "Excelente conductor eléctrico y térmico.", apl: "Cableado y motores eléctricos, tuberías, intercambiadores de calor y aleaciones (latón y bronce).", reac: "Forma una pátina verde con el tiempo; sus sales son tóxicas para los organismos acuáticos." },
        30: { dato: "Metal azulado, esencial en trazas para los seres vivos.", apl: "Galvanizado del acero, latón, baterías y protección catódica.", reac: "Los humos de óxido de zinc pueden provocar la «fiebre de los humos metálicos»." },
        33: { dato: "Metaloide conocido por la toxicidad de sus compuestos.", apl: "Semiconductores (GaAs) y aleaciones; antiguamente, conservantes de madera.", reac: "Sus compuestos son muy tóxicos y cancerígenos." },
        35: { dato: "Junto con el mercurio, es uno de los dos elementos líquidos a temperatura ambiente.", apl: "Retardantes de llama, fluidos de perforación y desinfección de aguas.", reac: "Líquido rojizo, volátil, corrosivo y tóxico por inhalación." },
        47: { dato: "Posee la mayor conductividad eléctrica y térmica de todos los metales.", apl: "Electrónica, contactos eléctricos, joyería, espejos y fotografía.", reac: "Los iones Ag⁺ son antimicrobianos; las sales pueden manchar la piel." },
        48: { dato: "Metal blando, azulado y tóxico.", apl: "Baterías Ni-Cd, pigmentos y recubrimientos (uso cada vez más restringido).", reac: "Tóxico y cancerígeno; evite la inhalación de humos y polvos." },
        50: { dato: "Metal blando y maleable, resistente a la corrosión.", apl: "Soldaduras, hojalata (acero recubierto) y bronce.", reac: "El estaño metálico es poco tóxico; los compuestos organoestánnicos sí lo son." },
        53: { dato: "Sólido oscuro que sublima fácilmente a vapor violeta.", apl: "Desinfectantes (povidona yodada), sal yodada, catalizadores y medios de contraste para rayos X.", reac: "Sus vapores son irritantes; evite el contacto prolongado con la piel." },
        56: { dato: "Metal blando, muy reactivo con el aire y el agua.", apl: "Lodos de perforación (baritina), contraste radiológico (BaSO₄) y pirotecnia de color verde.", reac: "Las sales solubles de bario son tóxicas; el sulfato de bario es insoluble y seguro como contraste." },
        74: { dato: "Tiene el punto de fusión más alto de todos los metales.", apl: "Filamentos, herramientas de corte (carburo de tungsteno) y electrodos de soldadura TIG.", reac: "Muy estable; el polvo puede ser irritante." },
        78: { dato: "Metal noble, denso y muy resistente a la corrosión.", apl: "Catalizadores automotrices y químicos, joyería, electrodos y material de laboratorio.", reac: "Muy poco reactivo; algunas sales (cloroplatinatos) son sensibilizantes." },
        79: { dato: "Metal noble, muy maleable y dúctil.", apl: "Joyería, contactos electrónicos de alta fiabilidad y reservas monetarias.", reac: "Inerte frente al aire y a la mayoría de ácidos; se disuelve en agua regia." },
        80: { dato: "Único metal líquido a temperatura ambiente.", apl: "Lámparas fluorescentes, instrumentos de medición (en desuso) y minería artesanal del oro (contaminante).", reac: "Sus vapores son muy tóxicos; es neurotóxico y bioacumulable. Requiere manipulación extremadamente cuidadosa." },
        82: { dato: "Metal denso, blando y maleable.", apl: "Baterías plomo-ácido, blindaje contra radiación y soldaduras (uso en declive).", reac: "Neurotóxico acumulativo; evite la ingestión y la inhalación de polvos y humos." },
        83: { dato: "Metal pesado de toxicidad relativamente baja.", apl: "Aleaciones de bajo punto de fusión, cosméticos y medicamentos gástricos.", reac: "Baja toxicidad comparada con otros metales pesados; evite la ingestión de polvos." },
        92: { dato: "Metal denso y radiactivo; es la base del combustible nuclear.", apl: "Combustible de reactores nucleares (U-235 enriquecido) y blindaje (uranio empobrecido).", reac: "Radiactivo y químicamente tóxico (nefrotóxico); su manejo está regulado." }
    };

    function infoDe(e) {
        var base = e.z >= 104 ? SUPERPESADO : PLANTILLAS[e.cat];
        var esp = INFO[e.z] || {};
        return {
            dato: esp.dato || base.dato,
            apl: esp.apl || base.apl,
            reac: esp.reac || base.reac,
            especifico: !!INFO[e.z]
        };
    }

    /* =========================================
    ESTADO
    ========================================= */

    var seleccionado = 6;
    var filtroActivo = "";
    var celdas = {};
    var marcadores = [];

    function $(id) { return document.getElementById(id); }

    function normalizar(t) {
        return String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
    }

    /* =========================================
    CONSTRUCCIÓN DE LA TABLA
    ========================================= */

    function crearCelda(e) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "tp-cell tpc-" + e.cat;
        b.setAttribute("data-z", e.z);
        b.setAttribute("data-cat", e.cat);
        b.setAttribute("aria-label", e.n + ", número atómico " + e.z);

        var tam = e.n.length >= 12 ? " tp-n-xl" : (e.n.length >= 10 ? " tp-n-l" : "");
        b.innerHTML = "<small>" + e.z + "</small><b>" + e.s + "</b>" +
            '<em class="tp-n' + tam + '">' + e.n + "</em>";

        var fila, col;

        if (e.z >= 57 && e.z <= 71) {
            fila = 10;
            col = 4 + (e.z - 57);
        } else if (e.z >= 89 && e.z <= 103) {
            fila = 11;
            col = 4 + (e.z - 89);
        } else {
            fila = 1 + e.periodo;
            col = 1 + e.grupo;
        }

        b.style.gridRow = fila;
        b.style.gridColumn = col;
        return b;
    }

    function crearEtiqueta(texto, fila, col, clase) {
        var d = document.createElement("div");
        d.className = clase;
        d.textContent = texto;
        d.style.gridRow = fila;
        d.style.gridColumn = col;
        return d;
    }

    var ORDEN_LEYENDA = [
        "noble", "halogeno", "nometal", "metaloide", "postransicion",
        "transicion", "alcalinoterreo", "alcalino", "lantanido", "actinido"
    ];

    function construirTabla() {
        var grid = $("tp-grid");
        if (!grid) { return; }
        grid.innerHTML = "";

        /* Números de grupo */
        for (var g = 1; g <= 18; g++) {
            grid.appendChild(crearEtiqueta(g, 1, g + 1, "tp-eje"));
        }

        /* Números de periodo */
        for (var p = 1; p <= 7; p++) {
            grid.appendChild(crearEtiqueta(p, p + 1, 1, "tp-eje"));
        }

        /* Elementos */
        ELEMENTOS.forEach(function (e) {
            var c = crearCelda(e);
            celdas[e.z] = c;
            grid.appendChild(c);
        });

        /* Marcadores de las series f (grupo 3) */
        var m1 = crearEtiqueta("57–71", 7, 4, "tp-ph");
        m1.setAttribute("data-serie", "lantanido");
        var m2 = crearEtiqueta("89–103", 8, 4, "tp-ph");
        m2.setAttribute("data-serie", "actinido");
        grid.appendChild(m1);
        grid.appendChild(m2);
        marcadores.push(m1, m2);

        /* Etiquetas de las filas f */
        grid.appendChild(crearEtiqueta("*", 10, 1, "tp-eje tp-eje-f"));
        grid.appendChild(crearEtiqueta("**", 11, 1, "tp-eje tp-eje-f"));

        /* Leyenda de familias en el espacio vacío superior */
        var ley = document.createElement("div");
        ley.className = "tp-leyenda";
        ley.style.gridRow = "2 / 5";
        ley.style.gridColumn = "4 / 14";
        ley.innerHTML = ORDEN_LEYENDA.map(function (id) {
            return '<span class="tp-ley"><i class="tp-sw tpc-' + id + '"></i>' +
                nombreCategoria(id) + "</span>";
        }).join("");
        grid.appendChild(ley);
    }

    /* =========================================
    FILTROS
    ========================================= */

    function construirFiltros() {
        var cont = $("tp-chips");
        if (!cont) { return; }

        var html = '<button type="button" class="tp-chip activo" data-cat="">' +
            '<i class="tp-dot tp-dot-todas"></i>Todas</button>';

        CATEGORIAS.forEach(function (c) {
            html += '<button type="button" class="tp-chip" data-cat="' + c.id + '">' +
                '<i class="tp-dot tpc-' + c.id + '"></i>' + c.nombre + "</button>";
        });

        cont.innerHTML = html;
    }

    function aplicarFiltro(cat) {
        filtroActivo = cat;
        var total = 0;

        ELEMENTOS.forEach(function (e) {
            var ok = !cat || e.cat === cat;
            celdas[e.z].classList.toggle("tp-dim", !ok);
            if (ok) { total++; }
        });

        marcadores.forEach(function (m) {
            var ok = !cat || m.getAttribute("data-serie") === cat;
            m.classList.toggle("tp-dim", !ok);
        });

        var chips = document.querySelectorAll("#tp-chips .tp-chip");
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.toggle("activo", chips[i].getAttribute("data-cat") === cat);
        }

        var estado = $("tp-filtro-estado");
        if (estado) {
            estado.textContent = cat
                ? nombreCategoria(cat) + ": " + total + " elementos"
                : "Mostrando los 118 elementos";
        }
    }

    function alternarFiltros() {
        var panel = $("tp-filtros");
        var boton = $("tp-filtro-btn");
        if (!panel || !boton) { return; }
        var abrir = panel.hasAttribute("hidden");
        if (abrir) { panel.removeAttribute("hidden"); } else { panel.setAttribute("hidden", ""); }
        boton.setAttribute("aria-expanded", abrir ? "true" : "false");
        boton.classList.toggle("activo", abrir);
    }

    /* =========================================
    FICHA RÁPIDA
    ========================================= */

    function texto(id, valor) {
        var el = $(id);
        if (el) { el.textContent = valor; }
    }

    function masaTexto(e) {
        return masaEsNumeroMasico(e.z) ? "(" + e.masa + ")" : e.masa;
    }

    function grupoTexto(e) {
        return e.grupo === null ? "Serie f" : String(e.grupo);
    }

    function actualizarFicha(e) {
        texto("tp-f-titulo", "(" + e.n + ")");

        var cas = $("tp-casilla");
        if (cas) { cas.className = "tp-casilla tpc-" + e.cat; }

        texto("tp-f-z", e.z);
        texto("tp-f-masa-caja", masaTexto(e));
        texto("tp-f-sym", e.s);
        texto("tp-f-nom-caja", e.n);

        var fam = $("tp-f-familia");
        if (fam) {
            fam.innerHTML = '<i class="tp-sw tpc-' + e.cat + '"></i>' + nombreCategoria(e.cat);
        }

        texto("tp-f-nombre", e.n);
        texto("tp-f-simbolo", e.s);
        texto("tp-f-numero", e.z);
        texto("tp-f-masa", masaTexto(e) + " u");
        texto("tp-f-en", e.en);
        texto("tp-f-val", e.val);
        texto("tp-f-grupo", grupoTexto(e));
        texto("tp-f-periodo", e.periodo);

        var conf = $("tp-f-config");
        if (conf) { conf.innerHTML = configuracion(e.z); }

        texto("tp-f-contador", e.z + " / " + ELEMENTOS.length);
    }

    /* =========================================
    INFORMACIÓN AMPLIADA
    ========================================= */

    function filaDato(etiqueta, valor) {
        return "<li><span>" + etiqueta + "</span><strong>" + valor + "</strong></li>";
    }

    function conUnidadT(v) {
        return (v === "—" || v.indexOf("°C") !== -1) ? v : v + " °C";
    }

    function conUnidadD(v) {
        return (v === "—" || v.indexOf("g/") !== -1) ? v : v + " g/cm³";
    }

    function datosExtra(z) {
        if (window.QUIMICA_DATOS && window.QUIMICA_DATOS.obtener) {
            return window.QUIMICA_DATOS.obtener(z);
        }
        return { p: "—", a: "—", c: "—", e: "—", f: "—", b: "—", d: "—", r: "—", s: "—", k: "—" };
    }

    function actualizarInfo(e) {
        var cuerpo = $("tp-info-cuerpo");
        if (!cuerpo) { return; }

        var inf = infoDe(e);
        var x = datosExtra(e.z);

        var radiactivo = "Tiene isótopos estables";
        if (esRadiactivo(e.z)) {
            radiactivo = masaEsNumeroMasico(e.z)
                ? "Radiactivo (masa = isótopo más estable)"
                : "Radiactivo (sin isótopos estables)";
        }

        /* 1. Propiedades físicas y químicas (primero) */
        var fisicoquimicas = '<div class="tp-bloque tp-b-verde"><h4><i class="fa-solid fa-flask"></i> Propiedades físicas y químicas</h4>' +
            '<h5 class="tp-sub">Físicas</h5>' +
            '<ul class="tp-lista">' +
            filaDato("Aspecto", x.a) +
            filaDato("Conductividad", x.c) +
            filaDato("Estructura cristalina", x.e) +
            filaDato("Punto de fusión", conUnidadT(x.f)) +
            filaDato("Punto de ebullición", conUnidadT(x.b)) +
            filaDato("Densidad", conUnidadD(x.d)) +
            "</ul>" +
            '<h5 class="tp-sub">Químicas</h5>' +
            '<ul class="tp-lista">' +
            filaDato("Reactividad", x.r) +
            filaDato("Resistencia a ácidos", x.s) +
            filaDato("Compuestos comunes", x.k) +
            "</ul></div>";

        /* 2. Características y datos importantes */
        var caracteristicas = '<div class="tp-bloque tp-b-azul"><h4><i class="fa-solid fa-book-open"></i> Características y datos importantes</h4>' +
            "<p>" + inf.dato + "</p>" +
            '<p class="tp-linea"><strong>Obtención:</strong> ' + x.p + "</p>" +
            '<ul class="tp-lista">' +
            filaDato("Categoría", nombreCategoria(e.cat)) +
            filaDato("Estado a 25 °C", estadoFisico(e.z)) +
            filaDato("Radiactividad", radiactivo) +
            "</ul></div>";

        /* 3. Aplicaciones */
        var aplicaciones = '<div class="tp-bloque tp-b-naranja"><h4><i class="fa-solid fa-industry"></i> Aplicaciones en ingeniería e industria</h4>' +
            "<p>" + inf.apl + "</p></div>";

        /* 4. Reactividad y seguridad */
        var seguridad = '<div class="tp-bloque tp-b-rojo"><h4><i class="fa-solid fa-triangle-exclamation"></i> Reactividad y seguridad</h4>' +
            "<p>" + inf.reac + "</p></div>";

        var aviso = '<p class="tp-aviso">Información de referencia con fines educativos. ' +
            "Consulte siempre la hoja de seguridad (SDS) antes de manipular sustancias.</p>";

        cuerpo.innerHTML = '<h3 class="tp-info-titulo">' + e.n + " (" + e.s + ")</h3>" +
            fisicoquimicas + caracteristicas + aplicaciones + seguridad + aviso;
    }

    /* =========================================
    SELECCIÓN
    ========================================= */

    function centrarEnTabla(celda) {
        var sc = $("tp-scroll");
        if (!sc || !celda) { return; }
        var r = celda.getBoundingClientRect();
        var s = sc.getBoundingClientRect();
        sc.scrollBy({
            left: (r.left + r.width / 2) - (s.left + s.width / 2),
            behavior: "smooth"
        });
    }

    function irAFicha() {
        var ficha = document.querySelector(".tp-ficha");
        if (ficha) { ficha.scrollIntoView({ behavior: "smooth", block: "start" }); }
    }

    function seleccionar(z, desplazar) {
        if (z < 1) { z = ELEMENTOS.length; }
        if (z > ELEMENTOS.length) { z = 1; }

        var anterior = celdas[seleccionado];
        if (anterior) { anterior.classList.remove("sel"); }

        seleccionado = z;
        var e = ELEMENTOS[z - 1];
        var celda = celdas[z];
        if (celda) {
            celda.classList.add("sel");
            if (desplazar) { centrarEnTabla(celda); }
        }

        actualizarFicha(e);
        actualizarInfo(e);
    }

    /* =========================================
    BUSCADOR
    ========================================= */

    function buscar(consulta) {
        var q = normalizar(consulta);
        if (!q) { return null; }
        var i;

        if (/^\d+$/.test(q)) {
            var n = parseInt(q, 10);
            return (n >= 1 && n <= ELEMENTOS.length) ? n : null;
        }

        for (i = 0; i < ELEMENTOS.length; i++) {
            if (normalizar(ELEMENTOS[i].s) === q) { return ELEMENTOS[i].z; }
        }
        for (i = 0; i < ELEMENTOS.length; i++) {
            if (normalizar(ELEMENTOS[i].n) === q) { return ELEMENTOS[i].z; }
        }
        for (i = 0; i < ELEMENTOS.length; i++) {
            if (normalizar(ELEMENTOS[i].n).indexOf(q) === 0) { return ELEMENTOS[i].z; }
        }
        for (i = 0; i < ELEMENTOS.length; i++) {
            if (normalizar(ELEMENTOS[i].n).indexOf(q) !== -1) { return ELEMENTOS[i].z; }
        }
        return null;
    }

    function ejecutarBusqueda() {
        var campo = $("tp-buscador");
        var msg = $("tp-mensaje");
        if (!campo) { return false; }

        var valor = campo.value;
        if (!valor.trim()) {
            if (msg) { msg.textContent = ""; }
            return false;
        }

        var z = buscar(valor);
        if (z === null) {
            if (msg) { msg.textContent = "Sin resultados para «" + valor.trim() + "»."; }
            return false;
        }

        if (msg) { msg.textContent = ""; }
        seleccionar(z, true);
        return true;
    }

    /* =========================================
    EVENTOS
    ========================================= */

    function alternarInfo() {
        var panel = $("tp-info");
        var boton = $("tp-mas-info");
        if (!panel || !boton) { return; }

        var abrir = panel.hasAttribute("hidden");
        if (abrir) { panel.removeAttribute("hidden"); } else { panel.setAttribute("hidden", ""); }

        boton.setAttribute("aria-expanded", abrir ? "true" : "false");
        boton.classList.toggle("abierto", abrir);

        var rotulo = boton.querySelector("span");
        if (rotulo) { rotulo.textContent = abrir ? "Ocultar información" : "Más información"; }

        var ico = boton.querySelector("i");
        if (ico) { ico.className = abrir ? "fa-solid fa-minus" : "fa-solid fa-plus"; }

        if (abrir) {
            panel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    /* =========================================
    ZOOM DE LA TABLA (solo la tabla)
    ========================================= */

    var ZOOMS = [0.65, 0.8, 1];
    var zoomIdx = 1;

    function estadoZoom() {
        var menos = $("tp-zoom-menos");
        var mas = $("tp-zoom-mas");
        if (menos) { menos.disabled = (zoomIdx === 0); }
        if (mas) { mas.disabled = (zoomIdx === ZOOMS.length - 1); }
    }

    function aplicarZoom(delta) {
        var nuevo = zoomIdx + delta;
        if (nuevo < 0 || nuevo >= ZOOMS.length) { return; }

        var grid = $("tp-grid");
        var sc = $("tp-scroll");
        if (!grid || !sc) { return; }

        /* Conserva el punto que se está mirando */
        var centro = (sc.scrollLeft + sc.clientWidth / 2) / sc.scrollWidth;

        zoomIdx = nuevo;
        grid.style.setProperty("--tp-z", ZOOMS[zoomIdx]);
        sc.scrollLeft = centro * sc.scrollWidth - sc.clientWidth / 2;

        estadoZoom();
    }

    function iniciarEventos() {
        var grid = $("tp-grid");
        if (grid) {
            grid.addEventListener("click", function (ev) {
                var c = ev.target.closest(".tp-cell");
                if (c) {
                    seleccionar(parseInt(c.getAttribute("data-z"), 10), false);
                    irAFicha();
                }
            });
        }

        var campo = $("tp-buscador");
        if (campo) {
            campo.addEventListener("input", ejecutarBusqueda);
            campo.addEventListener("keydown", function (ev) {
                if (ev.key === "Enter") {
                    var encontrado = ejecutarBusqueda();
                    campo.blur();
                    if (encontrado) { irAFicha(); }
                }
            });
        }

        var btnFiltro = $("tp-filtro-btn");
        if (btnFiltro) { btnFiltro.addEventListener("click", alternarFiltros); }

        var chips = $("tp-chips");
        if (chips) {
            chips.addEventListener("click", function (ev) {
                var chip = ev.target.closest(".tp-chip");
                if (chip) { aplicarFiltro(chip.getAttribute("data-cat")); }
            });
        }

        var prev = $("tp-prev");
        if (prev) { prev.addEventListener("click", function () { seleccionar(seleccionado - 1, true); }); }

        var next = $("tp-next");
        if (next) { next.addEventListener("click", function () { seleccionar(seleccionado + 1, true); }); }

        var mas = $("tp-mas-info");
        if (mas) { mas.addEventListener("click", alternarInfo); }

        var zMenos = $("tp-zoom-menos");
        if (zMenos) { zMenos.addEventListener("click", function () { aplicarZoom(-1); }); }

        var zMas = $("tp-zoom-mas");
        if (zMas) { zMas.addEventListener("click", function () { aplicarZoom(1); }); }
    }

    /* =========================================
    INICIO
    ========================================= */

    document.addEventListener("DOMContentLoaded", function () {
        if (!$("tp-grid")) { return; }
        construirTabla();
        $("tp-grid").style.setProperty("--tp-z", ZOOMS[zoomIdx]);
        estadoZoom();
        construirFiltros();
        iniciarEventos();
        aplicarFiltro("");
        seleccionar(6, false);
    });

})();
