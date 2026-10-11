/* =========================================
   QUÍMICA UPDS
   DESAFÍO RÁPIDO DEL DÍA
   Developed by J. Poma · 2026

   Banco de preguntas de dos opciones.
   Funciona sin internet y se arma con:
   1) PREGUNTAS ESPECIALES (las escribes tú, abajo)
   2) PREGUNTAS AUTOMÁTICAS de Compuestos
      (compuestosinformacion.js)
   3) PREGUNTAS AUTOMÁTICAS de la Tabla periódica
      (datos.js + la lista de elementos de este archivo)

   La pregunta se queda hasta que respondan;
   al irse a otra pestaña, cambia por otra.
   ========================================= */

(function () {
    'use strict';


    /* =====================================================
       1) PREGUNTAS ESPECIALES (editables)
       -----------------------------------------------------
       p   = pregunta
       ok  = respuesta correcta
       no  = respuesta incorrecta
       exp = explicación que aparece al responder
       Para agregar una, copia una línea, pégala y cambia
       los textos (no olvides la coma al final).
       ===================================================== */

    var ESPECIALES = [
        { p: "¿El ion NO⁺ es diamagnético o paramagnético?", ok: "Diamagnético (10 e⁻)", no: "Paramagnético",
          exp: "El NO⁺ tiene 10 electrones de valencia (igual que el N₂ y el CO) y todos están apareados; por eso es diamagnético." },

        { p: "¿El O₂ es paramagnético o diamagnético?", ok: "Paramagnético", no: "Diamagnético",
          exp: "El O₂ tiene dos electrones desapareados en sus orbitales moleculares π* (antienlazantes); por eso es atraído por un imán." },

        { p: "¿El N₂ es diamagnético o paramagnético?", ok: "Diamagnético", no: "Paramagnético",
          exp: "Sus 10 electrones de valencia están todos apareados en los orbitales moleculares; además, su orden de enlace es 3." },

        { p: "¿El CO es diamagnético o paramagnético?", ok: "Diamagnético", no: "Paramagnético",
          exp: "El CO tiene 10 electrones de valencia, igual que el N₂ (son isoelectrónicos), y todos están apareados." },

        { p: "¿Qué ion es paramagnético: Fe³⁺ o Zn²⁺?", ok: "Fe³⁺", no: "Zn²⁺",
          exp: "El Fe³⁺ es d⁵: tiene 5 electrones desapareados. El Zn²⁺ es d¹⁰: todos sus electrones están apareados (diamagnético)." },

        { p: "¿Cuál tiene mayor energía de primera ionización: el Na o el Cl?", ok: "Cl", no: "Na",
          exp: "En un período, la energía de ionización aumenta de izquierda a derecha: el Cl atrae sus electrones con más fuerza que el Na." },

        { p: "¿Qué átomo tiene mayor radio atómico: el Li o el F?", ok: "Li", no: "F",
          exp: "En un período el radio disminuye de izquierda a derecha, porque aumenta la carga nuclear efectiva." },

        { p: "¿Cuál es más electronegativo: el F o el O?", ok: "F", no: "O",
          exp: "El flúor es el elemento más electronegativo de toda la tabla periódica." },

        { p: "¿Cuál de estos iones es isoelectrónico con el Ne: Na⁺ o Cl⁻?", ok: "Na⁺", no: "Cl⁻",
          exp: "El Na⁺ tiene 10 electrones, igual que el Ne. El Cl⁻ tiene 18 (igual que el Ar)." },

        { p: "¿Qué geometría molecular tiene el CH₄?", ok: "Tetraédrica", no: "Plana cuadrada",
          exp: "El carbono tiene 4 pares de electrones enlazantes y ninguno libre; se ubican en los vértices de un tetraedro (109,5°)." },

        { p: "¿Cuál es la hibridación del carbono en el CH₄?", ok: "sp³", no: "sp²",
          exp: "El carbono mezcla un orbital s con tres p y forma cuatro orbitales sp³ equivalentes." },

        { p: "¿La molécula de H₂O es polar o apolar?", ok: "Polar", no: "Apolar",
          exp: "Es angular (≈ 104,5°) y el oxígeno es más electronegativo que el hidrógeno; los dipolos no se cancelan." },

        { p: "¿La molécula de CO₂ es polar o apolar?", ok: "Apolar", no: "Polar",
          exp: "Cada enlace C=O es polar, pero la molécula es lineal y los dos dipolos se cancelan." },

        { p: "¿Qué tipo de enlace predomina en el NaCl?", ok: "Iónico", no: "Covalente",
          exp: "La diferencia de electronegatividad entre Na y Cl es muy grande: el sodio cede un electrón al cloro y se forman iones Na⁺ y Cl⁻." },

        { p: "¿Qué enlace hay entre los dos átomos de la molécula de N₂?", ok: "Triple", no: "Doble",
          exp: "Cada nitrógeno aporta 3 electrones al enlace: forma un enlace σ y dos enlaces π (orden de enlace 3)." },

        { p: "Una solución con pH 3 es…", ok: "Ácida", no: "Básica",
          exp: "Un pH menor que 7 indica una solución ácida; entre más bajo, más ácida." },

        { p: "¿Cuál es el número de oxidación del azufre en el H₂SO₄?", ok: "+6", no: "+4",
          exp: "2(+1) + x + 4(−2) = 0, entonces x = +6." },

        { p: "¿Cuál es el número de oxidación del Mn en el KMnO₄?", ok: "+7", no: "+4",
          exp: "(+1) + x + 4(−2) = 0, entonces x = +7." }
    ];


    /* =====================================================
       2) LISTA DE ELEMENTOS (Z, símbolo, nombre)
       ===================================================== */

    var ELEMENTOS = [
        [1,"H","Hidrógeno"],[2,"He","Helio"],[3,"Li","Litio"],[4,"Be","Berilio"],[5,"B","Boro"],
        [6,"C","Carbono"],[7,"N","Nitrógeno"],[8,"O","Oxígeno"],[9,"F","Flúor"],[10,"Ne","Neón"],
        [11,"Na","Sodio"],[12,"Mg","Magnesio"],[13,"Al","Aluminio"],[14,"Si","Silicio"],[15,"P","Fósforo"],
        [16,"S","Azufre"],[17,"Cl","Cloro"],[18,"Ar","Argón"],[19,"K","Potasio"],[20,"Ca","Calcio"],
        [21,"Sc","Escandio"],[22,"Ti","Titanio"],[23,"V","Vanadio"],[24,"Cr","Cromo"],[25,"Mn","Manganeso"],
        [26,"Fe","Hierro"],[27,"Co","Cobalto"],[28,"Ni","Níquel"],[29,"Cu","Cobre"],[30,"Zn","Zinc"],
        [31,"Ga","Galio"],[32,"Ge","Germanio"],[33,"As","Arsénico"],[34,"Se","Selenio"],[35,"Br","Bromo"],
        [36,"Kr","Kriptón"],[37,"Rb","Rubidio"],[38,"Sr","Estroncio"],[39,"Y","Itrio"],[40,"Zr","Circonio"],
        [41,"Nb","Niobio"],[42,"Mo","Molibdeno"],[43,"Tc","Tecnecio"],[44,"Ru","Rutenio"],[45,"Rh","Rodio"],
        [46,"Pd","Paladio"],[47,"Ag","Plata"],[48,"Cd","Cadmio"],[49,"In","Indio"],[50,"Sn","Estaño"],
        [51,"Sb","Antimonio"],[52,"Te","Telurio"],[53,"I","Yodo"],[54,"Xe","Xenón"],[55,"Cs","Cesio"],
        [56,"Ba","Bario"],[57,"La","Lantano"],[58,"Ce","Cerio"],[59,"Pr","Praseodimio"],[60,"Nd","Neodimio"],
        [61,"Pm","Prometio"],[62,"Sm","Samario"],[63,"Eu","Europio"],[64,"Gd","Gadolinio"],[65,"Tb","Terbio"],
        [66,"Dy","Disprosio"],[67,"Ho","Holmio"],[68,"Er","Erbio"],[69,"Tm","Tulio"],[70,"Yb","Iterbio"],
        [71,"Lu","Lutecio"],[72,"Hf","Hafnio"],[73,"Ta","Tántalo"],[74,"W","Wolframio"],[75,"Re","Renio"],
        [76,"Os","Osmio"],[77,"Ir","Iridio"],[78,"Pt","Platino"],[79,"Au","Oro"],[80,"Hg","Mercurio"],
        [81,"Tl","Talio"],[82,"Pb","Plomo"],[83,"Bi","Bismuto"],[84,"Po","Polonio"],[85,"At","Astato"],
        [86,"Rn","Radón"],[87,"Fr","Francio"],[88,"Ra","Radio"],[89,"Ac","Actinio"],[90,"Th","Torio"],
        [91,"Pa","Protactinio"],[92,"U","Uranio"],[93,"Np","Neptunio"],[94,"Pu","Plutonio"],[95,"Am","Americio"],
        [96,"Cm","Curio"],[97,"Bk","Berkelio"],[98,"Cf","Californio"],[99,"Es","Einstenio"],[100,"Fm","Fermio"],
        [101,"Md","Mendelevio"],[102,"No","Nobelio"],[103,"Lr","Lawrencio"]
    ];

    var Z_MAX = 103;   /* las preguntas usan solo elementos conocidos (Z ≤ 103) */

    function elemento(z) { return ELEMENTOS[z - 1]; }
    function simbolo(z) { return elemento(z)[1]; }
    function nombreEl(z) { return elemento(z)[2]; }

    /* Grupo (1–18). Lantánidos y actínidos no llevan grupo. */
    function grupoDe(z) {
        if (z === 1) return 1;
        if (z === 2) return 18;
        if (z <= 4) return z - 2;
        if (z <= 10) return z + 8;
        if (z <= 12) return z - 10;
        if (z <= 18) return z;
        if (z <= 36) return z - 18;
        if (z <= 54) return z - 36;
        if (z <= 56) return z - 54;
        if (z >= 57 && z <= 71) return null;
        if (z <= 86) return z - 68;
        if (z <= 88) return z - 86;
        if (z >= 89 && z <= 103) return null;
        return z - 100;
    }

    function periodoDe(z) {
        if (z <= 2) return 1;
        if (z <= 10) return 2;
        if (z <= 18) return 3;
        if (z <= 36) return 4;
        if (z <= 54) return 5;
        if (z <= 86) return 6;
        return 7;
    }


    /* =====================================================
       3) UTILIDADES
       ===================================================== */

    var CLAVE_PUNTAJE = 'quimica_upds_desafio_puntaje';
    var CLAVE_HISTORIAL = 'quimica_upds_desafio_historial';
    var MAX_HISTORIAL = 150;

    function azar(n) { return Math.floor(Math.random() * n); }
    function elegir(lista) { return lista[azar(lista.length)]; }

    function mezclar(lista) {
        var a = lista.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = azar(i + 1);
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function norm(s) {
        return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function palabras(s) {
        return norm(s).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 5; });
    }

    function primeraOracion(t) {
        t = String(t || '').trim();
        if (!t) return '';
        var i = t.search(/\.(\s|$)/);
        var o = i >= 0 ? t.slice(0, i + 1) : t;
        if (o.length > 190) o = o.slice(0, 187).replace(/\s+\S*$/, '') + '…';
        if (!/[.…!?]$/.test(o)) o += '.';
        return o;
    }

    function leerJSON(clave, defecto) {
        try { return JSON.parse(localStorage.getItem(clave)) || defecto; }
        catch (e) { return defecto; }
    }

    function guardarJSON(clave, valor) {
        try { localStorage.setItem(clave, JSON.stringify(valor)); }
        catch (e) { /* sin almacenamiento: se ignora */ }
    }

    function numero(s) {
        return /^-?\d+(\.\d+)?$/.test(String(s).trim()) ? parseFloat(s) : null;
    }


    /* =====================================================
       4) PREGUNTAS AUTOMÁTICAS · COMPUESTOS
       ===================================================== */

    var TIPOS = { acidos: 'Ácido', bases: 'Base', sales: 'Sal', oxidos: 'Óxido' };

    var AREAS = {
        hogar: 'Hogar', laboratorio: 'Laboratorio', industria: 'Industria',
        agro: 'Agro', salud: 'Salud', alimentacion: 'Alimentación'
    };

    function listaCompuestos() {
        return Array.isArray(window.CMP_DATOS) ? window.CMP_DATOS : [];
    }

    function otroCompuesto(L, c, condicion, preferirMismaCat) {
        var i, d;
        if (preferirMismaCat) {
            var mismos = L.filter(function (x) { return x.cat === c.cat && x.id !== c.id && condicion(x); });
            if (mismos.length) return elegir(mismos);
        }
        var otros = L.filter(function (x) { return x.id !== c.id && condicion(x); });
        return otros.length ? elegir(otros) : null;
    }

    var GEN_COMPUESTOS = [

        /* Fórmula de un compuesto */
        function (L) {
            var c = elegir(L);
            var d = otroCompuesto(L, c, function (x) { return x.formula && x.formula !== c.formula; }, true);
            if (!c.formula || !d) return null;
            return {
                id: 'c:formula:' + c.id,
                p: '¿Cuál es la fórmula de «' + c.nombre + '»?',
                ok: c.formula, no: d.formula,
                exp: c.nombre + ' se representa como ' + c.formula + '. ' + primeraOracion(c.desc)
            };
        },

        /* Nombre a partir de la fórmula */
        function (L) {
            var c = elegir(L);
            var d = otroCompuesto(L, c, function (x) { return x.formula && x.formula !== c.formula; }, true);
            if (!c.formula || !d) return null;
            return {
                id: 'c:nombre:' + c.id,
                p: '¿Qué compuesto tiene la fórmula «' + c.formula + '»?',
                ok: c.nombre, no: d.nombre,
                exp: c.formula + ' es ' + c.nombre + '. ' + primeraOracion(c.desc)
            };
        },

        /* Tipo: ácido, base, sal u óxido */
        function (L) {
            var base = L.filter(function (x) { return TIPOS[x.cat]; });
            if (!base.length) return null;
            var c = elegir(base);
            var otros = Object.keys(TIPOS).filter(function (k) { return k !== c.cat; });
            return {
                id: 'c:tipo:' + c.id,
                p: '¿A qué tipo de compuesto pertenece «' + c.nombre + '»?',
                ok: TIPOS[c.cat], no: TIPOS[elegir(otros)],
                exp: c.nombre + ' (' + c.formula + ') se clasifica como ' + TIPOS[c.cat].toLowerCase() + '. ' + primeraOracion(c.desc)
            };
        },

        /* Nivel de riesgo (alto o bajo) */
        function (L) {
            var base = L.filter(function (x) { return x.riesgo === 'alto' || x.riesgo === 'bajo'; });
            if (!base.length) return null;
            var c = elegir(base);
            var contrario = c.riesgo === 'alto' ? 'Bajo' : 'Alto';
            var propio = c.riesgo === 'alto' ? 'Alto' : 'Bajo';
            return {
                id: 'c:riesgo:' + c.id,
                p: '¿Qué nivel de riesgo tiene «' + c.nombre + '»: alto o bajo?',
                ok: propio, no: contrario,
                exp: 'Su nivel de riesgo es ' + c.riesgo + '. ' + primeraOracion(c.seg)
            };
        },

        /* Estado físico a temperatura ambiente */
        function (L) {
            var base = L.filter(function (x) { return /^(Sólido|Líquido|Gas)/.test(x.estado || ''); });
            if (!base.length) return null;
            var c = elegir(base);
            var est = /^Sólido/.test(c.estado) ? 'Sólido' : /^Líquido/.test(c.estado) ? 'Líquido' : 'Gas';
            var otros = ['Sólido', 'Líquido', 'Gas'].filter(function (e) { return e !== est; });
            return {
                id: 'c:estado:' + c.id,
                p: '¿En qué estado se encuentra «' + c.nombre + '» a temperatura ambiente?',
                ok: est, no: elegir(otros),
                exp: c.nombre + ': ' + c.estado + '.'
            };
        },

        /* Nombre alternativo (el común) */
        function (L) {
            var c = elegir(L);
            var alias = String(c.otros || '').split(' · ').filter(function (a) {
                return a && a.indexOf('(') < 0 && a.length <= 40 && norm(a) !== norm(c.nombre);
            });
            if (!alias.length) return null;
            var a = elegir(alias);
            var clave = norm(a);
            var d = otroCompuesto(L, c, function (x) {
                return norm(x.nombre + ' ' + (x.otros || '')).indexOf(clave) < 0;
            }, true);
            if (!d) return null;
            return {
                id: 'c:alias:' + c.id,
                p: '¿Qué compuesto se conoce también como «' + a + '»?',
                ok: c.nombre, no: d.nombre,
                exp: '«' + a + '» es otro nombre de ' + c.nombre + ' (' + c.formula + ').'
            };
        },

        /* Masa molar */
        function (L) {
            var c = elegir(L.filter(function (x) { return x.masa && x.formula; }));
            var d = otroCompuesto(L, c, function (x) { return x.masa && x.masa !== c.masa; }, false);
            if (!c || !d) return null;
            return {
                id: 'c:masa:' + c.id,
                p: '¿Cuál es la masa molar de «' + c.nombre + '» (' + c.formula + ')?',
                ok: c.masa, no: d.masa,
                exp: 'La masa molar de ' + c.nombre + ' es ' + c.masa + '.'
            };
        },

        /* Para qué se usa */
        function (L) {
            var c = elegir(L.filter(function (x) { return x.usos && Object.keys(x.usos).length; }));
            if (!c) return null;
            var area = elegir(Object.keys(c.usos));
            var propios = {};
            palabras(Object.keys(c.usos).map(function (k) { return c.usos[k]; }).join(' ') + ' ' + (c.tags || []).join(' ') + ' ' + c.desc)
                .forEach(function (w) { propios[w] = true; });
            var candidatos = L.filter(function (x) {
                if (x.id === c.id || x.cat === c.cat || !x.usos || !Object.keys(x.usos).length) return false;
                var otros = palabras(Object.keys(x.usos).map(function (k) { return x.usos[k]; }).join(' '));
                return otros.every(function (w) { return !propios[w]; });
            });
            if (!candidatos.length) return null;
            var d = elegir(candidatos);
            var textoOtro = d.usos[elegir(Object.keys(d.usos))];
            return {
                id: 'c:uso:' + c.id,
                p: '¿Para qué se usa «' + c.nombre + '»?',
                ok: c.usos[area], no: textoOtro,
                exp: 'En ' + (AREAS[area] || area).toLowerCase() + ', ' + c.nombre + ' se usa en: ' + c.usos[area].replace(/\.$/, '').replace(/^./, function (m) { return m.toLowerCase(); }) + '.'
            };
        }
    ];


    /* =====================================================
       5) PREGUNTAS AUTOMÁTICAS · TABLA PERIÓDICA
       ===================================================== */

    function zAlAzar(filtro) {
        var zs = [];
        for (var z = 1; z <= Z_MAX; z++) if (!filtro || filtro(z)) zs.push(z);
        return zs.length ? elegir(zs) : null;
    }

    var FAMILIAS = {
        alcalino: { nombre: 'Metal alcalino', zs: [3, 11, 19, 37, 55, 87],
            exp: 'Los metales alcalinos (grupo 1) son blandos, muy reactivos y tienen 1 electrón de valencia.' },
        alcalinoterreo: { nombre: 'Metal alcalinotérreo', zs: [4, 12, 20, 38, 56, 88],
            exp: 'Los metales alcalinotérreos (grupo 2) tienen 2 electrones de valencia y son bastante reactivos.' },
        halogeno: { nombre: 'Halógeno', zs: [9, 17, 35, 53, 85],
            exp: 'Los halógenos (grupo 17) tienen 7 electrones de valencia y forman sales con los metales.' },
        noble: { nombre: 'Gas noble', zs: [2, 10, 18, 36, 54, 86],
            exp: 'Los gases nobles (grupo 18) tienen la capa de valencia completa, por eso casi no reaccionan.' },
        transicion: { nombre: 'Metal de transición',
            zs: [21, 22, 23, 24, 25, 26, 27, 28, 29, 39, 40, 41, 42, 43, 44, 45, 46, 47, 72, 73, 74, 75, 76, 77, 78, 79],
            exp: 'Los metales de transición (grupos 3 a 11) van llenando orbitales d y suelen tener varios estados de oxidación.' }
    };

    var ESTRUCTURAS = {
        BCC: { nombre: 'Cúbica centrada en el cuerpo (BCC)', exp: 'BCC: un átomo en cada vértice del cubo y uno en el centro.' },
        HCP: { nombre: 'Hexagonal compacta (HCP)', exp: 'HCP: capas de átomos hexagonales apiladas de forma muy compacta.' },
        FCC: { nombre: 'Cúbica centrada en las caras (FCC)', exp: 'FCC: un átomo en cada vértice del cubo y uno en el centro de cada cara.' }
    };

    function tipoEstructura(texto) {
        var t = String(texto || '').trim();
        if (t === 'BCC' || t === 'Cúbica centrada en el cuerpo (BCC)') return 'BCC';
        if (t === 'HCP' || t === 'Hexagonal compacta (HCP)') return 'HCP';
        if (t === 'FCC' || t === 'Cúbica centrada en las caras (FCC)') return 'FCC';
        return null;
    }

    /* Estado a 25 °C a partir de fusión y ebullición (°C) */
    function estadoDelElemento(z) {
        var d = window.QUIMICA_DATOS && window.QUIMICA_DATOS.obtener(z);
        if (!d) return null;
        var f = numero(d.f), b = numero(d.b);
        if (f !== null) {
            if (f > 25) return 'Sólido';
            return (b !== null && b > 25) ? 'Líquido' : (b !== null ? 'Gas' : null);
        }
        if (z === 2) return 'Gas';   /* helio: solo solidifica a alta presión */
        return null;
    }

    function otroNumero(valor, minimo, maximo, saltos) {
        var intentos = 0, n;
        do {
            var s = elegir(saltos);
            n = valor + (Math.random() < 0.5 ? -s : s);
            intentos++;
        } while ((n === valor || n < minimo || n > maximo) && intentos < 50);
        return (n === valor || n < minimo || n > maximo) ? null : n;
    }

    var GEN_ELEMENTOS = [

        /* Símbolo de un elemento */
        function () {
            var z = zAlAzar();
            var mismos = [];
            for (var k = 1; k <= Z_MAX; k++) {
                if (k !== z && simbolo(k) !== simbolo(z) && simbolo(k).charAt(0) === simbolo(z).charAt(0)) mismos.push(k);
            }
            var d = mismos.length ? elegir(mismos) : zAlAzar(function (k) { return k !== z; });
            return {
                id: 'e:simbolo:' + z,
                p: '¿Cuál es el símbolo del ' + nombreEl(z).toLowerCase() + '?',
                ok: simbolo(z), no: simbolo(d),
                exp: 'El símbolo del ' + nombreEl(z).toLowerCase() + ' es ' + simbolo(z) + ' (Z = ' + z + ').'
            };
        },

        /* Nombre a partir del símbolo */
        function () {
            var z = zAlAzar();
            var d = zAlAzar(function (k) { return k !== z; });
            return {
                id: 'e:nombre:' + z,
                p: '¿A qué elemento corresponde el símbolo «' + simbolo(z) + '»?',
                ok: nombreEl(z), no: nombreEl(d),
                exp: simbolo(z) + ' es el símbolo del ' + nombreEl(z).toLowerCase() + ' (Z = ' + z + ').'
            };
        },

        /* Número atómico */
        function () {
            var z = zAlAzar();
            var d = otroNumero(z, 1, Z_MAX, [1, 2, 3, 4]);
            if (d === null) return null;
            return {
                id: 'e:z:' + z,
                p: '¿Cuál es el número atómico (Z) del ' + nombreEl(z).toLowerCase() + '?',
                ok: String(z), no: String(d),
                exp: 'El ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ') tiene Z = ' + z + ': es el número de protones de su núcleo.'
            };
        },

        /* Familia */
        function () {
            var claves = Object.keys(FAMILIAS);
            var clave = elegir(claves);
            var z = elegir(FAMILIAS[clave].zs);
            var otra = elegir(claves.filter(function (k) { return k !== clave; }));
            return {
                id: 'e:familia:' + z,
                p: '¿A qué familia pertenece el ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ')?',
                ok: FAMILIAS[clave].nombre, no: FAMILIAS[otra].nombre,
                exp: FAMILIAS[clave].exp
            };
        },

        /* Grupo */
        function () {
            var z = zAlAzar(function (k) { return k <= 86 && grupoDe(k) !== null; });
            var g = grupoDe(z);
            var d = otroNumero(g, 1, 18, [1, 2, 3, 4]);
            if (d === null) return null;
            return {
                id: 'e:grupo:' + z,
                p: '¿En qué grupo de la tabla periódica está el ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ')?',
                ok: 'Grupo ' + g, no: 'Grupo ' + d,
                exp: 'El ' + nombreEl(z).toLowerCase() + ' está en el grupo ' + g + ' y en el período ' + periodoDe(z) + '.'
            };
        },

        /* Período */
        function () {
            var z = zAlAzar();
            var p = periodoDe(z);
            var d = otroNumero(p, 1, 7, [1, 2, 3]);
            if (d === null) return null;
            return {
                id: 'e:periodo:' + z,
                p: '¿En qué período está el ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ')?',
                ok: 'Período ' + p, no: 'Período ' + d,
                exp: 'El ' + nombreEl(z).toLowerCase() + ' está en el período ' + p + ': el período indica cuántas capas electrónicas tiene el átomo.'
            };
        },

        /* Electrones de valencia (grupos principales) */
        function () {
            var z = zAlAzar(function (k) {
                var g = grupoDe(k);
                return k >= 3 && k <= 86 && g !== null && (g <= 2 || g >= 13);
            });
            var g = grupoDe(z);
            var v = g <= 2 ? g : (g === 18 ? 8 : g - 10);
            var d = otroNumero(v, 1, 8, [1, 2, 3]);
            if (d === null) return null;
            return {
                id: 'e:valencia:' + z,
                p: '¿Cuántos electrones de valencia tiene el ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ')?',
                ok: String(v), no: String(d),
                exp: 'El ' + nombreEl(z).toLowerCase() + ' está en el grupo ' + g + ', así que tiene ' + v + ' electrones de valencia.'
            };
        },

        /* Estado a temperatura ambiente */
        function () {
            var z = zAlAzar(function (k) { return estadoDelElemento(k) !== null; });
            if (z === null) return null;
            var est = estadoDelElemento(z);
            var d = window.QUIMICA_DATOS.obtener(z);
            var otros = ['Sólido', 'Líquido', 'Gas'].filter(function (e) { return e !== est; });
            var fus = numero(d.f), ebu = numero(d.b);
            var detalle = (fus !== null ? 'Se funde a ' + fus + ' °C' : '') +
                (fus !== null && ebu !== null ? ' y hierve a ' + ebu + ' °C' : (ebu !== null ? 'Hierve a ' + ebu + ' °C' : '')) + '.';
            return {
                id: 'e:estado:' + z,
                p: '¿En qué estado se encuentra el ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ') a temperatura ambiente?',
                ok: est, no: elegir(otros),
                exp: 'A 25 °C el ' + nombreEl(z).toLowerCase() + ' es ' + est.toLowerCase() + '. ' + detalle
            };
        },

        /* Estructura cristalina */
        function () {
            var z = zAlAzar(function (k) {
                var d = window.QUIMICA_DATOS && window.QUIMICA_DATOS.obtener(k);
                return d && tipoEstructura(d.e) !== null;
            });
            if (z === null) return null;
            var t = tipoEstructura(window.QUIMICA_DATOS.obtener(z).e);
            var otra = elegir(Object.keys(ESTRUCTURAS).filter(function (k) { return k !== t; }));
            return {
                id: 'e:estructura:' + z,
                p: '¿Qué estructura cristalina presenta el ' + nombreEl(z).toLowerCase() + ' (' + simbolo(z) + ')?',
                ok: ESTRUCTURAS[t].nombre, no: ESTRUCTURAS[otra].nombre,
                exp: 'El ' + nombreEl(z).toLowerCase() + ' cristaliza en la estructura ' + ESTRUCTURAS[t].nombre + '. ' + ESTRUCTURAS[t].exp
            };
        }
    ];


    /* =====================================================
       6) ELEGIR LA SIGUIENTE PREGUNTA
       ===================================================== */

    var historial = leerJSON(CLAVE_HISTORIAL, []);

    function recordar(id) {
        historial.push(id);
        if (historial.length > MAX_HISTORIAL) historial = historial.slice(-MAX_HISTORIAL);
        guardarJSON(CLAVE_HISTORIAL, historial);
    }

    function intentar(generadores, arg) {
        var g = elegir(generadores);
        try { return g(arg); } catch (e) { return null; }
    }

    function generarPregunta() {
        var L = listaCompuestos();
        var candidata = null;

        for (var i = 0; i < 60; i++) {
            var r = Math.random();
            var q = null;

            if (r < 0.25) {
                var e = elegir(ESPECIALES);
                q = { id: 's:' + e.p, p: e.p, ok: e.ok, no: e.no, exp: e.exp };
            } else if (r < 0.65 && L.length) {
                q = intentar(GEN_COMPUESTOS, L);
            } else {
                q = intentar(GEN_ELEMENTOS);
            }

            if (!q || !q.ok || !q.no || q.ok === q.no) continue;
            if (!candidata) candidata = q;
            if (historial.indexOf(q.id) < 0) { candidata = q; break; }
        }

        if (!candidata) {
            var f = elegir(ESPECIALES);
            candidata = { id: 's:' + f.p, p: f.p, ok: f.ok, no: f.no, exp: f.exp };
        }

        recordar(candidata.id);
        return candidata;
    }


    /* =====================================================
       7) TARJETA EN LA PANTALLA DE INICIO
       ===================================================== */

    var el = {};
    var puntaje = leerJSON(CLAVE_PUNTAJE, { ok: 0, no: 0 });
    var actual = null;
    var respondido = false;

    function pintarPuntaje() {
        if (!el.aciertos) return;
        el.aciertos.textContent = puntaje.ok;
        el.errores.textContent = puntaje.no;
    }

    function crearMarcador() {
        var cab = el.tarjeta.querySelector('.card-header');
        if (!cab || el.marcador) return;

        var m = document.createElement('div');
        m.className = 'challenge-score';
        m.setAttribute('title', 'Aciertos y errores');
        m.innerHTML =
            '<span class="score-ok" aria-label="Aciertos"><i class="fa-solid fa-check"></i> <b></b></span>' +
            '<span class="score-no" aria-label="Errores"><i class="fa-solid fa-xmark"></i> <b></b></span>';
        cab.appendChild(m);

        el.marcador = m;
        el.aciertos = m.querySelector('.score-ok b');
        el.errores = m.querySelector('.score-no b');
        pintarPuntaje();
    }

    function mostrar(q) {
        var opciones = mezclar([{ t: q.ok, c: true }, { t: q.no, c: false }]);

        el.pregunta.textContent = q.p;

        el.botones.forEach(function (b, i) {
            b.textContent = opciones[i].t;
            b.classList.remove('correcta', 'incorrecta');
            b.disabled = false;
            if (opciones[i].c) b.setAttribute('data-correcta', '');
            else b.removeAttribute('data-correcta');
        });

        if (el.resultado) {
            el.resultado.hidden = true;
            el.resultado.textContent = '';
        }

        actual = q;
        respondido = false;
    }

    function siguiente() {
        mostrar(generarPregunta());
    }

    function alResponder(boton) {
        if (respondido || !actual) return;
        respondido = true;

        var acerto = boton.hasAttribute('data-correcta');
        boton.classList.add(acerto ? 'correcta' : 'incorrecta');

        if (!acerto) {
            el.botones.forEach(function (otro) {
                if (otro.hasAttribute('data-correcta')) otro.classList.add('correcta');
            });
        }

        el.botones.forEach(function (otro) { otro.disabled = true; });

        if (acerto) puntaje.ok++; else puntaje.no++;
        guardarJSON(CLAVE_PUNTAJE, puntaje);
        pintarPuntaje();

        if (el.resultado) {
            el.resultado.textContent = '';
            var titulo = document.createElement('strong');
            titulo.className = acerto ? 'ok' : 'no';
            titulo.textContent = acerto ? '¡Correcto!' : 'Incorrecto.';
            el.resultado.appendChild(titulo);
            el.resultado.appendChild(document.createTextNode(' ' + actual.exp));
            el.resultado.hidden = false;
        }
    }

    function iniciar() {
        el.tarjeta = document.querySelector('.challenge-card');
        if (!el.tarjeta) return;

        el.pregunta = el.tarjeta.querySelector('.question');
        el.botones = Array.prototype.slice.call(el.tarjeta.querySelectorAll('.answer-buttons button'));
        el.resultado = el.tarjeta.querySelector('.challenge-result');

        if (!el.pregunta || el.botones.length < 2) return;

        crearMarcador();

        el.botones.forEach(function (b) {
            b.addEventListener('click', function () { alResponder(b); });
        });

        siguiente();
    }

    /* Se llama cada vez que la persona cambia de pestaña:
       si ya respondió, la próxima vez verá otra pregunta */
    function alSalirDeInicio() {
        if (respondido) siguiente();
    }

    window.Desafios = {
        iniciar: iniciar,
        alSalirDeInicio: alSalirDeInicio,
        generar: generarPregunta   /* útil para probar en la consola */
    };

})();
