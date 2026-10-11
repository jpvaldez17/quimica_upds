/* =============================================================================
   formulas.js — Motor de datos y cálculo químico de QuímicApp
   Catálogo v1.1  ·  lo consume reacciones.js (pestaña Reacciones)

   QUÉ HAY AQUÍ
   1. ELEMENTOS   Tabla periódica completa (118): símbolo, nombre, número
                  atómico, masa atómica, clasificación y estados de oxidación.
   2. Parser      parsearFormula / calcularMasaMolar: descomponen cualquier
                  fórmula (H2SO4, Ca(NO3)2, Fe2(SO4)3, CuSO4·5H2O) y calculan
                  su masa molar con ELEMENTOS. No hace falta que la sustancia
                  esté en el catálogo.
   3. IONES       Cationes y aniones (con carga y estados de oxidación).
   4. COMPUESTOS  Ácidos, bases, sales, óxidos, sustancias simples y
                  orgánicos. Las especies iónicas se GENERAN a partir de sus
                  iones (fórmula, nombre y estados de oxidación salen de ahí),
                  así no puede haber inconsistencias entre ellos.
   5. REGLAS      Reglas de predicción de productos (redox, neutralización,
                  combustión, síntesis, descomposición, desplazamiento simple,
                  precipitación...) y utilidades de balanceo.

   CÓMO LO USA reacciones.js (todo transparente, sin tocar nada aquí)
   - CATALOGO.elementos / compuestos / iones   → índice de sustancias.
   - CATALOGO.reglas                           → predicción de productos.
   - CATALOGO.resolverFormula(texto)           → cualquier fórmula válida que
                                                 no esté en el catálogo.
   - CATALOGO.resolverAmbiguedad(R, P)         → coeficientes de reacciones
                                                 redox que solo con átomos no
                                                 tienen solución única.

   CÓMO AMPLIAR
   - Elemento: ya están los 118.
   - Sal / base / óxido iónico: agrega el par de iones en PARES_SALES,
     CATIONES_BASES o CATIONES_OXIDOS (y el ion en CATIONES/ANIONES si falta).
   - Sustancia molecular: agrega una fila en MOLECULAS.
   - Reacción fija: agrega una fila en REDOX_FIJAS (con sus coeficientes).
   - Siempre corre CATALOGO.validar() en la consola: devuelve [] si todo cuadra.

   NOTA SOBRE LOS DATOS
   Masas atómicas: valores estándar abreviados (IUPAC), en g/mol. Para los
   elementos sin isótopo estable (Tc, Pm, Po y siguientes, salvo Th, Pa y U)
   se da el número de masa del isótopo más estable (masaAproximada: true).
   Estados de oxidación: los principales de cada elemento (no exhaustivos).
   ========================================================================== */

(function (global) {
  'use strict';

  /* =========================================================================
     0. UTILIDADES
     ====================================================================== */
  function rango(a, b) { var r = []; for (var i = a; i <= b; i++) r.push(i); return r; }
  function mcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function unicos(arr) { return arr.filter(function (x, i) { return arr.indexOf(x) === i; }); }
  function buscarEn(arr, fn) { for (var i = 0; i < arr.length; i++) if (fn(arr[i])) return arr[i]; return null; }
  function normalizar(s) {
    return String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
  }
  function sumaAtomos(comp) { return Object.keys(comp).reduce(function (a, k) { return a + comp[k]; }, 0); }

  /* =========================================================================
     1. TABLA PERIÓDICA  (ELEMENTOS)
     Fila: [Z, símbolo, nombre, masa atómica, clase, estados de oxidación]
     ====================================================================== */
  var CLASE = {
    AL: 'metal alcalino', AT: 'metal alcalinotérreo', TR: 'metal de transición',
    PT: 'metal post-transición', MD: 'metaloide', NM: 'no metal', HL: 'halógeno',
    GN: 'gas noble', LN: 'lantánido', AC: 'actínido'
  };
  var CLASES_METAL = [CLASE.AL, CLASE.AT, CLASE.TR, CLASE.PT, CLASE.LN, CLASE.AC];

  var TABLA = [
    [1,  'H',  'Hidrógeno',     1.008,    'NM', [-1, 1]],
    [2,  'He', 'Helio',         4.0026,   'GN', [0]],
    [3,  'Li', 'Litio',         6.94,     'AL', [1]],
    [4,  'Be', 'Berilio',       9.0122,   'AT', [2]],
    [5,  'B',  'Boro',          10.81,    'MD', [3]],
    [6,  'C',  'Carbono',       12.011,   'NM', [-4, -2, 2, 4]],
    [7,  'N',  'Nitrógeno',     14.007,   'NM', [-3, 1, 2, 3, 4, 5]],
    [8,  'O',  'Oxígeno',       15.999,   'NM', [-2, -1]],
    [9,  'F',  'Flúor',         18.998,   'HL', [-1]],
    [10, 'Ne', 'Neón',          20.180,   'GN', [0]],
    [11, 'Na', 'Sodio',         22.990,   'AL', [1]],
    [12, 'Mg', 'Magnesio',      24.305,   'AT', [2]],
    [13, 'Al', 'Aluminio',      26.982,   'PT', [3]],
    [14, 'Si', 'Silicio',       28.085,   'MD', [-4, 4]],
    [15, 'P',  'Fósforo',       30.974,   'NM', [-3, 3, 5]],
    [16, 'S',  'Azufre',        32.06,    'NM', [-2, 2, 4, 6]],
    [17, 'Cl', 'Cloro',         35.45,    'HL', [-1, 1, 3, 5, 7]],
    [18, 'Ar', 'Argón',         39.948,   'GN', [0]],
    [19, 'K',  'Potasio',       39.098,   'AL', [1]],
    [20, 'Ca', 'Calcio',        40.078,   'AT', [2]],
    [21, 'Sc', 'Escandio',      44.956,   'TR', [3]],
    [22, 'Ti', 'Titanio',       47.867,   'TR', [2, 3, 4]],
    [23, 'V',  'Vanadio',       50.942,   'TR', [2, 3, 4, 5]],
    [24, 'Cr', 'Cromo',         51.996,   'TR', [2, 3, 6]],
    [25, 'Mn', 'Manganeso',     54.938,   'TR', [2, 3, 4, 6, 7]],
    [26, 'Fe', 'Hierro',        55.845,   'TR', [2, 3]],
    [27, 'Co', 'Cobalto',       58.933,   'TR', [2, 3]],
    [28, 'Ni', 'Níquel',        58.693,   'TR', [2]],
    [29, 'Cu', 'Cobre',         63.546,   'TR', [1, 2]],
    [30, 'Zn', 'Zinc',          65.38,    'TR', [2]],
    [31, 'Ga', 'Galio',         69.723,   'PT', [3]],
    [32, 'Ge', 'Germanio',      72.630,   'MD', [2, 4]],
    [33, 'As', 'Arsénico',      74.922,   'MD', [-3, 3, 5]],
    [34, 'Se', 'Selenio',       78.971,   'NM', [-2, 4, 6]],
    [35, 'Br', 'Bromo',         79.904,   'HL', [-1, 1, 3, 5, 7]],
    [36, 'Kr', 'Kriptón',       83.798,   'GN', [0]],
    [37, 'Rb', 'Rubidio',       85.468,   'AL', [1]],
    [38, 'Sr', 'Estroncio',     87.62,    'AT', [2]],
    [39, 'Y',  'Itrio',         88.906,   'TR', [3]],
    [40, 'Zr', 'Circonio',      91.224,   'TR', [4]],
    [41, 'Nb', 'Niobio',        92.906,   'TR', [3, 5]],
    [42, 'Mo', 'Molibdeno',     95.95,    'TR', [4, 6]],
    [43, 'Tc', 'Tecnecio',      98,       'TR', [4, 7]],
    [44, 'Ru', 'Rutenio',       101.07,   'TR', [3, 4]],
    [45, 'Rh', 'Rodio',         102.91,   'TR', [3]],
    [46, 'Pd', 'Paladio',       106.42,   'TR', [2, 4]],
    [47, 'Ag', 'Plata',         107.868,  'TR', [1]],
    [48, 'Cd', 'Cadmio',        112.41,   'TR', [2]],
    [49, 'In', 'Indio',         114.82,   'PT', [3]],
    [50, 'Sn', 'Estaño',        118.71,   'PT', [2, 4]],
    [51, 'Sb', 'Antimonio',     121.76,   'MD', [-3, 3, 5]],
    [52, 'Te', 'Telurio',       127.60,   'MD', [-2, 4, 6]],
    [53, 'I',  'Yodo',          126.904,  'HL', [-1, 1, 3, 5, 7]],
    [54, 'Xe', 'Xenón',         131.29,   'GN', [0]],
    [55, 'Cs', 'Cesio',         132.91,   'AL', [1]],
    [56, 'Ba', 'Bario',         137.33,   'AT', [2]],
    [57, 'La', 'Lantano',       138.91,   'LN', [3]],
    [58, 'Ce', 'Cerio',         140.12,   'LN', [3, 4]],
    [59, 'Pr', 'Praseodimio',   140.91,   'LN', [3]],
    [60, 'Nd', 'Neodimio',      144.24,   'LN', [3]],
    [61, 'Pm', 'Prometio',      145,      'LN', [3]],
    [62, 'Sm', 'Samario',       150.36,   'LN', [3]],
    [63, 'Eu', 'Europio',       151.96,   'LN', [2, 3]],
    [64, 'Gd', 'Gadolinio',     157.25,   'LN', [3]],
    [65, 'Tb', 'Terbio',        158.93,   'LN', [3]],
    [66, 'Dy', 'Disprosio',     162.50,   'LN', [3]],
    [67, 'Ho', 'Holmio',        164.93,   'LN', [3]],
    [68, 'Er', 'Erbio',         167.26,   'LN', [3]],
    [69, 'Tm', 'Tulio',         168.93,   'LN', [3]],
    [70, 'Yb', 'Iterbio',       173.05,   'LN', [2, 3]],
    [71, 'Lu', 'Lutecio',       174.97,   'LN', [3]],
    [72, 'Hf', 'Hafnio',        178.49,   'TR', [4]],
    [73, 'Ta', 'Tántalo',       180.95,   'TR', [5]],
    [74, 'W',  'Wolframio',     183.84,   'TR', [6]],
    [75, 'Re', 'Renio',         186.21,   'TR', [4, 7]],
    [76, 'Os', 'Osmio',         190.23,   'TR', [4]],
    [77, 'Ir', 'Iridio',        192.22,   'TR', [3, 4]],
    [78, 'Pt', 'Platino',       195.08,   'TR', [2, 4]],
    [79, 'Au', 'Oro',           196.97,   'TR', [1, 3]],
    [80, 'Hg', 'Mercurio',      200.59,   'TR', [1, 2]],
    [81, 'Tl', 'Talio',         204.38,   'PT', [1, 3]],
    [82, 'Pb', 'Plomo',         207.2,    'PT', [2, 4]],
    [83, 'Bi', 'Bismuto',       208.98,   'PT', [3]],
    [84, 'Po', 'Polonio',       209,      'PT', [2, 4]],
    [85, 'At', 'Astato',        210,      'HL', [-1]],
    [86, 'Rn', 'Radón',         222,      'GN', [0]],
    [87, 'Fr', 'Francio',       223,      'AL', [1]],
    [88, 'Ra', 'Radio',         226,      'AT', [2]],
    [89, 'Ac', 'Actinio',       227,      'AC', [3]],
    [90, 'Th', 'Torio',         232.04,   'AC', [4]],
    [91, 'Pa', 'Protactinio',   231.04,   'AC', [5]],
    [92, 'U',  'Uranio',        238.03,   'AC', [4, 6]],
    [93, 'Np', 'Neptunio',      237,      'AC', [5]],
    [94, 'Pu', 'Plutonio',      244,      'AC', [4]],
    [95, 'Am', 'Americio',      243,      'AC', [3]],
    [96, 'Cm', 'Curio',         247,      'AC', [3]],
    [97, 'Bk', 'Berkelio',      247,      'AC', [3]],
    [98, 'Cf', 'Californio',    251,      'AC', [3]],
    [99, 'Es', 'Einstenio',     252,      'AC', [3]],
    [100, 'Fm', 'Fermio',       257,      'AC', [3]],
    [101, 'Md', 'Mendelevio',   258,      'AC', [2, 3]],
    [102, 'No', 'Nobelio',      259,      'AC', [2]],
    [103, 'Lr', 'Lawrencio',    266,      'AC', [3]],
    [104, 'Rf', 'Rutherfordio', 267,      'TR', [4]],
    [105, 'Db', 'Dubnio',       268,      'TR', [5]],
    [106, 'Sg', 'Seaborgio',    269,      'TR', [6]],
    [107, 'Bh', 'Bohrio',       270,      'TR', [7]],
    [108, 'Hs', 'Hasio',        270,      'TR', [8]],
    [109, 'Mt', 'Meitnerio',    278,      'TR', []],
    [110, 'Ds', 'Darmstatio',   281,      'TR', []],
    [111, 'Rg', 'Roentgenio',   282,      'TR', []],
    [112, 'Cn', 'Copernicio',   285,      'TR', [2]],
    [113, 'Nh', 'Nihonio',      286,      'PT', []],
    [114, 'Fl', 'Flerovio',     289,      'PT', []],
    [115, 'Mc', 'Moscovio',     290,      'PT', []],
    [116, 'Lv', 'Livermorio',   293,      'PT', []],
    [117, 'Ts', 'Teneso',       294,      'HL', []],
    [118, 'Og', 'Oganesón',     294,      'GN', []]
  ];

  /* Radiactivos: sin isótopo estable (y Th, Pa, U, que son radiactivos naturales).
     Sin masa atómica estándar: se da el número de masa del isótopo más estable. */
  var Z_RADIACTIVOS = [43, 61, 90, 91, 92].concat(rango(84, 89), rango(93, 118));
  var Z_MASA_APROX = [43, 61].concat(rango(84, 89), rango(93, 118));

  var ELEMENTOS = {};
  TABLA.forEach(function (f) {
    var estados = f[5].slice();
    var val = unicos(estados.filter(function (n) { return n !== 0; }).map(Math.abs)).sort(function (a, b) { return a - b; });
    var e = {
      simbolo: f[1], nombre: f[2], numAtomico: f[0], numeroAtomico: f[0],
      masaAtomica: f[3], clasificacion: CLASE[f[4]],
      estadosOxidacion: estados, estadosOxidacionGenerales: estados, valencias: val
    };
    if (Z_RADIACTIVOS.indexOf(f[0]) >= 0) e.radiactivo = true;
    if (Z_MASA_APROX.indexOf(f[0]) >= 0) e.masaAproximada = true;
    ELEMENTOS[f[1]] = e;
  });

  function esMetal(sim) { var e = ELEMENTOS[sim]; return !!e && CLASES_METAL.indexOf(e.clasificacion) >= 0; }

  /* =========================================================================
     2. PARSER DE FÓRMULAS Y MASA MOLAR
     ====================================================================== */
  function normalizarFormula(txt) {
    return String(txt == null ? '' : txt)
      .replace(/[\u2080-\u2089]/g, function (d) { return String(d.charCodeAt(0) - 0x2080); })
      .replace(/\s+/g, '')
      .replace(/[\[{]/g, '(').replace(/[\]}]/g, ')');
  }

  /* Una parte sin hidrato: letras, dígitos y paréntesis. */
  function parsearParte(s) {
    var pila = [{}], i = 0;
    function leerNumero() {
      var m = /^\d+/.exec(s.slice(i));
      if (!m) return 1;
      i += m[0].length;
      return parseInt(m[0], 10);
    }
    while (i < s.length) {
      var c = s.charAt(i);
      if (c === '(') { pila.push({}); i++; }
      else if (c === ')') {
        if (pila.length < 2) return { ok: false, error: 'Hay un paréntesis de cierre sin su apertura.' };
        i++;
        var mult = leerNumero();
        if (mult < 1) return { ok: false, error: 'El subíndice después de un paréntesis debe ser 1 o mayor.' };
        var grupo = pila.pop(), destino = pila[pila.length - 1];
        Object.keys(grupo).forEach(function (k) { destino[k] = (destino[k] || 0) + grupo[k] * mult; });
      } else if (/[A-Z]/.test(c)) {
        var m = /^[A-Z][a-z]?/.exec(s.slice(i)), sim = m[0];
        i += sim.length;
        var n = leerNumero();
        if (n < 1) return { ok: false, error: 'El subíndice de "' + sim + '" debe ser 1 o mayor.' };
        pila[pila.length - 1][sim] = (pila[pila.length - 1][sim] || 0) + n;
      } else {
        return { ok: false, error: 'Carácter no válido en la fórmula: "' + c + '".' };
      }
    }
    if (pila.length !== 1) return { ok: false, error: 'Falta cerrar un paréntesis.' };
    if (!Object.keys(pila[0]).length) return { ok: false, error: 'La fórmula no contiene elementos.' };
    return { ok: true, composicion: pila[0] };
  }

  /* parsearFormula('Ca(NO3)2')  → { ok: true, composicion: { Ca: 1, N: 2, O: 6 } }
     Acepta hidratos con "·", "•", "*" o "." : 'CuSO4·5H2O'.
     Los elementos desconocidos se devuelven en "desconocidos". */
  function parsearFormula(txt) {
    var s = normalizarFormula(txt);
    if (!s) return { ok: false, error: 'La fórmula está vacía.' };
    var total = {}, error = null;
    s.split(/[·•*.]/).forEach(function (parte) {
      if (error) return;
      var coef = 1, m = /^(\d+)(.+)$/.exec(parte);
      if (m) { coef = parseInt(m[1], 10); parte = m[2]; }
      var r = parsearParte(parte);
      if (!r.ok) { error = r.error; return; }
      Object.keys(r.composicion).forEach(function (k) { total[k] = (total[k] || 0) + r.composicion[k] * coef; });
    });
    if (error) return { ok: false, error: error };
    var desc = Object.keys(total).filter(function (sim) { return !ELEMENTOS[sim]; });
    if (desc.length) return { ok: false, desconocidos: desc, error: 'Elemento(s) que no existen en la tabla periódica: ' + desc.join(', ') + '.' };
    return { ok: true, composicion: total };
  }

  /* Separa la carga: 'SO4^2-' → { formula: 'SO4', carga: -2 }; 'Na+' → { 'Na', 1 }. */
  function separarCarga(txt) {
    var m = /^(.+?)(?:\^(\d+)([+-])|([+-]))$/.exec(String(txt));
    if (!m) return { formula: String(txt), carga: 0 };
    if (m[4]) return { formula: m[1], carga: m[4] === '+' ? 1 : -1 };
    return { formula: m[1], carga: (m[3] === '+' ? 1 : -1) * parseInt(m[2], 10) };
  }

  function redondear(x) { return Math.round(x * 1e4) / 1e4; }

  /* Masa molar (g/mol). Acepta una fórmula ('H2SO4', 'Li', 'Fe2(SO4)3') o una
     composición { H: 2, S: 1, O: 4 }. Devuelve null si no es válida. */
  function calcularMasaMolar(entrada) {
    var comp = entrada;
    if (typeof entrada === 'string') {
      var p = parsearFormula(separarCarga(entrada).formula);
      if (!p.ok) return null;
      comp = p.composicion;
    }
    if (!comp || typeof comp !== 'object') return null;
    var total = 0, ok = true;
    Object.keys(comp).forEach(function (sim) {
      if (!ELEMENTOS[sim]) { ok = false; return; }
      total += ELEMENTOS[sim].masaAtomica * comp[sim];
    });
    return ok ? redondear(total) : null;
  }

  /* Desglose para mostrar el cálculo paso a paso (didáctico). */
  function masaMolarDetallada(entrada) {
    var comp = typeof entrada === 'string' ? (parsearFormula(separarCarga(entrada).formula) || {}).composicion : entrada;
    if (!comp) return null;
    var filas = [], total = 0;
    Object.keys(comp).forEach(function (sim) {
      var e = ELEMENTOS[sim]; if (!e) return;
      var sub = e.masaAtomica * comp[sim];
      filas.push({ simbolo: sim, nombre: e.nombre, cantidad: comp[sim], masaAtomica: e.masaAtomica, subtotal: redondear(sub) });
      total += sub;
    });
    return { filas: filas, total: redondear(total) };
  }

  /* =========================================================================
     3. IONES
     Clave: "Na+", "Cl-", "SO4^2-", "Fe^3+" (la carga múltiple lleva "^").
     ====================================================================== */
  var IONES = {};
  var META_ANION = {};   // { sal: nombre como sal, acido: nombre del ácido o null, primero: bool }

  function registrarIon(id, nombre, ox) {
    var sc = separarCarga(id), p = parsearFormula(sc.formula);
    if (!p.ok) throw new Error('Ion mal definido: ' + id + ' (' + p.error + ')');
    var n = sumaAtomos(p.composicion), mono = n === 1;
    var oxid = ox || (mono ? (function () { var o = {}; o[Object.keys(p.composicion)[0]] = sc.carga; return o; })() : null);
    IONES[id] = {
      formula: id, nombre: nombre, carga: sc.carga,
      clasificacion: (sc.carga > 0 ? 'cation' : 'anion') + (mono ? '' : ' poliatomico'),
      composicion: p.composicion, oxidacionEnIon: oxid, base: sc.formula
    };
  }

  /* Cationes: [id, nombre, estados de oxidación (solo si es poliatómico)] */
  [
    ['H+', 'Ion hidrógeno (protón)'], ['Li+', 'Ion litio'], ['Na+', 'Ion sodio'], ['K+', 'Ion potasio'],
    ['NH4+', 'Ion amonio', { N: -3, H: 1 }], ['Ag+', 'Ion plata'], ['Cu+', 'Ion cobre(I)'],
    ['Mg^2+', 'Ion magnesio'], ['Ca^2+', 'Ion calcio'], ['Ba^2+', 'Ion bario'], ['Zn^2+', 'Ion zinc'],
    ['Mn^2+', 'Ion manganeso(II)'], ['Fe^2+', 'Ion hierro(II)'], ['Cu^2+', 'Ion cobre(II)'],
    ['Pb^2+', 'Ion plomo(II)'], ['Ni^2+', 'Ion níquel(II)'], ['Sn^2+', 'Ion estaño(II)'],
    ['Al^3+', 'Ion aluminio'], ['Fe^3+', 'Ion hierro(III)'], ['Cr^3+', 'Ion cromo(III)']
  ].forEach(function (c) { registrarIon(c[0], c[1], c[2]); });

  /* Aniones: [id, nombre del ion, nombre como sal, nombre del ácido (o null), estados, anión primero] */
  [
    ['F-',       'Ion fluoruro',      'fluoruro',      'Ácido fluorhídrico'],
    ['Cl-',      'Ion cloruro',       'cloruro',       'Ácido clorhídrico'],
    ['Br-',      'Ion bromuro',       'bromuro',       'Ácido bromhídrico'],
    ['I-',       'Ion yoduro',        'yoduro',        'Ácido yodhídrico'],
    ['S^2-',     'Ion sulfuro',       'sulfuro',       'Ácido sulfhídrico'],
    ['ClO-',     'Ion hipoclorito',   'hipoclorito',   'Ácido hipocloroso',  { Cl: 1, O: -2 }],
    ['ClO3-',    'Ion clorato',       'clorato',       'Ácido clórico',      { Cl: 5, O: -2 }],
    ['ClO4-',    'Ion perclorato',    'perclorato',    'Ácido perclórico',   { Cl: 7, O: -2 }],
    ['IO3-',     'Ion yodato',        'yodato',        'Ácido yódico',       { I: 5, O: -2 }],
    ['NO3-',     'Ion nitrato',       'nitrato',       'Ácido nítrico',      { N: 5, O: -2 }],
    ['NO2-',     'Ion nitrito',       'nitrito',       'Ácido nitroso',      { N: 3, O: -2 }],
    ['SO4^2-',   'Ion sulfato',       'sulfato',       'Ácido sulfúrico',    { S: 6, O: -2 }],
    ['SO3^2-',   'Ion sulfito',       'sulfito',       'Ácido sulfuroso',    { S: 4, O: -2 }],
    ['S2O3^2-',  'Ion tiosulfato',    'tiosulfato',    null,                 { S: 2, O: -2 }],
    ['CO3^2-',   'Ion carbonato',     'carbonato',     'Ácido carbónico',    { C: 4, O: -2 }],
    ['HCO3-',    'Ion bicarbonato',   'bicarbonato',   null,                 { H: 1, C: 4, O: -2 }],
    ['PO4^3-',   'Ion fosfato',       'fosfato',       'Ácido fosfórico',    { P: 5, O: -2 }],
    ['CH3COO-',  'Ion acetato',       'acetato',       'Ácido acético',      { C: 0, H: 1, O: -2 }, true],
    ['C2O4^2-',  'Ion oxalato',       'oxalato',       'Ácido oxálico',      { C: 3, O: -2 }],
    ['MnO4-',    'Ion permanganato',  'permanganato',  null,                 { Mn: 7, O: -2 }],
    ['CrO4^2-',  'Ion cromato',       'cromato',       null,                 { Cr: 6, O: -2 }],
    ['Cr2O7^2-', 'Ion dicromato',     'dicromato',     null,                 { Cr: 6, O: -2 }],
    ['OH-',      'Ion hidróxido',     'hidróxido',     null,                 { O: -2, H: 1 }],
    ['O^2-',     'Ion óxido',         'óxido',         null]
  ].forEach(function (a) {
    registrarIon(a[0], a[1], a[4]);
    META_ANION[a[0]] = { sal: a[2], acido: a[3], primero: !!a[5] };
  });

  /* =========================================================================
     4. COMPUESTOS
     ====================================================================== */
  var COMPUESTOS = {};
  var POR_IONES = {};   // 'Ca^2+|NO3-' → 'Ca(NO3)2'

  function nombreCation(id) {
    var n = IONES[id].nombre.replace(/^Ion /, '');
    return n;
  }
  function mayuscula(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* Texto de un ion repetido n veces: (NO3)2, Ca2, H2... */
  function grupoTexto(ion, n) {
    if (n === 1) return ion.base;
    return (sumaAtomos(ion.composicion) > 1 ? '(' + ion.base + ')' : ion.base) + n;
  }

  /* Estados de oxidación del compuesto a partir de los de sus iones.
     Si un mismo elemento aparece con estados distintos en catión y anión
     (p. ej. N en NH4NO3) se omiten: el promedio sería engañoso. */
  function oxidacionCombinada(iones) {
    var out = {};
    for (var i = 0; i < iones.length; i++) {
      var o = iones[i].oxidacionEnIon;
      if (!o) return null;
      var ks = Object.keys(o);
      for (var j = 0; j < ks.length; j++) {
        if (out[ks[j]] !== undefined && out[ks[j]] !== o[ks[j]]) return null;
        out[ks[j]] = o[ks[j]];
      }
    }
    return out;
  }

  function registrarCompuesto(formula, nombre, clasificacion, comp, ox, extra) {
    if (COMPUESTOS[formula]) throw new Error('Compuesto duplicado: ' + formula);
    var rec = { formula: formula, nombre: nombre, clasificacion: clasificacion, composicion: comp };
    if (ox) rec.oxidacionEnCompuesto = ox;
    rec.masaMolar = calcularMasaMolar(comp);
    if (extra) Object.keys(extra).forEach(function (k) { rec[k] = extra[k]; });
    COMPUESTOS[formula] = rec;
    return rec;
  }

  /* Genera un compuesto iónico (sal, base, óxido o ácido) a partir de sus iones. */
  function crearIonico(catId, anId, clasificacion, nombre) {
    var cat = IONES[catId], an = IONES[anId], meta = META_ANION[anId];
    var zc = Math.abs(cat.carga), za = Math.abs(an.carga), g = mcd(zc, za);
    var nC = za / g, nA = zc / g;
    var formula = meta.primero ? grupoTexto(an, nA) + grupoTexto(cat, nC)
                               : grupoTexto(cat, nC) + grupoTexto(an, nA);
    var p = parsearFormula(formula);
    var rec = registrarCompuesto(formula, nombre, clasificacion, p.composicion,
                                 oxidacionCombinada([cat, an]),
                                 { iones: { cation: catId, nCation: nC, anion: anId, nAnion: nA } });
    POR_IONES[catId + '|' + anId] = formula;
    return rec;
  }

  /* --- Sales: anión → cationes que se registran --- */
  var PARES_SALES = {
    'F-':       ['Na+', 'K+', 'Ca^2+', 'Mg^2+'],
    'Cl-':      ['Li+', 'Na+', 'K+', 'NH4+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Mn^2+', 'Fe^2+', 'Fe^3+',
                 'Cu^2+', 'Pb^2+', 'Ni^2+', 'Sn^2+', 'Al^3+', 'Cr^3+'],
    'Br-':      ['Li+', 'Na+', 'K+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Al^3+'],
    'I-':       ['Li+', 'Na+', 'K+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Zn^2+', 'Pb^2+', 'Al^3+'],
    'S^2-':     ['Na+', 'K+', 'NH4+', 'Ag+', 'Fe^2+', 'Zn^2+', 'Cu^2+', 'Pb^2+', 'Ni^2+'],
    'ClO-':     ['Na+', 'K+', 'Ca^2+'],
    'ClO3-':    ['Na+', 'K+'],
    'ClO4-':    ['Na+', 'K+'],
    'IO3-':     ['Na+', 'K+'],
    'NO3-':     ['Li+', 'Na+', 'K+', 'NH4+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Mn^2+', 'Fe^2+', 'Fe^3+',
                 'Cu^2+', 'Pb^2+', 'Ni^2+', 'Al^3+', 'Cr^3+'],
    'NO2-':     ['Na+', 'K+'],
    'SO4^2-':   ['Li+', 'Na+', 'K+', 'NH4+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Mn^2+', 'Fe^2+', 'Fe^3+',
                 'Cu^2+', 'Pb^2+', 'Ni^2+', 'Sn^2+', 'Al^3+', 'Cr^3+'],
    'SO3^2-':   ['Na+', 'K+', 'Ca^2+'],
    'S2O3^2-':  ['Na+', 'K+'],
    'CO3^2-':   ['Li+', 'Na+', 'K+', 'NH4+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Mn^2+', 'Fe^2+', 'Cu^2+',
                 'Pb^2+', 'Ni^2+'],
    'HCO3-':    ['Na+', 'K+', 'NH4+', 'Ca^2+', 'Mg^2+'],
    'PO4^3-':   ['Na+', 'K+', 'NH4+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Pb^2+', 'Fe^3+', 'Al^3+', 'Cr^3+'],
    'CH3COO-':  ['Na+', 'K+', 'NH4+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Cu^2+', 'Pb^2+', 'Al^3+'],
    'C2O4^2-':  ['Na+', 'K+', 'NH4+', 'Ca^2+', 'Mg^2+'],
    'MnO4-':    ['Na+', 'K+'],
    'CrO4^2-':  ['Na+', 'K+', 'Ba^2+', 'Pb^2+', 'Ag+'],
    'Cr2O7^2-': ['Na+', 'K+', 'NH4+']
  };
  var CATIONES_BASES = ['Li+', 'Na+', 'K+', 'NH4+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Mn^2+', 'Fe^2+', 'Cu^2+',
                        'Pb^2+', 'Ni^2+', 'Al^3+', 'Fe^3+', 'Cr^3+'];
  var CATIONES_OXIDOS = ['Li+', 'Na+', 'K+', 'Cu+', 'Ag+', 'Mg^2+', 'Ca^2+', 'Ba^2+', 'Zn^2+', 'Fe^2+', 'Cu^2+',
                         'Pb^2+', 'Ni^2+', 'Al^3+', 'Fe^3+', 'Cr^3+'];

  /* Ácidos: H+ + anión (los que tienen nombre de ácido). */
  Object.keys(META_ANION).forEach(function (an) {
    if (META_ANION[an].acido) crearIonico('H+', an, 'acido', META_ANION[an].acido);
  });
  CATIONES_BASES.forEach(function (c) { crearIonico(c, 'OH-', 'base', 'Hidróxido de ' + nombreCation(c)); });
  CATIONES_OXIDOS.forEach(function (c) { crearIonico(c, 'O^2-', 'oxido', 'Óxido de ' + nombreCation(c)); });
  Object.keys(PARES_SALES).forEach(function (an) {
    PARES_SALES[an].forEach(function (c) {
      crearIonico(c, an, 'sal', mayuscula(META_ANION[an].sal) + ' de ' + nombreCation(c));
    });
  });

  /* --- Sustancias moleculares y orgánicas ---------------------------------
     [fórmula, nombre, clasificación, estados de oxidación | null, extras]
     "combustible": true  → participa en la regla de combustión completa.
     Estados null: el número sería un promedio no entero (p. ej. propano);
     reacciones.js lo indica en el análisis redox. */
  var MOLECULAS = [
    ['H2',  'Hidrógeno molecular', 'elemento', { H: 0 }],
    ['O2',  'Oxígeno molecular',   'elemento', { O: 0 }],
    ['N2',  'Nitrógeno molecular', 'elemento', { N: 0 }],
    ['F2',  'Flúor molecular',     'elemento', { F: 0 }],
    ['Cl2', 'Cloro molecular',     'elemento', { Cl: 0 }],
    ['Br2', 'Bromo molecular',     'elemento', { Br: 0 }],
    ['I2',  'Yodo molecular',      'elemento', { I: 0 }],

    ['H2O',  'Agua',                  'agua',     { H: 1, O: -2 }],
    ['H2O2', 'Peróxido de hidrógeno', 'peroxido', { H: 1, O: -1 }],

    ['CO2',  'Dióxido de carbono',     'oxido', { C: 4, O: -2 }],
    ['CO',   'Monóxido de carbono',    'oxido', { C: 2, O: -2 }],
    ['SO2',  'Dióxido de azufre',      'oxido', { S: 4, O: -2 }],
    ['SO3',  'Trióxido de azufre',     'oxido', { S: 6, O: -2 }],
    ['NO',   'Monóxido de nitrógeno',  'oxido', { N: 2, O: -2 }],
    ['NO2',  'Dióxido de nitrógeno',   'oxido', { N: 4, O: -2 }],
    ['N2O',  'Óxido de dinitrógeno',   'oxido', { N: 1, O: -2 }],
    ['N2O5', 'Pentóxido de dinitrógeno', 'oxido', { N: 5, O: -2 }],
    ['P2O5', 'Pentóxido de difósforo', 'oxido', { P: 5, O: -2 }],
    ['SiO2', 'Dióxido de silicio',     'oxido', { Si: 4, O: -2 }],
    ['MnO2', 'Dióxido de manganeso',   'oxido', { Mn: 4, O: -2 }],
    ['Fe3O4', 'Óxido de hierro(II,III)', 'oxido', null],

    ['NH3',  'Amoníaco', 'base', { N: -3, H: 1 }],

    ['CH4',    'Metano',    'hidrocarburo', { C: -4, H: 1 }, { combustible: true }],
    ['C2H6',   'Etano',     'hidrocarburo', { C: -3, H: 1 }, { combustible: true }],
    ['C2H4',   'Eteno (etileno)', 'hidrocarburo', { C: -2, H: 1 }, { combustible: true }],
    ['C2H2',   'Etino (acetileno)', 'hidrocarburo', { C: -1, H: 1 }, { combustible: true }],
    ['C3H8',   'Propano',   'hidrocarburo', null, { combustible: true }],
    ['C4H10',  'Butano',    'hidrocarburo', null, { combustible: true }],
    ['C5H12',  'Pentano',   'hidrocarburo', null, { combustible: true }],
    ['C6H14',  'Hexano',    'hidrocarburo', null, { combustible: true }],
    ['C8H18',  'Octano',    'hidrocarburo', null, { combustible: true }],
    ['C6H6',   'Benceno',   'hidrocarburo', { C: -1, H: 1 }, { combustible: true }],
    ['CH3OH',  'Metanol',   'organico', { C: -2, H: 1, O: -2 }, { combustible: true }],
    ['C2H5OH', 'Etanol',    'organico', { C: -2, H: 1, O: -2 }, { combustible: true }],
    ['C6H12O6', 'Glucosa',  'organico', { C: 0, H: 1, O: -2 },  { combustible: true }],
    ['C12H22O11', 'Sacarosa', 'organico', { C: 0, H: 1, O: -2 }, { combustible: true }],
    ['HCOOH',  'Ácido fórmico', 'acido', { C: 2, H: 1, O: -2 }, { combustible: true }]
  ];
  MOLECULAS.forEach(function (m) {
    var p = parsearFormula(m[0]);
    registrarCompuesto(m[0], m[1], m[2], p.composicion, m[3], m[4]);
  });
  COMPUESTOS['CH3COOH'].combustible = true;   // el ácido acético también arde

  /* =========================================================================
     5. CONSULTAS
     ====================================================================== */
  function compuestoIonico(catId, anId) { return POR_IONES[catId + '|' + anId] || null; }

  /* Registro con la misma forma que usa reacciones.js (id, tipo, composición, carga...). */
  function registroIndice(id) {
    var e = ELEMENTOS[id], c = COMPUESTOS[id], i = IONES[id];
    if (e) { var ce = {}; ce[e.simbolo] = 1; var oe = {}; oe[e.simbolo] = 0;
      return { id: id, tipo: 'elemento', formula: e.simbolo, nombre: e.nombre, composicion: ce, carga: 0,
               clasificacion: e.clasificacion, estadosAsignados: oe }; }
    if (c) return { id: id, tipo: 'compuesto', formula: c.formula, nombre: c.nombre, composicion: c.composicion,
                    carga: 0, clasificacion: c.clasificacion, estadosAsignados: c.oxidacionEnCompuesto || null };
    if (i) return { id: id, tipo: 'ion', formula: i.formula, nombre: i.nombre, composicion: i.composicion,
                    carga: i.carga, clasificacion: i.clasificacion, estadosAsignados: i.oxidacionEnIon || null };
    return null;
  }

  /* Sustancia "al vuelo": cualquier fórmula válida que no esté en el catálogo.
     Tiene composición y masa molar (lo necesario para balancear y para la
     estequiometría), pero sin clasificación ni estados de oxidación. */
  function resolverFormula(txt) {
    var t = String(txt == null ? '' : txt).trim();
    if (!t || /[·•*.\^+\-]/.test(t)) return null;
    var p = parsearFormula(t);
    if (!p.ok) return null;
    return { id: t, tipo: 'compuesto', formula: t, nombre: 'Compuesto fuera del catálogo', composicion: p.composicion, carga: 0,
             clasificacion: 'sin clasificar', estadosAsignados: null, dinamica: true };
  }

  function buscar(texto) {
    var q = normalizar(texto), res = [];
    if (!q) return res;
    function evaluar(id, nombre) {
      var mejor = null;
      [normalizar(id), normalizar(nombre)].forEach(function (c) {
        var p = c === q ? 0 : (c.indexOf(q) === 0 ? 1 : (c.indexOf(q) > 0 ? 2 : null));
        if (p !== null && (mejor === null || p < mejor)) mejor = p;
      });
      if (mejor !== null) res.push({ id: id, nombre: nombre, p: mejor });
    }
    Object.keys(ELEMENTOS).forEach(function (k) { evaluar(k, ELEMENTOS[k].nombre); });
    Object.keys(COMPUESTOS).forEach(function (k) { evaluar(k, COMPUESTOS[k].nombre); });
    Object.keys(IONES).forEach(function (k) { evaluar(k, IONES[k].nombre); });
    res.sort(function (a, b) { return a.p - b.p; });
    return res;
  }

  /* =========================================================================
     6. SOLUBILIDAD (reglas simples de curso introductorio)
     Devuelve 'si', 'poco' o 'no'. Solo 'no' se considera precipitado.
     ====================================================================== */
  var SOLUBLES_SIEMPRE = ['Li+', 'Na+', 'K+', 'NH4+', 'H+'];
  function solubilidad(cat, an) {
    if (SOLUBLES_SIEMPRE.indexOf(cat) >= 0) return 'si';
    if (['NO3-', 'NO2-', 'ClO3-', 'ClO4-', 'HCO3-', 'MnO4-', 'ClO-'].indexOf(an) >= 0) return 'si';
    if (an === 'CH3COO-') return cat === 'Ag+' ? 'poco' : 'si';
    switch (an) {
      case 'Cl-': case 'Br-': case 'I-':
        return (cat === 'Ag+' || cat === 'Pb^2+' || cat === 'Cu+') ? 'no' : 'si';
      case 'F-':
        return ['Ca^2+', 'Mg^2+', 'Ba^2+', 'Pb^2+'].indexOf(cat) >= 0 ? 'no' : 'si';
      case 'SO4^2-':
        if (cat === 'Ba^2+' || cat === 'Pb^2+') return 'no';
        return (cat === 'Ca^2+' || cat === 'Ag+') ? 'poco' : 'si';
      case 'OH-':
        if (cat === 'Ba^2+') return 'si';
        return cat === 'Ca^2+' ? 'poco' : 'no';
      case 'CrO4^2-':
        return ['Ba^2+', 'Pb^2+', 'Ag+'].indexOf(cat) >= 0 ? 'no' : 'si';
      case 'Cr2O7^2-':
        return 'si';
      default:
        return 'no';   // S2-, CO3 2-, PO4 3-, SO3 2-, C2O4 2-, IO3-, O2-, S2O3 2-...
    }
  }

  /* =========================================================================
     7. REGLAS DE PREDICCIÓN
     Forma: { id, nombre, categoria, ejemplos, aplica(R), productos(R) → [ids] }
     R = lista de sustancias (solo se usa su .id). Se pueden agregar reglas
     sin tocar reacciones.js.
     ====================================================================== */
  var REGLAS = [];
  var COEF_CONOCIDOS = [];   // coeficientes verificados de reacciones redox fijas

  function ids(R) { return R.map(function (s) { return s.id; }); }
  function mismosIds(R, lista) {
    if (R.length !== lista.length) return false;
    return ids(R).sort().join('|') === lista.slice().sort().join('|');
  }
  function nuevaRegla(id, nombre, categoria, calc, ejemplos) {
    REGLAS.push({
      id: id, nombre: nombre, categoria: categoria, ejemplos: ejemplos || [],
      aplica: function (R) { return !!calc(R); },
      productos: function (R) { return calc(R) || []; }
    });
  }
  function reglaFija(id, nombre, categoria, rIds, pIds, coef) {
    nuevaRegla(id, nombre, categoria, function (R) { return mismosIds(R, rIds) ? pIds.slice() : null; }, [rIds]);
    if (coef) COEF_CONOCIDOS.push({ reactivos: rIds, productos: pIds, coefR: coef[0], coefP: coef[1] });
  }
  /* Para dos reactivos: devuelve {a, b} si a cumple f y b cumple g (en cualquier orden). */
  function emparejar(R, f, g) {
    if (R.length !== 2) return null;
    for (var i = 0; i < 2; i++) if (f(R[i].id) && g(R[1 - i].id)) return { a: R[i].id, b: R[1 - i].id };
    return null;
  }

  /* Predicados sobre un id del catálogo */
  function rec(id) { return COMPUESTOS[id] || null; }
  function catDe(id) { return rec(id) && rec(id).iones ? rec(id).iones.cation : null; }
  function anDe(id) { return rec(id) && rec(id).iones ? rec(id).iones.anion : null; }
  function esAcido(id) { return !!rec(id) && rec(id).clasificacion === 'acido' && catDe(id) === 'H+'; }
  function esBase(id) { return !!rec(id) && rec(id).clasificacion === 'base' && anDe(id) === 'OH-'; }
  function esOxidoMetalico(id) { return !!rec(id) && rec(id).clasificacion === 'oxido' && anDe(id) === 'O^2-'; }
  function esSal(id) { return !!rec(id) && rec(id).clasificacion === 'sal'; }
  function esIonico(id) { return !!rec(id) && !!rec(id).iones && ['sal', 'base', 'acido'].indexOf(rec(id).clasificacion) >= 0; }
  function esAgua(id) { return id === 'H2O'; }
  function esO2(id) { return id === 'O2'; }
  function esMetalLibre(id) { return !!ELEMENTOS[id] && esMetal(id); }
  function esCombustible(id) { return !!rec(id) && !!rec(id).combustible; }
  function idCation(sim, z) { return z === 1 ? sim + '+' : sim + '^' + z + '+'; }

  var ALCALINOS_Y_NH4 = ['Li+', 'Na+', 'K+', 'NH4+'];
  var CARGA_NORMAL = { Li: 1, Na: 1, K: 1, Ag: 1, Mg: 2, Ca: 2, Ba: 2, Zn: 2, Fe: 2, Ni: 2, Sn: 2, Pb: 2, Cu: 2, Al: 3 };
  var CARGA_HALOGENO = { Li: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Ba: 2, Zn: 2, Al: 3, Fe: 3, Cu: 2 };
  var SERIE = ['Li', 'K', 'Ba', 'Ca', 'Na', 'Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn', 'Pb', 'H', 'Cu', 'Ag', 'Au'];
  var ACIDOS_PARA_METAL = ['HCl', 'HBr', 'HI', 'H2SO4'];
  var METALES_ACIDO = ['Li', 'K', 'Ba', 'Ca', 'Na', 'Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn'];
  var METALES_AGUA = ['Li', 'Na', 'K', 'Ca', 'Ba'];
  var OXIDO_DE_METAL = { Li: 'Li2O', Na: 'Na2O', K: 'K2O', Mg: 'MgO', Ca: 'CaO', Ba: 'BaO', Al: 'Al2O3',
                         Zn: 'ZnO', Fe: 'Fe2O3', Cu: 'CuO', Ni: 'NiO', Pb: 'PbO' };
  var ANION_OXIDO_ACIDO = { CO2: 'CO3^2-', SO2: 'SO3^2-', SO3: 'SO4^2-', N2O5: 'NO3-', P2O5: 'PO4^3-' };
  var CATION_A_ELEMENTO = { 'Cu^2+': 'Cu', 'Ag+': 'Ag', 'Pb^2+': 'Pb', 'Zn^2+': 'Zn', 'Fe^2+': 'Fe', 'Ni^2+': 'Ni', 'Sn^2+': 'Sn' };
  var HALOGENOS = { Cl2: { anion: 'Cl-', fuerza: 3 }, Br2: { anion: 'Br-', fuerza: 2 }, I2: { anion: 'I-', fuerza: 1 } };
  var HALURO_A_X2 = { 'Cl-': 'Cl2', 'Br-': 'Br2', 'I-': 'I2' };

  /* ---- 7.1 Ácido-base ---- */
  nuevaRegla('neutralizacion', 'Neutralización (ácido + base → sal + agua)', 'neutralizacion', function (R) {
    var p = emparejar(R, esAcido, esBase); if (!p) return null;
    var s = compuestoIonico(catDe(p.b), anDe(p.a));
    return s ? [s, 'H2O'] : null;
  }, [['HCl', 'NaOH'], ['H2SO4', 'Ca(OH)2'], ['H3PO4', 'KOH'], ['HNO3', 'Al(OH)3'], ['CH3COOH', 'NaOH'], ['HCl', 'NH4OH']]);

  nuevaRegla('acido-oxido-basico', 'Ácido + óxido básico → sal + agua', 'neutralizacion', function (R) {
    var p = emparejar(R, esAcido, esOxidoMetalico); if (!p) return null;
    var s = compuestoIonico(catDe(p.b), anDe(p.a));
    return s ? [s, 'H2O'] : null;
  }, [['H2SO4', 'CuO'], ['HCl', 'Fe2O3'], ['HNO3', 'CaO'], ['HCl', 'ZnO']]);

  nuevaRegla('amoniaco-acido', 'Amoníaco + ácido → sal de amonio', 'neutralizacion', function (R) {
    var p = emparejar(R, function (x) { return x === 'NH3'; }, esAcido); if (!p) return null;
    var s = compuestoIonico('NH4+', anDe(p.b));
    return s ? [s] : null;
  }, [['NH3', 'HCl'], ['NH3', 'H2SO4'], ['NH3', 'HNO3']]);

  nuevaRegla('oxido-basico-agua', 'Óxido básico + agua → hidróxido', 'sintesis', function (R) {
    var p = emparejar(R, esOxidoMetalico, esAgua); if (!p) return null;
    var c = catDe(p.a);
    if (['Li+', 'Na+', 'K+', 'Ca^2+', 'Ba^2+'].indexOf(c) < 0) return null;
    var h = compuestoIonico(c, 'OH-');
    return h ? [h] : null;
  }, [['CaO', 'H2O'], ['Na2O', 'H2O'], ['K2O', 'H2O'], ['BaO', 'H2O']]);

  nuevaRegla('oxido-acido-base', 'Óxido ácido + base → sal + agua', 'neutralizacion', function (R) {
    var p = emparejar(R, function (x) { return !!ANION_OXIDO_ACIDO[x]; }, esBase); if (!p) return null;
    var s = compuestoIonico(catDe(p.b), ANION_OXIDO_ACIDO[p.a]);
    return s ? [s, 'H2O'] : null;
  }, [['CO2', 'Ca(OH)2'], ['CO2', 'NaOH'], ['SO2', 'NaOH'], ['SO3', 'KOH'], ['P2O5', 'NaOH']]);

  nuevaRegla('oxido-basico-acido', 'Óxido básico + óxido ácido → sal', 'sintesis', function (R) {
    var p = emparejar(R, esOxidoMetalico, function (x) { return !!ANION_OXIDO_ACIDO[x]; }); if (!p) return null;
    var s = compuestoIonico(catDe(p.a), ANION_OXIDO_ACIDO[p.b]);
    return s ? [s] : null;
  }, [['CaO', 'CO2'], ['Na2O', 'SO3'], ['MgO', 'CO2']]);

  /* ---- 7.2 Óxidos ácidos + agua, síntesis y combustiones sencillas ---- */
  reglaFija('agua-co2',  'Dióxido de carbono + agua → ácido carbónico', 'sintesis', ['CO2', 'H2O'], ['H2CO3']);
  reglaFija('agua-so2',  'Dióxido de azufre + agua → ácido sulfuroso', 'sintesis', ['SO2', 'H2O'], ['H2SO3']);
  reglaFija('agua-so3',  'Trióxido de azufre + agua → ácido sulfúrico', 'sintesis', ['SO3', 'H2O'], ['H2SO4']);
  reglaFija('agua-n2o5', 'Pentóxido de dinitrógeno + agua → ácido nítrico', 'sintesis', ['N2O5', 'H2O'], ['HNO3']);
  reglaFija('agua-p2o5', 'Pentóxido de difósforo + agua → ácido fosfórico', 'sintesis', ['P2O5', 'H2O'], ['H3PO4']);

  reglaFija('sintesis-agua', 'Síntesis del agua', 'sintesis', ['H2', 'O2'], ['H2O']);
  reglaFija('sintesis-hf',  'Síntesis del fluoruro de hidrógeno', 'sintesis', ['H2', 'F2'], ['HF']);
  reglaFija('sintesis-hcl', 'Síntesis del cloruro de hidrógeno', 'sintesis', ['H2', 'Cl2'], ['HCl']);
  reglaFija('sintesis-hbr', 'Síntesis del bromuro de hidrógeno', 'sintesis', ['H2', 'Br2'], ['HBr']);
  reglaFija('sintesis-hi',  'Síntesis del yoduro de hidrógeno', 'sintesis', ['H2', 'I2'], ['HI']);
  reglaFija('sintesis-amoniaco', 'Síntesis del amoníaco (Haber-Bosch)', 'sintesis', ['N2', 'H2'], ['NH3']);
  reglaFija('combustion-carbono', 'Combustión del carbono', 'combustion', ['C', 'O2'], ['CO2']);
  reglaFija('combustion-azufre', 'Combustión del azufre', 'combustion', ['S', 'O2'], ['SO2']);
  reglaFija('combustion-fosforo', 'Combustión del fósforo', 'combustion', ['P', 'O2'], ['P2O5']);
  reglaFija('oxidacion-co', 'Oxidación del monóxido de carbono', 'combustion', ['CO', 'O2'], ['CO2']);
  reglaFija('oxidacion-so2', 'Oxidación del dióxido de azufre', 'sintesis', ['SO2', 'O2'], ['SO3']);
  reglaFija('oxidacion-no', 'Oxidación del monóxido de nitrógeno', 'sintesis', ['NO', 'O2'], ['NO2']);
  reglaFija('combustion-h2s', 'Combustión del sulfuro de hidrógeno', 'combustion', ['H2S', 'O2'], ['SO2', 'H2O']);

  nuevaRegla('combustion-organica', 'Combustión completa (orgánicos y oxígeno → CO₂ + H₂O)', 'combustion', function (R) {
    var p = emparejar(R, esO2, esCombustible);
    return p ? ['CO2', 'H2O'] : null;
  }, [['CH4', 'O2'], ['C3H8', 'O2'], ['C2H5OH', 'O2'], ['C6H12O6', 'O2'], ['C8H18', 'O2'], ['C6H6', 'O2']]);

  /* ---- 7.3 Metales ---- */
  nuevaRegla('metal-oxigeno', 'Metal + oxígeno → óxido metálico', 'sintesis', function (R) {
    var p = emparejar(R, esMetalLibre, esO2); if (!p) return null;
    var ox = OXIDO_DE_METAL[p.a];
    return ox && COMPUESTOS[ox] ? [ox] : null;
  }, [['Mg', 'O2'], ['Fe', 'O2'], ['Al', 'O2'], ['Zn', 'O2'], ['Cu', 'O2'], ['Li', 'O2'], ['Ca', 'O2']]);

  nuevaRegla('metal-halogeno', 'Metal + halógeno → haluro metálico', 'sintesis', function (R) {
    var p = emparejar(R, esMetalLibre, function (x) { return !!HALOGENOS[x]; }); if (!p) return null;
    var z = CARGA_HALOGENO[p.a]; if (!z) return null;
    var s = compuestoIonico(idCation(p.a, z), HALOGENOS[p.b].anion);
    return s ? [s] : null;
  }, [['Na', 'Cl2'], ['Fe', 'Cl2'], ['Al', 'Cl2'], ['Cu', 'Cl2'], ['Mg', 'Br2']]);

  nuevaRegla('metal-agua', 'Metal activo + agua → hidróxido + hidrógeno', 'desplazamiento', function (R) {
    var p = emparejar(R, function (x) { return METALES_AGUA.indexOf(x) >= 0; }, esAgua); if (!p) return null;
    var h = compuestoIonico(idCation(p.a, CARGA_NORMAL[p.a]), 'OH-');
    return h ? [h, 'H2'] : null;
  }, [['Na', 'H2O'], ['Li', 'H2O'], ['K', 'H2O'], ['Ca', 'H2O']]);

  nuevaRegla('metal-acido', 'Metal + ácido → sal + hidrógeno', 'desplazamiento', function (R) {
    var p = emparejar(R, function (x) { return METALES_ACIDO.indexOf(x) >= 0; },
                      function (x) { return ACIDOS_PARA_METAL.indexOf(x) >= 0; }); if (!p) return null;
    var s = compuestoIonico(idCation(p.a, CARGA_NORMAL[p.a]), anDe(p.b));
    return s ? [s, 'H2'] : null;
  }, [['Zn', 'HCl'], ['Fe', 'H2SO4'], ['Mg', 'HCl'], ['Al', 'HCl'], ['Na', 'HCl'], ['Ca', 'HBr']]);

  nuevaRegla('metal-sal', 'Metal + sal de un metal menos activo (desplazamiento)', 'desplazamiento', function (R) {
    var p = emparejar(R, function (x) { return ['Mg', 'Al', 'Zn', 'Fe', 'Ni', 'Sn', 'Pb', 'Cu'].indexOf(x) >= 0; },
                      function (x) { return esSal(x) && !!CATION_A_ELEMENTO[catDe(x)]; });
    if (!p) return null;
    var n = CATION_A_ELEMENTO[catDe(p.b)];
    if (SERIE.indexOf(p.a) >= SERIE.indexOf(n)) return null;
    if (solubilidad(catDe(p.b), anDe(p.b)) === 'no') return null;   // el desplazamiento ocurre en disolución
    var nuevaSal = compuestoIonico(idCation(p.a, CARGA_NORMAL[p.a]), anDe(p.b));
    return nuevaSal ? [nuevaSal, n] : null;
  }, [['Zn', 'CuSO4'], ['Fe', 'CuSO4'], ['Cu', 'AgNO3'], ['Zn', 'AgNO3'], ['Mg', 'ZnSO4'], ['Al', 'CuSO4']]);

  nuevaRegla('halogeno-haluro', 'Halógeno + haluro (el más reactivo desplaza al menos reactivo)', 'desplazamiento', function (R) {
    var p = emparejar(R, function (x) { return !!HALOGENOS[x]; },
                      function (x) { return esSal(x) && !!HALURO_A_X2[anDe(x)] && ['Ag+', 'Pb^2+', 'Cu+'].indexOf(catDe(x)) < 0; });
    if (!p) return null;
    var yAnion = anDe(p.b);
    if (HALOGENOS[p.a].fuerza <= HALOGENOS[HALURO_A_X2[yAnion]].fuerza) return null;
    var s = compuestoIonico(catDe(p.b), HALOGENOS[p.a].anion);
    return s ? [s, HALURO_A_X2[yAnion]] : null;
  }, [['Cl2', 'KI'], ['Cl2', 'NaBr'], ['Br2', 'KI'], ['Cl2', 'NaI']]);

  /* ---- 7.4 Carbonatos, descomposiciones ---- */
  nuevaRegla('carbonato-acido', 'Carbonato + ácido → sal + agua + CO₂', 'doble-desplazamiento', function (R) {
    var p = emparejar(R, function (x) { return esSal(x) && (anDe(x) === 'CO3^2-' || anDe(x) === 'HCO3-'); },
                      function (x) { return ['HCl', 'HBr', 'HI', 'HNO3', 'H2SO4', 'CH3COOH'].indexOf(x) >= 0; });
    if (!p) return null;
    var s = compuestoIonico(catDe(p.a), anDe(p.b));
    return s ? [s, 'H2O', 'CO2'] : null;
  }, [['CaCO3', 'HCl'], ['Na2CO3', 'H2SO4'], ['NaHCO3', 'HCl'], ['CaCO3', 'CH3COOH'], ['K2CO3', 'HNO3']]);

  nuevaRegla('descomposicion-carbonato', 'Descomposición térmica de un carbonato', 'descomposicion', function (R) {
    if (R.length !== 1 || !esSal(R[0].id) || anDe(R[0].id) !== 'CO3^2-') return null;
    var c = catDe(R[0].id);
    if (ALCALINOS_Y_NH4.indexOf(c) >= 0) return null;
    var ox = compuestoIonico(c, 'O^2-');
    return ox ? [ox, 'CO2'] : null;
  }, [['CaCO3'], ['MgCO3'], ['ZnCO3'], ['CuCO3']]);

  nuevaRegla('descomposicion-hidroxido', 'Descomposición térmica de un hidróxido metálico', 'descomposicion', function (R) {
    if (R.length !== 1 || anDe(R[0].id) !== 'OH-') return null;
    var c = catDe(R[0].id);
    if (ALCALINOS_Y_NH4.concat(['Ba^2+']).indexOf(c) >= 0) return null;
    var ox = compuestoIonico(c, 'O^2-');
    return ox ? [ox, 'H2O'] : null;
  }, [['Ca(OH)2'], ['Cu(OH)2'], ['Fe(OH)3'], ['Al(OH)3'], ['Zn(OH)2']]);

  nuevaRegla('descomposicion-bicarbonato', 'Descomposición térmica de un bicarbonato', 'descomposicion', function (R) {
    if (R.length !== 1 || !esSal(R[0].id) || anDe(R[0].id) !== 'HCO3-') return null;
    var carb = compuestoIonico(catDe(R[0].id), 'CO3^2-');
    return carb ? [carb, 'H2O', 'CO2'] : null;
  }, [['NaHCO3'], ['KHCO3'], ['Ca(HCO3)2']]);

  nuevaRegla('descomposicion-clorato', 'Descomposición térmica de un clorato', 'descomposicion', function (R) {
    if (R.length !== 1 || !esSal(R[0].id) || anDe(R[0].id) !== 'ClO3-') return null;
    var cl = compuestoIonico(catDe(R[0].id), 'Cl-');
    return cl ? [cl, 'O2'] : null;
  }, [['KClO3'], ['NaClO3']]);

  reglaFija('descomposicion-peroxido', 'Descomposición del peróxido de hidrógeno', 'descomposicion', ['H2O2'], ['H2O', 'O2']);
  reglaFija('electrolisis-agua', 'Electrólisis del agua', 'descomposicion', ['H2O'], ['H2', 'O2']);
  reglaFija('descomposicion-h2co3', 'Descomposición del ácido carbónico', 'descomposicion', ['H2CO3'], ['H2O', 'CO2']);
  reglaFija('descomposicion-h2so3', 'Descomposición del ácido sulfuroso', 'descomposicion', ['H2SO3'], ['H2O', 'SO2']);

  /* ---- 7.5 Doble desplazamiento con precipitado ---- */
  nuevaRegla('precipitacion', 'Doble desplazamiento con precipitado', 'doble-desplazamiento', function (R) {
    if (R.length !== 2) return null;
    var a = R[0].id, b = R[1].id;
    if (!esIonico(a) || !esIonico(b)) return null;
    if ((esAcido(a) && esBase(b)) || (esBase(a) && esAcido(b))) return null;   // eso es neutralización
    var ca = catDe(a), aa = anDe(a), cb = catDe(b), ab = anDe(b);
    if (ca === cb || aa === ab) return null;
    var p1 = compuestoIonico(ca, ab), p2 = compuestoIonico(cb, aa);
    if (!p1 || !p2) return null;
    if (solubilidad(ca, aa) === 'no' || solubilidad(cb, ab) === 'no') return null;       // reactivos disueltos
    if (solubilidad(ca, ab) !== 'no' && solubilidad(cb, aa) !== 'no') return null;       // sin precipitado
    /* Con un ácido de por medio, el ácido que se forma podría redisolver el precipitado:
       solo se admiten ácidos fuertes con precipitados de haluros o sulfatos, y H2S con
       sulfuros que no se disuelven en ácido (CuS, PbS, Ag2S). */
    if (esAcido(a) || esAcido(b)) {
      var acido = esAcido(a) ? a : b, sal = esAcido(a) ? b : a;
      var fuerte = ['HCl', 'HBr', 'HI', 'HNO3', 'H2SO4', 'HClO4'].indexOf(acido) >= 0;
      var sulfuroEstable = acido === 'H2S' && ['Cu^2+', 'Pb^2+', 'Ag+'].indexOf(catDe(sal)) >= 0;
      var tipoOk = ['Cl-', 'Br-', 'I-', 'SO4^2-'].indexOf(anDe(acido)) >= 0;
      if (!(sulfuroEstable || (fuerte && tipoOk))) return null;
    }
    return [p1, p2];
  }, [['AgNO3', 'NaCl'], ['BaCl2', 'Na2SO4'], ['Pb(NO3)2', 'KI'], ['CuSO4', 'NaOH'], ['FeCl3', 'NaOH'],
      ['CaCl2', 'Na2CO3'], ['AgNO3', 'HCl'], ['CuSO4', 'Na2S'], ['K2CrO4', 'BaCl2'], ['Al2(SO4)3', 'NaOH'],
      ['H2SO4', 'BaCl2'], ['H2S', 'CuSO4']]);

  /* ---- 7.6 Redox con reacción conocida (se guardan los coeficientes verificados) ----
     [id, nombre, reactivos, productos, [coef. reactivos, coef. productos]] */
  var REDOX_FIJAS = [
    ['permanganato-yoduro-acido', 'Permanganato + yoduro en medio ácido',
      ['KMnO4', 'KI', 'H2SO4'], ['MnSO4', 'I2', 'K2SO4', 'H2O'], [[2, 10, 8], [2, 5, 6, 8]]],
    ['permanganato-hierro-acido', 'Permanganato + hierro(II) en medio ácido',
      ['KMnO4', 'FeSO4', 'H2SO4'], ['MnSO4', 'Fe2(SO4)3', 'K2SO4', 'H2O'], [[2, 10, 8], [2, 5, 1, 8]]],
    ['permanganato-peroxido-acido', 'Permanganato + peróxido de hidrógeno en medio ácido',
      ['KMnO4', 'H2O2', 'H2SO4'], ['MnSO4', 'O2', 'K2SO4', 'H2O'], [[2, 5, 3], [2, 5, 1, 8]]],
    ['permanganato-sulfito-acido', 'Permanganato + sulfito en medio ácido',
      ['KMnO4', 'Na2SO3', 'H2SO4'], ['MnSO4', 'Na2SO4', 'K2SO4', 'H2O'], [[2, 5, 3], [2, 5, 1, 3]]],
    ['permanganato-oxalico-acido', 'Permanganato + ácido oxálico en medio ácido',
      ['KMnO4', 'H2C2O4', 'H2SO4'], ['MnSO4', 'CO2', 'K2SO4', 'H2O'], [[2, 5, 3], [2, 10, 1, 8]]],
    ['permanganato-so2', 'Permanganato + dióxido de azufre',
      ['KMnO4', 'SO2', 'H2O'], ['MnSO4', 'K2SO4', 'H2SO4'], [[2, 5, 2], [2, 1, 2]]],
    ['permanganato-hcl', 'Permanganato + ácido clorhídrico',
      ['KMnO4', 'HCl'], ['KCl', 'MnCl2', 'Cl2', 'H2O'], [[2, 16], [2, 2, 5, 8]]],
    ['permanganato-yoduro-neutro', 'Permanganato + yoduro en medio neutro o básico',
      ['KMnO4', 'KI', 'H2O'], ['MnO2', 'KIO3', 'KOH'], [[2, 1, 1], [2, 1, 2]]],
    ['dicromato-yoduro-acido', 'Dicromato + yoduro en medio ácido',
      ['K2Cr2O7', 'KI', 'H2SO4'], ['Cr2(SO4)3', 'I2', 'K2SO4', 'H2O'], [[1, 6, 7], [1, 3, 4, 7]]],
    ['dicromato-hierro-acido', 'Dicromato + hierro(II) en medio ácido',
      ['K2Cr2O7', 'FeSO4', 'H2SO4'], ['Cr2(SO4)3', 'Fe2(SO4)3', 'K2SO4', 'H2O'], [[1, 6, 7], [1, 3, 1, 7]]],
    ['dicromato-hcl', 'Dicromato + ácido clorhídrico',
      ['K2Cr2O7', 'HCl'], ['KCl', 'CrCl3', 'Cl2', 'H2O'], [[1, 14], [2, 2, 3, 7]]],
    ['dicromato-h2s-acido', 'Dicromato + sulfuro de hidrógeno en medio ácido',
      ['K2Cr2O7', 'H2S', 'H2SO4'], ['Cr2(SO4)3', 'S', 'K2SO4', 'H2O'], [[1, 3, 4], [1, 3, 1, 7]]],
    ['peroxido-yoduro-acido', 'Peróxido de hidrógeno + yoduro en medio ácido',
      ['H2O2', 'KI', 'H2SO4'], ['I2', 'K2SO4', 'H2O'], [[1, 2, 1], [1, 1, 2]]],
    ['dioxido-manganeso-hcl', 'Dióxido de manganeso + ácido clorhídrico',
      ['MnO2', 'HCl'], ['MnCl2', 'Cl2', 'H2O'], [[1, 4], [1, 1, 2]]],
    ['reduccion-hierro-co', 'Reducción del óxido de hierro(III) con monóxido de carbono',
      ['Fe2O3', 'CO'], ['Fe', 'CO2'], [[1, 3], [2, 3]]],
    ['reaccion-termita', 'Reacción de la termita (aluminio + óxido de hierro(III))',
      ['Fe2O3', 'Al'], ['Al2O3', 'Fe'], [[1, 2], [1, 2]]],
    ['reduccion-hierro-h2', 'Reducción del óxido de hierro(III) con hidrógeno',
      ['Fe2O3', 'H2'], ['Fe', 'H2O'], [[1, 3], [2, 3]]],
    ['reduccion-cobre-h2', 'Reducción del óxido de cobre(II) con hidrógeno',
      ['CuO', 'H2'], ['Cu', 'H2O'], [[1, 1], [1, 1]]],
    ['reduccion-cobre-co', 'Reducción del óxido de cobre(II) con monóxido de carbono',
      ['CuO', 'CO'], ['Cu', 'CO2'], [[1, 1], [1, 1]]]
  ];
  REDOX_FIJAS.forEach(function (f) { reglaFija(f[0], f[1], 'redox', f[2], f[3], f[4]); });

  /* =========================================================================
     8. PREDICCIÓN Y BALANCEO (utilidades independientes de la interfaz)
     ====================================================================== */
  var MAX_PRODUCTOS = 5;

  function predecir(listaIds) {
    var R = listaIds.map(registroIndice);
    if (R.some(function (s) { return !s; })) return { estado: 'error', productos: [], mensaje: 'Alguna sustancia no está en el catálogo.' };
    var aplicables = REGLAS.filter(function (r) { try { return r.aplica(R); } catch (e) { return false; } });
    if (!aplicables.length) return { estado: 'no-reconocida', productos: [], mensaje: 'No hay una regla para estos reactivos.' };
    var conj = {};
    aplicables.forEach(function (r) {
      var p = r.productos(R);
      conj[p.slice().sort().join('|')] = { regla: r, ids: p };
    });
    var claves = Object.keys(conj);
    if (claves.length > 1) return { estado: 'ambigua', productos: [], mensaje: 'Varias reglas aplican con resultados distintos.',
                                    reglas: claves.map(function (k) { return conj[k].regla.id; }) };
    var u = conj[claves[0]];
    if (u.ids.some(function (id) { return !registroIndice(id); })) return { estado: 'error', productos: [], mensaje: 'La regla usa sustancias fuera del catálogo.' };
    if (u.ids.length > MAX_PRODUCTOS) return { estado: 'error', productos: [], mensaje: 'La regla produce demasiados productos.' };
    return { estado: 'propuesta', productos: u.ids, regla: u.regla.nombre, reglaId: u.regla.id, categoria: u.regla.categoria };
  }

  /* Balanceo por conservación de átomos (y de carga) con fracciones exactas.
     Devuelve { estado: 'ok', coefReactivos, coefProductos } o
     { estado: 'imposible' | 'ambigua', libres }. */
  function balancear(rIds, pIds) {
    var esp = rIds.concat(pIds).map(registroIndice);
    if (esp.some(function (s) { return !s; })) return { estado: 'error' };
    var nR = rIds.length, n = esp.length, els = [];
    esp.forEach(function (s) { Object.keys(s.composicion).forEach(function (e) { if (els.indexOf(e) < 0) els.push(e); }); });
    function fr(a, b) { if (b === undefined) b = 1; if (b < 0) { a = -a; b = -b; } var g = mcd(a, b) || 1; return [a / g, b / g]; }
    function suma(x, y) { return fr(x[0] * y[1] + y[0] * x[1], x[1] * y[1]); }
    function mul(x, y) { return fr(x[0] * y[0], x[1] * y[1]); }
    function div(x, y) { return fr(x[0] * y[1], x[1] * y[0]); }
    var filas = els.map(function (e) {
      return esp.map(function (s, j) { return fr((s.composicion[e] || 0) * (j < nR ? 1 : -1)); });
    });
    if (esp.some(function (s) { return s.carga; })) filas.push(esp.map(function (s, j) { return fr((s.carga || 0) * (j < nR ? 1 : -1)); }));
    var piv = [], f = 0;
    for (var c = 0; c < n && f < filas.length; c++) {
      var p = -1;
      for (var r = f; r < filas.length; r++) if (filas[r][c][0] !== 0) { p = r; break; }
      if (p < 0) continue;
      var tmp = filas[f]; filas[f] = filas[p]; filas[p] = tmp;
      var pv = filas[f][c];
      filas[f] = filas[f].map(function (x) { return div(x, pv); });
      for (var r2 = 0; r2 < filas.length; r2++) {
        if (r2 !== f && filas[r2][c][0] !== 0) {
          var k = fr(-filas[r2][c][0], filas[r2][c][1]), base = filas[f];
          filas[r2] = filas[r2].map(function (x, j) { return suma(x, mul(k, base[j])); });
        }
      }
      piv.push(c); f++;
    }
    var libres = [];
    for (var i = 0; i < n; i++) if (piv.indexOf(i) < 0) libres.push(i);
    if (libres.length === 0) return { estado: 'imposible', libres: 0 };
    if (libres.length > 1) return { estado: 'ambigua', libres: libres.length };
    var x = []; for (var q = 0; q < n; q++) x.push(fr(0));
    x[libres[0]] = fr(1);
    piv.forEach(function (cp, idx) { x[cp] = mul(fr(-1), filas[idx][libres[0]]); });
    var den = 1; x.forEach(function (v) { den = den * v[1] / mcd(den, v[1]); });
    var enteros = x.map(function (v) { return v[0] * (den / v[1]); });
    var g = enteros.reduce(function (a, v) { return mcd(a, v); }, 0) || 1;
    enteros = enteros.map(function (v) { return v / g; });
    if (enteros.every(function (v) { return v <= 0; })) enteros = enteros.map(function (v) { return -v; });
    if (enteros.some(function (v) { return v <= 0; })) return { estado: 'imposible', libres: 1 };
    return { estado: 'ok', coefReactivos: enteros.slice(0, nR), coefProductos: enteros.slice(nR) };
  }

  /* Para reacciones.js: cuando el balanceo solo con átomos tiene más de una
     solución, devuelve los coeficientes verificados de la reacción conocida
     (alineados con el orden recibido), o null. */
  function resolverAmbiguedad(reactivos, productos) {
    var rI = ids(reactivos), pI = ids(productos);
    for (var i = 0; i < COEF_CONOCIDOS.length; i++) {
      var k = COEF_CONOCIDOS[i];
      if (mismosIds(reactivos, k.reactivos) && mismosIds(productos, k.productos)) {
        return {
          coeficientesReactivos: rI.map(function (id) { return k.coefR[k.reactivos.indexOf(id)]; }),
          coeficientesProductos: pI.map(function (id) { return k.coefP[k.productos.indexOf(id)]; })
        };
      }
    }
    return null;
  }

  /* =========================================================================
     9. VALIDACIÓN  — CATALOGO.validar() devuelve [] si todo es consistente
     ====================================================================== */
  function validar() {
    var p = [];
    var zs = Object.keys(ELEMENTOS).map(function (k) { return ELEMENTOS[k].numAtomico; }).sort(function (a, b) { return a - b; });
    if (zs.length !== 118 || zs[0] !== 1 || zs[117] !== 118) p.push('La tabla periódica debe tener los 118 elementos.');
    Object.keys(ELEMENTOS).forEach(function (k) {
      var e = ELEMENTOS[k];
      if (!(e.masaAtomica > 0)) p.push('Elemento ' + k + ': masa atómica inválida.');
      if (!e.nombre || !e.clasificacion) p.push('Elemento ' + k + ': faltan datos.');
    });
    function revisarOx(id, comp, ox, carga) {
      if (!ox) return;
      var elems = Object.keys(comp), suma = 0;
      elems.forEach(function (e) {
        if (ox[e] === undefined) p.push(id + ': falta el estado de oxidación de ' + e + '.');
        else suma += ox[e] * comp[e];
      });
      Object.keys(ox).forEach(function (e) { if (comp[e] === undefined) p.push(id + ': estado de oxidación de ' + e + ' sin ese elemento.'); });
      if (suma !== carga) p.push(id + ': los estados de oxidación suman ' + suma + ' y la carga es ' + carga + '.');
    }
    var nombres = {};
    function nombreUnico(id, nombre) {
      var n = normalizar(nombre);
      if (nombres[n]) p.push('Nombre repetido: "' + nombre + '" (' + id + ' y ' + nombres[n] + ').');
      nombres[n] = id;
    }
    Object.keys(ELEMENTOS).forEach(function (k) { nombreUnico(k, ELEMENTOS[k].nombre); });
    Object.keys(COMPUESTOS).forEach(function (k) {
      var c = COMPUESTOS[k], pf = parsearFormula(k);
      if (!pf.ok) { p.push(k + ': la fórmula no se puede leer.'); return; }
      if (JSON.stringify(Object.keys(pf.composicion).sort().map(function (e) { return e + pf.composicion[e]; })) !==
          JSON.stringify(Object.keys(c.composicion).sort().map(function (e) { return e + c.composicion[e]; }))) {
        p.push(k + ': la composición no coincide con la fórmula.');
      }
      revisarOx(k, c.composicion, c.oxidacionEnCompuesto, 0);
      if (c.iones) {
        var ci = IONES[c.iones.cation], ai = IONES[c.iones.anion], tot = {};
        [[ci, c.iones.nCation], [ai, c.iones.nAnion]].forEach(function (t) {
          Object.keys(t[0].composicion).forEach(function (e) { tot[e] = (tot[e] || 0) + t[0].composicion[e] * t[1]; });
        });
        if (JSON.stringify(Object.keys(tot).sort().map(function (e) { return e + tot[e]; })) !==
            JSON.stringify(Object.keys(c.composicion).sort().map(function (e) { return e + c.composicion[e]; }))) p.push(k + ': no coincide con la suma de sus iones.');
        if (ci.carga * c.iones.nCation + ai.carga * c.iones.nAnion !== 0) p.push(k + ': las cargas de los iones no se anulan.');
      }
      nombreUnico(k, c.nombre);
    });
    Object.keys(IONES).forEach(function (k) {
      var i = IONES[k];
      revisarOx(k, i.composicion, i.oxidacionEnIon, i.carga);
      nombreUnico(k, i.nombre);
    });
    REGLAS.forEach(function (r) {
      if (!r.ejemplos.length) p.push('Regla ' + r.id + ': no tiene ejemplos.');
      r.ejemplos.forEach(function (ej) {
        var res = predecir(ej);
        if (res.estado !== 'propuesta' || res.reglaId !== r.id) { p.push('Regla ' + r.id + ' con [' + ej.join(', ') + ']: ' + res.estado + (res.reglaId ? ' (' + res.reglaId + ')' : '')); return; }
        var b = balancear(ej, res.productos), conocidos = null, cR, cP;
        if (b.estado === 'ok') { cR = b.coefReactivos; cP = b.coefProductos; }
        else if (b.estado === 'ambigua') {
          conocidos = resolverAmbiguedad(ej.map(registroIndice), res.productos.map(registroIndice));
          if (!conocidos) { p.push('Regla ' + r.id + ': balanceo ambiguo y sin coeficientes conocidos.'); return; }
          cR = conocidos.coeficientesReactivos; cP = conocidos.coeficientesProductos;
        } else { p.push('Regla ' + r.id + ' con [' + ej.join(', ') + ']: no se puede balancear (' + b.estado + ').'); return; }
        var at = {};
        ej.forEach(function (id, i) { var c = registroIndice(id).composicion; Object.keys(c).forEach(function (e) { at[e] = (at[e] || 0) + c[e] * cR[i]; }); });
        res.productos.forEach(function (id, i) { var c = registroIndice(id).composicion; Object.keys(c).forEach(function (e) { at[e] = (at[e] || 0) - c[e] * cP[i]; }); });
        Object.keys(at).forEach(function (e) { if (at[e] !== 0) p.push('Regla ' + r.id + ': no conserva ' + e + '.'); });
      });
    });
    return p;
  }

  /* =========================================================================
     9b. BANCO DE REACCIONES  (442 reacciones, para la búsqueda en cadena)
     Datos puros: no usan ni modifican ninguna función de arriba.
     - reactivos / productos: fórmulas limpias (sin flechas, ↓ ni (g)/(aq)/(l)).
       Iones en el estilo del catálogo: Fe^2+, MnO4-, H+.
     - coeficientesR / coeficientesP: coeficientes de la ecuación balanceada,
       en el mismo orden que reactivos / productos (1 si no tenía número).
     - productos vacío ([]) = "no hay reacción neta".
     - Polimerizaciones (n monómero → polímero): coeficiente 1 y fórmula del
       polímero con "n"; esas fórmulas no las interpreta parsearFormula.
     ====================================================================== */
  var BANCO_REACCIONES = [
    /* ---- Síntesis y combinación ---- */
    { id: 1, categoria: "Síntesis y combinación", titulo: "Magnesio + oxígeno", reactivos: ["Mg", "O2"], productos: ["MgO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Combustión del magnesio; forma un óxido básico." },
    { id: 2, categoria: "Síntesis y combinación", titulo: "Calcio + oxígeno", reactivos: ["Ca", "O2"], productos: ["CaO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Formación de óxido de calcio." },
    { id: 3, categoria: "Síntesis y combinación", titulo: "Sodio + cloro", reactivos: ["Na", "Cl2"], productos: ["NaCl"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Reacción vigorosa; ejemplo teórico de combinación." },
    { id: 4, categoria: "Síntesis y combinación", titulo: "Hidrógeno + oxígeno", reactivos: ["H2", "O2"], productos: ["H2O"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Formación de agua; requiere ignición." },
    { id: 5, categoria: "Síntesis y combinación", titulo: "Nitrógeno + hidrógeno", reactivos: ["N2", "H2"], productos: ["NH3"], coeficientesR: [1, 3], coeficientesP: [2], nota: "Proceso Haber; alta presión, catalizador y temperatura adecuada." },
    { id: 6, categoria: "Síntesis y combinación", titulo: "Azufre + oxígeno", reactivos: ["S", "O2"], productos: ["SO2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Combustión del azufre." },
    { id: 7, categoria: "Síntesis y combinación", titulo: "Carbono + oxígeno suficiente", reactivos: ["C", "O2"], productos: ["CO2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Combustión completa del carbono." },
    { id: 8, categoria: "Síntesis y combinación", titulo: "Hierro + azufre", reactivos: ["Fe", "S"], productos: ["FeS"], coeficientesR: [1, 1], coeficientesP: [1], nota: "La mezcla debe calentarse para iniciar la reacción." },
    { id: 9, categoria: "Síntesis y combinación", titulo: "Calcio + cloro", reactivos: ["Ca", "Cl2"], productos: ["CaCl2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de una sal binaria." },
    { id: 10, categoria: "Síntesis y combinación", titulo: "Aluminio + oxígeno", reactivos: ["Al", "O2"], productos: ["Al2O3"], coeficientesR: [4, 3], coeficientesP: [2], nota: "Formación de óxido de aluminio." },
    { id: 11, categoria: "Síntesis y combinación", titulo: "Fósforo + oxígeno suficiente", reactivos: ["P4", "O2"], productos: ["P4O10"], coeficientesR: [1, 5], coeficientesP: [1], nota: "Combustión completa del fósforo." },
    { id: 12, categoria: "Síntesis y combinación", titulo: "Litio + oxígeno", reactivos: ["Li", "O2"], productos: ["Li2O"], coeficientesR: [4, 1], coeficientesP: [2], nota: "Formación del óxido de litio." },
    { id: 13, categoria: "Síntesis y combinación", titulo: "Cobre + oxígeno", reactivos: ["Cu", "O2"], productos: ["CuO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Oxidación del cobre bajo condiciones apropiadas." },
    { id: 14, categoria: "Síntesis y combinación", titulo: "Zinc + oxígeno", reactivos: ["Zn", "O2"], productos: ["ZnO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Formación de óxido de zinc." },
    { id: 15, categoria: "Síntesis y combinación", titulo: "Bario + oxígeno", reactivos: ["Ba", "O2"], productos: ["BaO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Ecuación idealizada de formación del óxido." },
    { id: 16, categoria: "Síntesis y combinación", titulo: "Calcio + nitrógeno", reactivos: ["Ca", "N2"], productos: ["Ca3N2"], coeficientesR: [3, 1], coeficientesP: [1], nota: "Formación de nitruro de calcio." },
    { id: 17, categoria: "Síntesis y combinación", titulo: "Hidrógeno + cloro", reactivos: ["H2", "Cl2"], productos: ["HCl"], coeficientesR: [1, 1], coeficientesP: [2], nota: "Reacción fotoquímica o iniciada; puede ser violenta." },
    { id: 18, categoria: "Síntesis y combinación", titulo: "Monóxido de carbono + oxígeno", reactivos: ["CO", "O2"], productos: ["CO2"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Oxidación del monóxido de carbono." },
    { id: 19, categoria: "Síntesis y combinación", titulo: "Óxido de calcio + agua", reactivos: ["CaO", "H2O"], productos: ["Ca(OH)2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Reacción exotérmica de apagado de la cal." },
    { id: 20, categoria: "Síntesis y combinación", titulo: "Dióxido de azufre + oxígeno", reactivos: ["SO2", "O2"], productos: ["SO3"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Oxidación catalítica; etapa del proceso de contacto." },
    { id: 21, categoria: "Síntesis y combinación", titulo: "Potasio + cloro", reactivos: ["K", "Cl2"], productos: ["KCl"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Formación de una sal iónica; el potasio es más reactivo que el sodio." },
    { id: 22, categoria: "Síntesis y combinación", titulo: "Potasio + bromo", reactivos: ["K", "Br2"], productos: ["KBr"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Síntesis." },
    { id: 23, categoria: "Síntesis y combinación", titulo: "Magnesio + nitrógeno", reactivos: ["Mg", "N2"], productos: ["Mg3N2"], coeficientesR: [3, 1], coeficientesP: [1], nota: "Formación de nitruro." },
    { id: 24, categoria: "Síntesis y combinación", titulo: "Magnesio + cloro", reactivos: ["Mg", "Cl2"], productos: ["MgCl2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Síntesis de una sal binaria." },
    { id: 25, categoria: "Síntesis y combinación", titulo: "Aluminio + bromo", reactivos: ["Al", "Br2"], productos: ["AlBr3"], coeficientesR: [2, 3], coeficientesP: [2], nota: "Síntesis." },
    { id: 26, categoria: "Síntesis y combinación", titulo: "Aluminio + cloro", reactivos: ["Al", "Cl2"], productos: ["AlCl3"], coeficientesR: [2, 3], coeficientesP: [2], nota: "Formación de cloruro de aluminio anhidro." },
    { id: 27, categoria: "Síntesis y combinación", titulo: "Zinc + azufre", reactivos: ["Zn", "S"], productos: ["ZnS"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Síntesis." },
    { id: 28, categoria: "Síntesis y combinación", titulo: "Hierro + cloro", reactivos: ["Fe", "Cl2"], productos: ["FeCl3"], coeficientesR: [2, 3], coeficientesP: [2], nota: "El cloro oxida el hierro hasta hierro(III)." },
    { id: 29, categoria: "Síntesis y combinación", titulo: "Cobre + cloro", reactivos: ["Cu", "Cl2"], productos: ["CuCl2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de cloruro de cobre(II)." },
    { id: 30, categoria: "Síntesis y combinación", titulo: "Magnesio + azufre", reactivos: ["Mg", "S"], productos: ["MgS"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Síntesis de sulfuro metálico al calentar." },
    { id: 31, categoria: "Síntesis y combinación", titulo: "Sodio + azufre", reactivos: ["Na", "S"], productos: ["Na2S"], coeficientesR: [2, 1], coeficientesP: [1], nota: "Formación de sulfuro de sodio; reacción muy exotérmica." },
    { id: 32, categoria: "Síntesis y combinación", titulo: "Hidrógeno + azufre", reactivos: ["H2", "S"], productos: ["H2S"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Síntesis de sulfuro de hidrógeno a temperatura elevada; gas tóxico." },
    { id: 33, categoria: "Síntesis y combinación", titulo: "Hidrógeno + bromo", reactivos: ["H2", "Br2"], productos: ["HBr"], coeficientesR: [1, 1], coeficientesP: [2], nota: "Síntesis de bromuro de hidrógeno; menos violenta que con cloro." },
    { id: 34, categoria: "Síntesis y combinación", titulo: "Fósforo + cloro", reactivos: ["P4", "Cl2"], productos: ["PCl3"], coeficientesR: [1, 6], coeficientesP: [4], nota: "Formación de tricloruro de fósforo con cloro limitado." },
    { id: 35, categoria: "Síntesis y combinación", titulo: "Silicio + cloro", reactivos: ["Si", "Cl2"], productos: ["SiCl4"], coeficientesR: [1, 2], coeficientesP: [1], nota: "Formación de tetracloruro de silicio a alta temperatura." },
    { id: 36, categoria: "Síntesis y combinación", titulo: "Cobre + azufre", reactivos: ["Cu", "S"], productos: ["Cu2S"], coeficientesR: [2, 1], coeficientesP: [1], nota: "Producto posible según condiciones." },
    { id: 37, categoria: "Síntesis y combinación", titulo: "Silicio + oxígeno", reactivos: ["Si", "O2"], productos: ["SiO2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de dióxido de silicio." },
    { id: 38, categoria: "Síntesis y combinación", titulo: "Calcio + carbono", reactivos: ["Ca", "C"], productos: ["CaC2"], coeficientesR: [1, 2], coeficientesP: [1], nota: "Representación global; requiere alta temperatura." },
    { id: 39, categoria: "Síntesis y combinación", titulo: "Nitrógeno + oxígeno", reactivos: ["N2", "O2"], productos: ["NO"], coeficientesR: [1, 1], coeficientesP: [2], nota: "Ocurre a temperaturas muy altas, como en motores o relámpagos." },
    { id: 40, categoria: "Síntesis y combinación", titulo: "Zinc + cloro", reactivos: ["Zn", "Cl2"], productos: ["ZnCl2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de cloruro de zinc." },

    /* ---- Descomposición ---- */
    { id: 41, categoria: "Descomposición", titulo: "Peróxido de hidrógeno", reactivos: ["H2O2"], productos: ["H2O", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Se acelera con catalizadores como MnO₂." },
    { id: 42, categoria: "Descomposición", titulo: "Clorato de potasio", reactivos: ["KClO3"], productos: ["KCl", "O2"], coeficientesR: [2], coeficientesP: [2, 3], nota: "Descomposición por calentamiento; demostración solo en laboratorio supervisado." },
    { id: 43, categoria: "Descomposición", titulo: "Carbonato de calcio", reactivos: ["CaCO3"], productos: ["CaO", "CO2"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Calcinación a temperatura elevada." },
    { id: 44, categoria: "Descomposición", titulo: "Bicarbonato de sodio", reactivos: ["NaHCO3"], productos: ["Na2CO3", "CO2", "H2O"], coeficientesR: [2], coeficientesP: [1, 1, 1], nota: "Descomposición térmica." },
    { id: 45, categoria: "Descomposición", titulo: "Óxido de mercurio(II)", reactivos: ["HgO"], productos: ["Hg", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Ejemplo histórico; el mercurio es tóxico y no debe manipularse." },
    { id: 46, categoria: "Descomposición", titulo: "Óxido de plata", reactivos: ["Ag2O"], productos: ["Ag", "O2"], coeficientesR: [2], coeficientesP: [4, 1], nota: "Descomposición al calentar." },
    { id: 47, categoria: "Descomposición", titulo: "Carbonato de magnesio", reactivos: ["MgCO3"], productos: ["MgO", "CO2"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Descomposición térmica." },
    { id: 48, categoria: "Descomposición", titulo: "Hidróxido de cobre(II)", reactivos: ["Cu(OH)2"], productos: ["CuO", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "El sólido azul se transforma al calentarse." },
    { id: 49, categoria: "Descomposición", titulo: "Hidróxido de calcio", reactivos: ["Ca(OH)2"], productos: ["CaO", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Descomposición térmica a temperatura elevada." },
    { id: 50, categoria: "Descomposición", titulo: "Ácido carbónico", reactivos: ["H2CO3"], productos: ["CO2", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Equilibrio en disolución acuosa." },
    { id: 51, categoria: "Descomposición", titulo: "Ácido sulfuroso", reactivos: ["H2SO3"], productos: ["SO2", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Representación simplificada de un equilibrio acuoso." },
    { id: 52, categoria: "Descomposición", titulo: "Nitrato de potasio", reactivos: ["KNO3"], productos: ["KNO2", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Descomposición térmica idealizada." },
    { id: 53, categoria: "Descomposición", titulo: "Azida de sodio", reactivos: ["NaN3"], productos: ["Na", "N2"], coeficientesR: [2], coeficientesP: [2, 3], nota: "Solo ejemplo teórico; compuesto peligroso." },
    { id: 54, categoria: "Descomposición", titulo: "Cloruro de amonio", reactivos: ["NH4Cl"], productos: ["NH3", "HCl"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Disociación/recombinación en fase gaseosa al calentar." },
    { id: 55, categoria: "Descomposición", titulo: "Óxido de plomo(IV)", reactivos: ["PbO2"], productos: ["PbO", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Descomposición térmica." },
    { id: 56, categoria: "Descomposición", titulo: "Hidróxido de aluminio", reactivos: ["Al(OH)3"], productos: ["Al2O3", "H2O"], coeficientesR: [2], coeficientesP: [1, 3], nota: "Deshidratación al calentar." },
    { id: 57, categoria: "Descomposición", titulo: "Clorato de sodio", reactivos: ["NaClO3"], productos: ["NaCl", "O2"], coeficientesR: [2], coeficientesP: [2, 3], nota: "Descomposición térmica; no realizar fuera de laboratorio." },
    { id: 58, categoria: "Descomposición", titulo: "Nitrato de cobre(II)", reactivos: ["Cu(NO3)2"], productos: ["CuO", "NO2", "O2"], coeficientesR: [2], coeficientesP: [2, 4, 1], nota: "Produce dióxido de nitrógeno tóxico." },
    { id: 59, categoria: "Descomposición", titulo: "Nitrato de plomo(II)", reactivos: ["Pb(NO3)2"], productos: ["PbO", "NO2", "O2"], coeficientesR: [2], coeficientesP: [2, 4, 1], nota: "Solo ejemplo teórico; compuestos y gases tóxicos." },
    { id: 60, categoria: "Descomposición", titulo: "Agua", reactivos: ["H2O"], productos: ["H2", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Electrólisis; requiere energía eléctrica." },
    { id: 61, categoria: "Descomposición", titulo: "Carbonato de bario", reactivos: ["BaCO3"], productos: ["BaO", "CO2"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Descomposición térmica a temperatura muy alta." },
    { id: 62, categoria: "Descomposición", titulo: "Carbonato de litio", reactivos: ["Li2CO3"], productos: ["Li2O", "CO2"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Descomposición térmica a temperatura elevada." },
    { id: 63, categoria: "Descomposición", titulo: "Hidróxido de zinc", reactivos: ["Zn(OH)2"], productos: ["ZnO", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Deshidratación al calentar." },
    { id: 64, categoria: "Descomposición", titulo: "Carbonato de zinc", reactivos: ["ZnCO3"], productos: ["ZnO", "CO2"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Descomposición térmica." },
    { id: 65, categoria: "Descomposición", titulo: "Hidróxido de magnesio", reactivos: ["Mg(OH)2"], productos: ["MgO", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Deshidratación térmica." },
    { id: 66, categoria: "Descomposición", titulo: "Hidróxido de hierro(III)", reactivos: ["Fe(OH)3"], productos: ["Fe2O3", "H2O"], coeficientesR: [2], coeficientesP: [1, 3], nota: "Deshidratación global." },
    { id: 67, categoria: "Descomposición", titulo: "Nitrato de amonio", reactivos: ["NH4NO3"], productos: ["N2O", "H2O"], coeficientesR: [1], coeficientesP: [1, 2], nota: "Descomposición térmica controlada; el compuesto puede ser explosivo, solo estudio teórico." },
    { id: 68, categoria: "Descomposición", titulo: "Nitrato de sodio", reactivos: ["NaNO3"], productos: ["NaNO2", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Descomposición térmica." },
    { id: 69, categoria: "Descomposición", titulo: "Nitrato de plata", reactivos: ["AgNO3"], productos: ["Ag", "NO2", "O2"], coeficientesR: [2], coeficientesP: [2, 2, 1], nota: "Descomposición térmica." },
    { id: 70, categoria: "Descomposición", titulo: "Nitrito de amonio", reactivos: ["NH4NO2"], productos: ["N2", "H2O"], coeficientesR: [1], coeficientesP: [1, 2], nota: "Método clásico de obtención de nitrógeno; el sólido es inestable." },
    { id: 71, categoria: "Descomposición", titulo: "Carbonato de amonio", reactivos: ["(NH4)2CO3"], productos: ["NH3", "CO2", "H2O"], coeficientesR: [1], coeficientesP: [2, 1, 1], nota: "Descomposición térmica con liberación de gases." },
    { id: 72, categoria: "Descomposición", titulo: "Peróxido de sodio", reactivos: ["Na2O2"], productos: ["Na2O", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Descomposición térmica idealizada." },
    { id: 73, categoria: "Descomposición", titulo: "Bicarbonato de potasio", reactivos: ["KHCO3"], productos: ["K2CO3", "CO2", "H2O"], coeficientesR: [2], coeficientesP: [1, 1, 1], nota: "Descomposición por calentamiento." },
    { id: 74, categoria: "Descomposición", titulo: "Bicarbonato de amonio", reactivos: ["NH4HCO3"], productos: ["NH3", "CO2", "H2O"], coeficientesR: [1], coeficientesP: [1, 1, 1], nota: "Descomposición térmica." },
    { id: 75, categoria: "Descomposición", titulo: "Dicromato de amonio", reactivos: ["(NH4)2Cr2O7"], productos: ["Cr2O3", "N2", "H2O"], coeficientesR: [1], coeficientesP: [1, 1, 4], nota: "Ejemplo teórico; compuesto tóxico, no realizar." },
    { id: 76, categoria: "Descomposición", titulo: "Perclorato de potasio", reactivos: ["KClO4"], productos: ["KCl", "O2"], coeficientesR: [1], coeficientesP: [1, 2], nota: "Descomposición térmica a temperatura elevada." },
    { id: 77, categoria: "Descomposición", titulo: "Yoduro de hidrógeno", reactivos: ["HI"], productos: ["H2", "I2"], coeficientesR: [2], coeficientesP: [1, 1], nota: "Equilibrio de descomposición a alta temperatura." },
    { id: 78, categoria: "Descomposición", titulo: "Peróxido de bario", reactivos: ["BaO2"], productos: ["BaO", "O2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Descomposición térmica; fue un método histórico de obtención de oxígeno." },
    { id: 79, categoria: "Descomposición", titulo: "Bromuro de plata", reactivos: ["AgBr"], productos: ["Ag", "Br2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Fotodescomposición; es la base de la fotografía clásica." },
    { id: 80, categoria: "Descomposición", titulo: "Carbonato de estroncio", reactivos: ["SrCO3"], productos: ["SrO", "CO2"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Descomposición térmica." },

    /* ---- Combustión y oxidación ---- */
    { id: 81, categoria: "Combustión y oxidación", titulo: "Metano", reactivos: ["CH4", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Combustión completa." },
    { id: 82, categoria: "Combustión y oxidación", titulo: "Propano", reactivos: ["C3H8", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 5], coeficientesP: [3, 4], nota: "Combustión completa." },
    { id: 83, categoria: "Combustión y oxidación", titulo: "Butano", reactivos: ["C4H10", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 13], coeficientesP: [8, 10], nota: "Combustión completa." },
    { id: 84, categoria: "Combustión y oxidación", titulo: "Etanol", reactivos: ["C2H5OH", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 3], coeficientesP: [2, 3], nota: "Combustión completa." },
    { id: 85, categoria: "Combustión y oxidación", titulo: "Glucosa", reactivos: ["C6H12O6", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 6], coeficientesP: [6, 6], nota: "Oxidación global de la glucosa." },
    { id: 86, categoria: "Combustión y oxidación", titulo: "Metano (combustión incompleta a CO)", reactivos: ["CH4", "O2"], productos: ["CO", "H2O"], coeficientesR: [2, 3], coeficientesP: [2, 4], nota: "Combustión incompleta idealizada; el CO es un gas tóxico." },
    { id: 87, categoria: "Combustión y oxidación", titulo: "Sulfuro de hidrógeno", reactivos: ["H2S", "O2"], productos: ["SO2", "H2O"], coeficientesR: [2, 3], coeficientesP: [2, 2], nota: "Combustión completa; H₂S es muy tóxico." },
    { id: 88, categoria: "Combustión y oxidación", titulo: "Etino (acetileno)", reactivos: ["C2H2", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 5], coeficientesP: [4, 2], nota: "Combustión completa." },
    { id: 89, categoria: "Combustión y oxidación", titulo: "Benceno", reactivos: ["C6H6", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 15], coeficientesP: [12, 6], nota: "Combustión completa; benceno es tóxico." },
    { id: 90, categoria: "Combustión y oxidación", titulo: "Hierro", reactivos: ["Fe", "O2"], productos: ["Fe3O4"], coeficientesR: [3, 2], coeficientesP: [1], nota: "Oxidación posible bajo ciertas condiciones." },
    { id: 91, categoria: "Combustión y oxidación", titulo: "Hierro (formación de óxido férrico)", reactivos: ["Fe", "O2"], productos: ["Fe2O3"], coeficientesR: [4, 3], coeficientesP: [2], nota: "Corrosión; modelo simplificado del óxido de hierro(III)." },
    { id: 92, categoria: "Combustión y oxidación", titulo: "Estaño", reactivos: ["Sn", "O2"], productos: ["SnO2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Oxidación del estaño al calentar." },
    { id: 93, categoria: "Combustión y oxidación", titulo: "Plomo", reactivos: ["Pb", "O2"], productos: ["PbO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Oxidación del plomo; compuestos de plomo tóxicos." },
    { id: 94, categoria: "Combustión y oxidación", titulo: "Etano", reactivos: ["C2H6", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 7], coeficientesP: [4, 6], nota: "Combustión completa." },
    { id: 95, categoria: "Combustión y oxidación", titulo: "Metanol", reactivos: ["CH3OH", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 3], coeficientesP: [2, 4], nota: "Combustión completa." },
    { id: 96, categoria: "Combustión y oxidación", titulo: "Pentano", reactivos: ["C5H12", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 8], coeficientesP: [5, 6], nota: "Combustión completa." },
    { id: 97, categoria: "Combustión y oxidación", titulo: "Hexano", reactivos: ["C6H14", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 19], coeficientesP: [12, 14], nota: "Combustión completa." },
    { id: 98, categoria: "Combustión y oxidación", titulo: "Amoníaco", reactivos: ["NH3", "O2"], productos: ["N2", "H2O"], coeficientesR: [4, 3], coeficientesP: [2, 6], nota: "Oxidación sin catalizador; otros productos pueden formarse según condiciones." },
    { id: 99, categoria: "Combustión y oxidación", titulo: "Amoníaco (proceso catalítico)", reactivos: ["NH3", "O2"], productos: ["NO", "H2O"], coeficientesR: [4, 5], coeficientesP: [4, 6], nota: "Oxidación catalítica de Ostwald." },
    { id: 100, categoria: "Combustión y oxidación", titulo: "Sodio", reactivos: ["Na", "O2"], productos: ["Na2O"], coeficientesR: [4, 1], coeficientesP: [2], nota: "Ecuación simplificada; el producto real depende de condiciones." },
    { id: 101, categoria: "Combustión y oxidación", titulo: "Heptano", reactivos: ["C7H16", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 11], coeficientesP: [7, 8], nota: "Combustión completa." },
    { id: 102, categoria: "Combustión y oxidación", titulo: "Octano", reactivos: ["C8H18", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 25], coeficientesP: [16, 18], nota: "Combustión completa; componente de la gasolina." },
    { id: 103, categoria: "Combustión y oxidación", titulo: "Propeno", reactivos: ["C3H6", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 9], coeficientesP: [6, 6], nota: "Combustión completa de un alqueno." },
    { id: 104, categoria: "Combustión y oxidación", titulo: "Buteno", reactivos: ["C4H8", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 6], coeficientesP: [4, 4], nota: "Combustión completa de un alqueno." },
    { id: 105, categoria: "Combustión y oxidación", titulo: "Etilenglicol", reactivos: ["C2H6O2", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 5], coeficientesP: [4, 6], nota: "Combustión completa; el compuesto es tóxico." },
    { id: 106, categoria: "Combustión y oxidación", titulo: "Glicerol", reactivos: ["C3H8O3", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 7], coeficientesP: [6, 8], nota: "Combustión completa." },
    { id: 107, categoria: "Combustión y oxidación", titulo: "Sacarosa", reactivos: ["C12H22O11", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 12], coeficientesP: [12, 11], nota: "Oxidación global de la sacarosa." },
    { id: 108, categoria: "Combustión y oxidación", titulo: "Propanol", reactivos: ["C3H7OH", "O2"], productos: ["CO2", "H2O"], coeficientesR: [2, 9], coeficientesP: [6, 8], nota: "Combustión completa." },
    { id: 109, categoria: "Combustión y oxidación", titulo: "Acetona", reactivos: ["C3H6O", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 4], coeficientesP: [3, 3], nota: "Combustión completa." },
    { id: 110, categoria: "Combustión y oxidación", titulo: "Tolueno", reactivos: ["C7H8", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 9], coeficientesP: [7, 4], nota: "Combustión completa; vapores tóxicos e inflamables." },
    { id: 111, categoria: "Combustión y oxidación", titulo: "Éter dietílico", reactivos: ["C4H10O", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 6], coeficientesP: [4, 5], nota: "Combustión completa; muy inflamable." },
    { id: 112, categoria: "Combustión y oxidación", titulo: "Disulfuro de carbono", reactivos: ["CS2", "O2"], productos: ["CO2", "SO2"], coeficientesR: [1, 3], coeficientesP: [1, 2], nota: "Combustión completa; tóxico e inflamable." },
    { id: 113, categoria: "Combustión y oxidación", titulo: "Sulfuro de hidrógeno (combustión parcial)", reactivos: ["H2S", "O2"], productos: ["S", "H2O"], coeficientesR: [2, 1], coeficientesP: [2, 2], nota: "Oxidación parcial." },
    { id: 114, categoria: "Combustión y oxidación", titulo: "Pirita (tostación)", reactivos: ["FeS2", "O2"], productos: ["Fe2O3", "SO2"], coeficientesR: [4, 11], coeficientesP: [2, 8], nota: "Tostación metalúrgica; libera SO₂." },
    { id: 115, categoria: "Combustión y oxidación", titulo: "Potasio", reactivos: ["K", "O2"], productos: ["K2O"], coeficientesR: [4, 1], coeficientesP: [2], nota: "Ecuación simplificada; el producto real depende de las condiciones." },
    { id: 116, categoria: "Combustión y oxidación", titulo: "Hierro (formación de óxido ferroso)", reactivos: ["Fe", "O2"], productos: ["FeO"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Modelo simplificado; el producto depende de condiciones." },
    { id: 117, categoria: "Combustión y oxidación", titulo: "Cobre (formación de óxido cuproso)", reactivos: ["Cu", "O2"], productos: ["Cu2O"], coeficientesR: [4, 1], coeficientesP: [2], nota: "Oxidación del cobre con oxígeno limitado y calor." },
    { id: 118, categoria: "Combustión y oxidación", titulo: "Etino (combustión incompleta a CO)", reactivos: ["C2H2", "O2"], productos: ["CO", "H2O"], coeficientesR: [2, 3], coeficientesP: [4, 2], nota: "Combustión incompleta idealizada." },
    { id: 119, categoria: "Combustión y oxidación", titulo: "Propano (combustión incompleta a CO)", reactivos: ["C3H8", "O2"], productos: ["CO", "H2O"], coeficientesR: [2, 7], coeficientesP: [6, 8], nota: "Combustión incompleta idealizada." },
    { id: 120, categoria: "Combustión y oxidación", titulo: "Metano (combustión incompleta a carbono)", reactivos: ["CH4", "O2"], productos: ["C", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Combustión muy incompleta idealizada; produce hollín." },

    /* ---- Neutralización ácido-base ---- */
    { id: 121, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de sodio", reactivos: ["HCl", "NaOH"], productos: ["NaCl", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Ácido fuerte + base fuerte." },
    { id: 122, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de potasio", reactivos: ["HNO3", "KOH"], productos: ["KNO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 123, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de sodio", reactivos: ["H2SO4", "NaOH"], productos: ["Na2SO4", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización completa." },
    { id: 124, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de calcio", reactivos: ["HCl", "Ca(OH)2"], productos: ["CaCl2", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Neutralización completa." },
    { id: 125, categoria: "Neutralización ácido-base", titulo: "Ácido fosfórico + hidróxido de potasio", reactivos: ["H3PO4", "KOH"], productos: ["K3PO4", "H2O"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "Neutralización completa; pueden formarse sales ácidas con menos base." },
    { id: 126, categoria: "Neutralización ácido-base", titulo: "Ácido acético + hidróxido de sodio", reactivos: ["CH3COOH", "NaOH"], productos: ["CH3COONa", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Ácido débil + base fuerte." },
    { id: 127, categoria: "Neutralización ácido-base", titulo: "Ácido bromhídrico + hidróxido de litio", reactivos: ["HBr", "LiOH"], productos: ["LiBr", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 128, categoria: "Neutralización ácido-base", titulo: "Ácido perclórico + hidróxido de sodio", reactivos: ["HClO4", "NaOH"], productos: ["NaClO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización formal; el ácido concentrado es peligroso." },
    { id: 129, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de potasio", reactivos: ["H2SO4", "KOH"], productos: ["K2SO4", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización completa." },
    { id: 130, categoria: "Neutralización ácido-base", titulo: "Ácido carbónico + hidróxido de sodio", reactivos: ["H2CO3", "NaOH"], productos: ["Na2CO3", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Modelo de neutralización completa; sistema en equilibrio." },
    { id: 131, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de calcio", reactivos: ["HNO3", "Ca(OH)2"], productos: ["Ca(NO3)2", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Neutralización." },
    { id: 132, categoria: "Neutralización ácido-base", titulo: "Ácido fórmico + hidróxido de potasio", reactivos: ["HCOOH", "KOH"], productos: ["HCOOK", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Formación de formiato de potasio." },
    { id: 133, categoria: "Neutralización ácido-base", titulo: "Ácido oxálico + hidróxido de sodio", reactivos: ["H2C2O4", "NaOH"], productos: ["Na2C2O4", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización completa." },
    { id: 134, categoria: "Neutralización ácido-base", titulo: "Ácido sulfhídrico + hidróxido de sodio", reactivos: ["H2S", "NaOH"], productos: ["Na2S", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización formal completa; H₂S es muy tóxico." },
    { id: 135, categoria: "Neutralización ácido-base", titulo: "Ácido fosfórico + hidróxido de calcio", reactivos: ["H3PO4", "Ca(OH)2"], productos: ["Ca3(PO4)2", "H2O"], coeficientesR: [2, 3], coeficientesP: [1, 6], nota: "Puede producir precipitado de fosfato de calcio." },
    { id: 136, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de aluminio", reactivos: ["HCl", "Al(OH)3"], productos: ["AlCl3", "H2O"], coeficientesR: [3, 1], coeficientesP: [1, 3], nota: "Neutralización." },
    { id: 137, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de aluminio", reactivos: ["HNO3", "Al(OH)3"], productos: ["Al(NO3)3", "H2O"], coeficientesR: [3, 1], coeficientesP: [1, 3], nota: "Neutralización formal." },
    { id: 138, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de magnesio", reactivos: ["H2SO4", "Mg(OH)2"], productos: ["MgSO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Neutralización." },
    { id: 139, categoria: "Neutralización ácido-base", titulo: "Ácido bromhídrico + hidróxido de bario", reactivos: ["HBr", "Ba(OH)2"], productos: ["BaBr2", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Neutralización." },
    { id: 140, categoria: "Neutralización ácido-base", titulo: "Ácido yodhídrico + hidróxido de sodio", reactivos: ["HI", "NaOH"], productos: ["NaI", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 141, categoria: "Neutralización ácido-base", titulo: "Hidróxido de cobre(II) + ácido sulfúrico", reactivos: ["Cu(OH)2", "H2SO4"], productos: ["CuSO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Base + ácido." },
    { id: 142, categoria: "Neutralización ácido-base", titulo: "Amoníaco + ácido clorhídrico", reactivos: ["NH3", "HCl"], productos: ["NH4Cl"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de cloruro de amonio." },
    { id: 143, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de potasio", reactivos: ["HCl", "KOH"], productos: ["KCl", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 144, categoria: "Neutralización ácido-base", titulo: "Ácido bromhídrico + hidróxido de sodio", reactivos: ["HBr", "NaOH"], productos: ["NaBr", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 145, categoria: "Neutralización ácido-base", titulo: "Ácido yodhídrico + hidróxido de potasio", reactivos: ["HI", "KOH"], productos: ["KI", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 146, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de litio", reactivos: ["HNO3", "LiOH"], productos: ["LiNO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 147, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de litio", reactivos: ["HCl", "LiOH"], productos: ["LiCl", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Ácido fuerte + base fuerte." },
    { id: 148, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de litio", reactivos: ["H2SO4", "LiOH"], productos: ["Li2SO4", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización completa." },
    { id: 149, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de sodio", reactivos: ["HNO3", "NaOH"], productos: ["NaNO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización." },
    { id: 150, categoria: "Neutralización ácido-base", titulo: "Ácido carbónico + hidróxido de calcio", reactivos: ["H2CO3", "Ca(OH)2"], productos: ["CaCO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Puede precipitar carbonato de calcio." },
    { id: 151, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de calcio", reactivos: ["H2SO4", "Ca(OH)2"], productos: ["CaSO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Neutralización completa; el CaSO₄ es poco soluble." },
    { id: 152, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de magnesio", reactivos: ["HCl", "Mg(OH)2"], productos: ["MgCl2", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Neutralización; principio de los antiácidos." },
    { id: 153, categoria: "Neutralización ácido-base", titulo: "Ácido acético + hidróxido de potasio", reactivos: ["CH3COOH", "KOH"], productos: ["CH3COOK", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Ácido débil + base fuerte." },
    { id: 154, categoria: "Neutralización ácido-base", titulo: "Ácido fórmico + hidróxido de calcio", reactivos: ["HCOOH", "Ca(OH)2"], productos: ["Ca(HCOO)2", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Neutralización." },
    { id: 155, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de bario", reactivos: ["HNO3", "Ba(OH)2"], productos: ["Ba(NO3)2", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Neutralización completa." },
    { id: 156, categoria: "Neutralización ácido-base", titulo: "Ácido bórico + hidróxido de sodio (formal)", reactivos: ["H3BO3", "NaOH"], productos: ["NaBO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Representación formal simplificada; química real depende del medio." },
    { id: 157, categoria: "Neutralización ácido-base", titulo: "Ácido acético + amoníaco", reactivos: ["CH3COOH", "NH3"], productos: ["CH3COONH4"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Ácido débil + base débil." },
    { id: 158, categoria: "Neutralización ácido-base", titulo: "Ácido clórico + hidróxido de potasio", reactivos: ["HClO3", "KOH"], productos: ["KClO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización formal." },
    { id: 159, categoria: "Neutralización ácido-base", titulo: "Ácido sulfhídrico + hidróxido de sodio (parcial)", reactivos: ["H2S", "NaOH"], productos: ["NaHS", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización parcial." },
    { id: 160, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de sodio (parcial)", reactivos: ["H2SO4", "NaOH"], productos: ["NaHSO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización parcial." },
    { id: 161, categoria: "Neutralización ácido-base", titulo: "Ácido fosfórico + hidróxido de sodio (parcial)", reactivos: ["H3PO4", "NaOH"], productos: ["NaH2PO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización parcial." },
    { id: 162, categoria: "Neutralización ácido-base", titulo: "Ácido fosfórico + hidróxido de sodio (segunda etapa)", reactivos: ["H3PO4", "NaOH"], productos: ["Na2HPO4", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización parcial; se representa el producto intermedio." },

    /* ---- Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros) ---- */
    { id: 163, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Zinc + ácido clorhídrico", reactivos: ["Zn", "HCl"], productos: ["ZnCl2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "El zinc desplaza al hidrógeno." },
    { id: 164, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Magnesio + ácido sulfúrico diluido", reactivos: ["Mg", "H2SO4"], productos: ["MgSO4", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Ácido diluido; no generalizar a ácido concentrado." },
    { id: 165, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Hierro + ácido clorhídrico", reactivos: ["Fe", "HCl"], productos: ["FeCl2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Forma hierro(II) en condiciones habituales." },
    { id: 166, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Aluminio + ácido clorhídrico", reactivos: ["Al", "HCl"], productos: ["AlCl3", "H2"], coeficientesR: [2, 6], coeficientesP: [2, 3], nota: "La capa de óxido puede ralentizar el inicio." },
    { id: 167, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Calcio + ácido clorhídrico", reactivos: ["Ca", "HCl"], productos: ["CaCl2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Desplazamiento de hidrógeno." },
    { id: 168, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de cobre(II) + ácido clorhídrico", reactivos: ["CuO", "HCl"], productos: ["CuCl2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Óxido básico + ácido." },
    { id: 169, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de magnesio + ácido nítrico", reactivos: ["MgO", "HNO3"], productos: ["Mg(NO3)2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Óxido básico + ácido." },
    { id: 170, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de hierro(III) + ácido clorhídrico", reactivos: ["Fe2O3", "HCl"], productos: ["FeCl3", "H2O"], coeficientesR: [1, 6], coeficientesP: [2, 3], nota: "Óxido básico + ácido." },
    { id: 171, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de calcio + ácido clorhídrico", reactivos: ["CaCO3", "HCl"], productos: ["CaCl2", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1, 1], nota: "Se libera dióxido de carbono." },
    { id: 172, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de sodio + ácido clorhídrico", reactivos: ["Na2CO3", "HCl"], productos: ["NaCl", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [2, 1, 1], nota: "Carbonato + ácido." },
    { id: 173, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Bicarbonato de sodio + ácido clorhídrico", reactivos: ["NaHCO3", "HCl"], productos: ["NaCl", "CO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Efervescencia por CO₂." },
    { id: 174, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de magnesio + ácido sulfúrico", reactivos: ["MgCO3", "H2SO4"], productos: ["MgSO4", "CO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Carbonato + ácido." },
    { id: 175, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Sulfito de sodio + ácido clorhídrico", reactivos: ["Na2SO3", "HCl"], productos: ["NaCl", "SO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [2, 1, 1], nota: "Puede liberar SO₂ irritante/tóxico." },
    { id: 176, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Sulfuro de hierro(II) + ácido clorhídrico", reactivos: ["FeS", "HCl"], productos: ["FeCl2", "H2S"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Libera H₂S tóxico; ecuación solo para estudio." },
    { id: 177, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de calcio + ácido nítrico", reactivos: ["CaO", "HNO3"], productos: ["Ca(NO3)2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Óxido básico + ácido." },
    { id: 178, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de zinc + ácido sulfúrico", reactivos: ["ZnO", "H2SO4"], productos: ["ZnSO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Óxido anfótero reaccionando con ácido." },
    { id: 179, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de potasio + ácido nítrico", reactivos: ["K2CO3", "HNO3"], productos: ["KNO3", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [2, 1, 1], nota: "Carbonato + ácido." },
    { id: 180, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Bicarbonato de calcio + ácido clorhídrico", reactivos: ["Ca(HCO3)2", "HCl"], productos: ["CaCl2", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2, 2], nota: "Representación global." },
    { id: 181, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Magnesio + ácido clorhídrico", reactivos: ["Mg", "HCl"], productos: ["MgCl2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "El magnesio desplaza al hidrógeno." },
    { id: 182, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Aluminio + ácido sulfúrico diluido", reactivos: ["Al", "H2SO4"], productos: ["Al2(SO4)3", "H2"], coeficientesR: [2, 3], coeficientesP: [1, 3], nota: "Metal activo + ácido diluido." },
    { id: 183, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Hierro + ácido sulfúrico diluido", reactivos: ["Fe", "H2SO4"], productos: ["FeSO4", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Forma hierro(II) con ácido diluido." },
    { id: 184, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Zinc + ácido sulfúrico", reactivos: ["Zn", "H2SO4"], productos: ["ZnSO4", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Metal + ácido diluido." },
    { id: 185, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de sodio + ácido sulfúrico", reactivos: ["Na2CO3", "H2SO4"], productos: ["Na2SO4", "CO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Carbonato + ácido; efervescencia." },
    { id: 186, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Magnesio + ácido acético", reactivos: ["Mg", "CH3COOH"], productos: ["Mg(CH3COO)2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Ácido débil + metal activo." },
    { id: 187, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de magnesio + ácido nítrico", reactivos: ["MgCO3", "HNO3"], productos: ["Mg(NO3)2", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1, 1], nota: "Carbonato + ácido." },
    { id: 188, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de zinc + ácido clorhídrico", reactivos: ["ZnCO3", "HCl"], productos: ["ZnCl2", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1, 1], nota: "Liberación de CO₂." },
    { id: 189, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de calcio + ácido nítrico", reactivos: ["CaCO3", "HNO3"], productos: ["Ca(NO3)2", "CO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1, 1], nota: "Se libera dióxido de carbono." },
    { id: 190, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Bicarbonato de potasio + ácido clorhídrico", reactivos: ["KHCO3", "HCl"], productos: ["KCl", "CO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Liberación de gas." },
    { id: 191, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de hierro(III) + ácido sulfúrico", reactivos: ["Fe2O3", "H2SO4"], productos: ["Fe2(SO4)3", "H2O"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "Óxido básico + ácido." },
    { id: 192, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de aluminio + ácido clorhídrico", reactivos: ["Al2O3", "HCl"], productos: ["AlCl3", "H2O"], coeficientesR: [1, 6], coeficientesP: [2, 3], nota: "Óxido anfótero + ácido." },
    { id: 193, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de zinc + ácido clorhídrico", reactivos: ["ZnO", "HCl"], productos: ["ZnCl2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Óxido + ácido." },
    { id: 194, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de cobre(I) + ácido clorhídrico", reactivos: ["Cu2O", "HCl"], productos: ["CuCl", "H2O"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Representación simplificada; solubilidad depende del medio." },
    { id: 195, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de plomo(II) + ácido nítrico", reactivos: ["PbO", "HNO3"], productos: ["Pb(NO3)2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Óxido + ácido; compuesto de plomo tóxico." },
    { id: 196, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Sulfito de calcio + ácido clorhídrico", reactivos: ["CaSO3", "HCl"], productos: ["CaCl2", "SO2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1, 1], nota: "Puede liberar dióxido de azufre irritante." },
    { id: 197, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Bicarbonato de sodio + ácido acético", reactivos: ["NaHCO3", "CH3COOH"], productos: ["CH3COONa", "CO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Efervescencia por CO₂; bicarbonato con vinagre." },

    /* ---- Doble desplazamiento y precipitación ---- */
    { id: 198, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plata + cloruro de sodio", reactivos: ["AgNO3", "NaCl"], productos: ["AgCl", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitado blanco de AgCl." },
    { id: 199, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de bario + sulfato de sodio", reactivos: ["BaCl2", "Na2SO4"], productos: ["BaSO4", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado blanco de BaSO₄." },
    { id: 200, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plomo(II) + yoduro de potasio", reactivos: ["Pb(NO3)2", "KI"], productos: ["PbI2", "KNO3"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado amarillo; plomo tóxico." },
    { id: 201, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de calcio + carbonato de sodio", reactivos: ["CaCl2", "Na2CO3"], productos: ["CaCO3", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado de carbonato de calcio." },
    { id: 202, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de cobre(II) + hidróxido de sodio", reactivos: ["CuSO4", "NaOH"], productos: ["Cu(OH)2", "Na2SO4"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Precipitado azul." },
    { id: 203, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de hierro(III) + hidróxido de sodio", reactivos: ["FeCl3", "NaOH"], productos: ["Fe(OH)3", "NaCl"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "Precipitado pardo rojizo." },
    { id: 204, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plata + bromuro de potasio", reactivos: ["AgNO3", "KBr"], productos: ["AgBr", "KNO3"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitado crema; sales de plata requieren cuidado." },
    { id: 205, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plata + yoduro de potasio", reactivos: ["AgNO3", "KI"], productos: ["AgI", "KNO3"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitado amarillo." },
    { id: 206, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de bario + carbonato de sodio", reactivos: ["BaCl2", "Na2CO3"], productos: ["BaCO3", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado de carbonato de bario; tóxico." },
    { id: 207, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de calcio + carbonato de sodio", reactivos: ["Ca(NO3)2", "Na2CO3"], productos: ["CaCO3", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado blanco." },
    { id: 208, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de aluminio + hidróxido de sodio", reactivos: ["Al2(SO4)3", "NaOH"], productos: ["Al(OH)3", "Na2SO4"], coeficientesR: [1, 6], coeficientesP: [2, 3], nota: "Precipitado blanco gelatinoso; exceso de base puede disolverlo." },
    { id: 209, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de magnesio + hidróxido de sodio", reactivos: ["MgCl2", "NaOH"], productos: ["Mg(OH)2", "NaCl"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado blanco." },
    { id: 210, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de hierro(II) + hidróxido de sodio", reactivos: ["FeSO4", "NaOH"], productos: ["Fe(OH)2", "Na2SO4"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Precipitado verdoso que se oxida al aire." },
    { id: 211, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de cobre(II) + sulfuro de sodio", reactivos: ["CuCl2", "Na2S"], productos: ["CuS", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado negro; evitar acidificar sulfuros." },
    { id: 212, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de bario + sulfato de sodio", reactivos: ["Ba(NO3)2", "Na2SO4"], productos: ["BaSO4", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado blanco." },
    { id: 213, categoria: "Doble desplazamiento y precipitación", titulo: "Fosfato de sodio + cloruro de calcio", reactivos: ["Na3PO4", "CaCl2"], productos: ["Ca3(PO4)2", "NaCl"], coeficientesR: [2, 3], coeficientesP: [1, 6], nota: "Precipitado de fosfato de calcio." },
    { id: 214, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de cobre(II) + sulfuro de sodio", reactivos: ["CuSO4", "Na2S"], productos: ["CuS", "Na2SO4"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitado negro." },
    { id: 215, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de níquel(II) + hidróxido de sodio", reactivos: ["NiCl2", "NaOH"], productos: ["Ni(OH)2", "NaCl"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado verde; compuestos de níquel son peligrosos." },
    { id: 216, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de cobalto(II) + hidróxido de sodio", reactivos: ["CoCl2", "NaOH"], productos: ["Co(OH)2", "NaCl"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado; compuestos de cobalto requieren cuidado." },
    { id: 217, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plata + cloruro de potasio", reactivos: ["AgNO3", "KCl"], productos: ["AgCl", "KNO3"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitado blanco de cloruro de plata." },
    { id: 218, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plata + bromuro de sodio", reactivos: ["AgNO3", "NaBr"], productos: ["AgBr", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitado crema de bromuro de plata." },
    { id: 219, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plomo(II) + cloruro de sodio", reactivos: ["Pb(NO3)2", "NaCl"], productos: ["PbCl2", "NaNO3"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado blanco; plomo tóxico." },
    { id: 220, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de calcio + sulfato de sodio", reactivos: ["CaCl2", "Na2SO4"], productos: ["CaSO4", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado blanco poco soluble." },
    { id: 221, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plomo(II) + cromato de potasio", reactivos: ["Pb(NO3)2", "K2CrO4"], productos: ["PbCrO4", "KNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado amarillo; plomo y cromatos tóxicos." },
    { id: 222, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de bario + cromato de potasio", reactivos: ["Ba(NO3)2", "K2CrO4"], productos: ["BaCrO4", "KNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado amarillo; bario y cromatos tóxicos." },
    { id: 223, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de zinc + hidróxido de sodio", reactivos: ["ZnSO4", "NaOH"], productos: ["Zn(OH)2", "Na2SO4"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Precipitado blanco; anfótero, se disuelve en exceso de base." },
    { id: 224, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de cobre(II) + hidróxido de potasio", reactivos: ["CuCl2", "KOH"], productos: ["Cu(OH)2", "KCl"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado azul." },
    { id: 225, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plomo(II) + sulfuro de sodio", reactivos: ["Pb(NO3)2", "Na2S"], productos: ["PbS", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado negro; plomo tóxico." },
    { id: 226, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de magnesio + carbonato de sodio", reactivos: ["MgCl2", "Na2CO3"], productos: ["MgCO3", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado blanco." },
    { id: 227, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de aluminio + hidróxido de potasio", reactivos: ["AlCl3", "KOH"], productos: ["Al(OH)3", "KCl"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "Precipitado gelatinoso; exceso de base puede disolverlo." },
    { id: 228, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de zinc + sulfuro de sodio", reactivos: ["Zn(NO3)2", "Na2S"], productos: ["ZnS", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado de sulfuro de zinc." },
    { id: 229, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de plata + carbonato de sodio", reactivos: ["AgNO3", "Na2CO3"], productos: ["Ag2CO3", "NaNO3"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Precipitado blanco amarillento; sales de plata requieren cuidado." },
    { id: 230, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de calcio + fosfato de sodio", reactivos: ["Ca(NO3)2", "Na3PO4"], productos: ["Ca3(PO4)2", "NaNO3"], coeficientesR: [3, 2], coeficientesP: [1, 6], nota: "Precipitación de fosfato de calcio." },
    { id: 231, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de aluminio + hidróxido de calcio", reactivos: ["Al2(SO4)3", "Ca(OH)2"], productos: ["Al(OH)3", "CaSO4"], coeficientesR: [1, 3], coeficientesP: [2, 3], nota: "Ecuación global simplificada; solubilidad influye." },
    { id: 232, categoria: "Doble desplazamiento y precipitación", titulo: "Carbonato de sodio + cloruro de estroncio", reactivos: ["Na2CO3", "SrCl2"], productos: ["SrCO3", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado de carbonato de estroncio." },
    { id: 233, categoria: "Doble desplazamiento y precipitación", titulo: "Cromato de potasio + nitrato de plata", reactivos: ["K2CrO4", "AgNO3"], productos: ["Ag2CrO4", "KNO3"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Precipitado rojizo; cromatos requieren precaución." },
    { id: 234, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de bario + fosfato de sodio", reactivos: ["BaCl2", "Na3PO4"], productos: ["Ba3(PO4)2", "NaCl"], coeficientesR: [3, 2], coeficientesP: [1, 6], nota: "Precipitado blanco; sales de bario tóxicas." },
    { id: 235, categoria: "Doble desplazamiento y precipitación", titulo: "Nitrato de cobre(II) + carbonato de sodio", reactivos: ["Cu(NO3)2", "Na2CO3"], productos: ["CuCO3", "NaNO3"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Representación escolar; el sólido puede ser carbonato básico." },
    { id: 236, categoria: "Doble desplazamiento y precipitación", titulo: "Cloruro de calcio + oxalato de sodio", reactivos: ["CaCl2", "Na2C2O4"], productos: ["CaC2O4", "NaCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Precipitado de oxalato de calcio." },

    /* ---- Sustitución simple y desplazamiento ---- */
    { id: 237, categoria: "Sustitución simple y desplazamiento", titulo: "Zinc + sulfato de cobre(II)", reactivos: ["Zn", "CuSO4"], productos: ["ZnSO4", "Cu"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "El zinc desplaza al cobre." },
    { id: 238, categoria: "Sustitución simple y desplazamiento", titulo: "Hierro + sulfato de cobre(II)", reactivos: ["Fe", "CuSO4"], productos: ["FeSO4", "Cu"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "El hierro desplaza al cobre." },
    { id: 239, categoria: "Sustitución simple y desplazamiento", titulo: "Cobre + nitrato de plata", reactivos: ["Cu", "AgNO3"], productos: ["Cu(NO3)2", "Ag"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "El cobre desplaza a la plata." },
    { id: 240, categoria: "Sustitución simple y desplazamiento", titulo: "Cloro + bromuro de sodio", reactivos: ["Cl2", "NaBr"], productos: ["NaCl", "Br2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "El cloro desplaza al bromo." },
    { id: 241, categoria: "Sustitución simple y desplazamiento", titulo: "Cloro + yoduro de potasio", reactivos: ["Cl2", "KI"], productos: ["KCl", "I2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "El cloro desplaza al yodo." },
    { id: 242, categoria: "Sustitución simple y desplazamiento", titulo: "Bromo + yoduro de sodio", reactivos: ["Br2", "NaI"], productos: ["NaBr", "I2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "El bromo desplaza al yodo." },
    { id: 243, categoria: "Sustitución simple y desplazamiento", titulo: "Aluminio + cloruro de cobre(II)", reactivos: ["Al", "CuCl2"], productos: ["AlCl3", "Cu"], coeficientesR: [2, 3], coeficientesP: [2, 3], nota: "Desplazamiento del cobre." },
    { id: 244, categoria: "Sustitución simple y desplazamiento", titulo: "Magnesio + sulfato de zinc", reactivos: ["Mg", "ZnSO4"], productos: ["MgSO4", "Zn"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "El magnesio desplaza al zinc." },
    { id: 245, categoria: "Sustitución simple y desplazamiento", titulo: "Calcio + agua", reactivos: ["Ca", "H2O"], productos: ["Ca(OH)2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Reacción de metal alcalinotérreo con agua." },
    { id: 246, categoria: "Sustitución simple y desplazamiento", titulo: "Sodio + agua", reactivos: ["Na", "H2O"], productos: ["NaOH", "H2"], coeficientesR: [2, 2], coeficientesP: [2, 1], nota: "Muy vigorosa; solo estudiar teóricamente." },
    { id: 247, categoria: "Sustitución simple y desplazamiento", titulo: "Potasio + agua", reactivos: ["K", "H2O"], productos: ["KOH", "H2"], coeficientesR: [2, 2], coeficientesP: [2, 1], nota: "Extremadamente vigorosa; solo estudiar teóricamente." },
    { id: 248, categoria: "Sustitución simple y desplazamiento", titulo: "Hierro + vapor de agua", reactivos: ["Fe", "H2O"], productos: ["Fe3O4", "H2"], coeficientesR: [3, 4], coeficientesP: [1, 4], nota: "Requiere vapor a alta temperatura." },
    { id: 249, categoria: "Sustitución simple y desplazamiento", titulo: "Magnesio + vapor de agua", reactivos: ["Mg", "H2O"], productos: ["MgO", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Reacción con vapor caliente." },
    { id: 250, categoria: "Sustitución simple y desplazamiento", titulo: "Aluminio + óxido de hierro(III)", reactivos: ["Al", "Fe2O3"], productos: ["Al2O3", "Fe"], coeficientesR: [2, 1], coeficientesP: [1, 2], nota: "Termita; extremadamente caliente, solo ejemplo teórico." },
    { id: 251, categoria: "Sustitución simple y desplazamiento", titulo: "Hidrógeno + óxido de cobre(II)", reactivos: ["H2", "CuO"], productos: ["Cu", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "El hidrógeno reduce el óxido de cobre al calentar." },
    { id: 252, categoria: "Sustitución simple y desplazamiento", titulo: "Carbono + óxido de cobre(II)", reactivos: ["C", "CuO"], productos: ["Cu", "CO2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Reducción a alta temperatura." },
    { id: 253, categoria: "Sustitución simple y desplazamiento", titulo: "Zinc + nitrato de plata", reactivos: ["Zn", "AgNO3"], productos: ["Zn(NO3)2", "Ag"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "El zinc desplaza a la plata." },
    { id: 254, categoria: "Sustitución simple y desplazamiento", titulo: "Bromo + cloruro de sodio", reactivos: ["Br2", "NaCl"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "El bromo no desplaza al cloro del cloruro." },
    { id: 255, categoria: "Sustitución simple y desplazamiento", titulo: "Yodo + bromuro de potasio", reactivos: ["I2", "KBr"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "El yodo no desplaza al bromo del bromuro." },
    { id: 256, categoria: "Sustitución simple y desplazamiento", titulo: "Cobre + ácido clorhídrico diluido", reactivos: ["Cu", "HCl"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "El cobre no desplaza H₂ de un ácido no oxidante." },
    { id: 257, categoria: "Sustitución simple y desplazamiento", titulo: "Hierro + nitrato de plata", reactivos: ["Fe", "AgNO3"], productos: ["Fe(NO3)2", "Ag"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "El hierro desplaza a la plata y forma hierro(II)." },
    { id: 258, categoria: "Sustitución simple y desplazamiento", titulo: "Zinc + nitrato de plomo(II)", reactivos: ["Zn", "Pb(NO3)2"], productos: ["Zn(NO3)2", "Pb"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "El zinc desplaza al plomo; plomo tóxico." },
    { id: 259, categoria: "Sustitución simple y desplazamiento", titulo: "Magnesio + sulfato de cobre(II)", reactivos: ["Mg", "CuSO4"], productos: ["MgSO4", "Cu"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Magnesio desplaza cobre." },
    { id: 260, categoria: "Sustitución simple y desplazamiento", titulo: "Cobre + nitrato de mercurio(II)", reactivos: ["Cu", "Hg(NO3)2"], productos: ["Cu(NO3)2", "Hg"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Desplazamiento; mercurio muy tóxico." },
    { id: 261, categoria: "Sustitución simple y desplazamiento", titulo: "Cloro + bromuro de potasio", reactivos: ["Cl2", "KBr"], productos: ["KCl", "Br2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Halógeno más reactivo desplaza al menos reactivo." },
    { id: 262, categoria: "Sustitución simple y desplazamiento", titulo: "Cloro + yoduro de sodio", reactivos: ["Cl2", "NaI"], productos: ["NaCl", "I2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Desplazamiento de halógeno." },
    { id: 263, categoria: "Sustitución simple y desplazamiento", titulo: "Bromo + yoduro de potasio", reactivos: ["Br2", "KI"], productos: ["KBr", "I2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Desplazamiento de yodo." },
    { id: 264, categoria: "Sustitución simple y desplazamiento", titulo: "Magnesio + sulfato de hierro(II)", reactivos: ["Mg", "FeSO4"], productos: ["MgSO4", "Fe"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "El magnesio desplaza al hierro." },
    { id: 265, categoria: "Sustitución simple y desplazamiento", titulo: "Aluminio + nitrato de plata", reactivos: ["Al", "AgNO3"], productos: ["Al(NO3)3", "Ag"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "El aluminio desplaza a la plata." },
    { id: 266, categoria: "Sustitución simple y desplazamiento", titulo: "Aluminio + sulfato de zinc", reactivos: ["Al", "ZnSO4"], productos: ["Al2(SO4)3", "Zn"], coeficientesR: [2, 3], coeficientesP: [1, 3], nota: "El aluminio desplaza al zinc." },
    { id: 267, categoria: "Sustitución simple y desplazamiento", titulo: "Flúor + cloruro de sodio", reactivos: ["F2", "NaCl"], productos: ["NaF", "Cl2"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "El flúor es el halógeno más reactivo; gas muy peligroso, solo ejemplo teórico." },
    { id: 268, categoria: "Sustitución simple y desplazamiento", titulo: "Zinc + vapor de agua", reactivos: ["Zn", "H2O"], productos: ["ZnO", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Requiere vapor a temperatura elevada." },
    { id: 269, categoria: "Sustitución simple y desplazamiento", titulo: "Litio + agua", reactivos: ["Li", "H2O"], productos: ["LiOH", "H2"], coeficientesR: [2, 2], coeficientesP: [2, 1], nota: "Reacción moderada de un metal alcalino con agua." },
    { id: 270, categoria: "Sustitución simple y desplazamiento", titulo: "Magnesio + óxido de cobre(II)", reactivos: ["Mg", "CuO"], productos: ["MgO", "Cu"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Desplazamiento redox." },
    { id: 271, categoria: "Sustitución simple y desplazamiento", titulo: "Calcio + óxido de cobre(II)", reactivos: ["Ca", "CuO"], productos: ["CaO", "Cu"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Desplazamiento redox formal." },
    { id: 272, categoria: "Sustitución simple y desplazamiento", titulo: "Estroncio + agua", reactivos: ["Sr", "H2O"], productos: ["Sr(OH)2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Metal alcalinotérreo + agua." },
    { id: 273, categoria: "Sustitución simple y desplazamiento", titulo: "Bario + agua", reactivos: ["Ba", "H2O"], productos: ["Ba(OH)2", "H2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Metal alcalinotérreo + agua; bario tóxico." },
    { id: 274, categoria: "Sustitución simple y desplazamiento", titulo: "Hierro + vapor de agua (otra forma de óxido)", reactivos: ["Fe", "H2O"], productos: ["FeO", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Modelo simplificado; fase real depende de condiciones." },
    { id: 275, categoria: "Sustitución simple y desplazamiento", titulo: "Yodo + bromuro de sodio", reactivos: ["I2", "NaBr"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "El yodo no desplaza al bromo en condiciones ordinarias." },
    { id: 276, categoria: "Sustitución simple y desplazamiento", titulo: "Plata + sulfato de cobre(II)", reactivos: ["Ag", "CuSO4"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "La plata es menos reactiva que el cobre y no lo desplaza." },

    /* ---- Reacciones redox y otras inorgánicas ---- */
    { id: 277, categoria: "Reacciones redox y otras inorgánicas", titulo: "Permanganato + hierro(II) en medio ácido", reactivos: ["MnO4-", "Fe^2+", "H+"], productos: ["Mn^2+", "Fe^3+", "H2O"], coeficientesR: [1, 5, 8], coeficientesP: [1, 5, 4], nota: "Ecuación iónica neta en medio ácido." },
    { id: 278, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dicromato + hierro(II) en medio ácido", reactivos: ["Cr2O7^2-", "Fe^2+", "H+"], productos: ["Cr^3+", "Fe^3+", "H2O"], coeficientesR: [1, 6, 14], coeficientesP: [2, 6, 7], nota: "Ecuación iónica neta; Cr(VI) es tóxico." },
    { id: 279, categoria: "Reacciones redox y otras inorgánicas", titulo: "Peróxido de hidrógeno + yoduro en medio ácido", reactivos: ["H2O2", "I-", "H+"], productos: ["I2", "H2O"], coeficientesR: [1, 2, 2], coeficientesP: [1, 2], nota: "El peróxido oxida al yoduro." },
    { id: 280, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cloro + agua", reactivos: ["Cl2", "H2O"], productos: ["HCl", "HClO"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Equilibrio de dismutación." },
    { id: 281, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de nitrógeno + agua", reactivos: ["NO2", "H2O"], productos: ["HNO2", "HNO3"], coeficientesR: [2, 1], coeficientesP: [1, 1], nota: "Dismutación; NO₂ es tóxico." },
    { id: 282, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de nitrógeno(II) + oxígeno", reactivos: ["NO", "O2"], productos: ["NO2"], coeficientesR: [2, 1], coeficientesP: [2], nota: "Oxidación del NO." },
    { id: 283, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de azufre + agua", reactivos: ["SO2", "H2O"], productos: ["H2SO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Representación simplificada del equilibrio acuoso." },
    { id: 284, categoria: "Reacciones redox y otras inorgánicas", titulo: "Trióxido de azufre + agua", reactivos: ["SO3", "H2O"], productos: ["H2SO4"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Reacción muy exotérmica; formación de ácido sulfúrico." },
    { id: 285, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de carbono + agua", reactivos: ["CO2", "H2O"], productos: ["H2CO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Equilibrio ácido carbónico." },
    { id: 286, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de sodio + agua", reactivos: ["Na2O", "H2O"], productos: ["NaOH"], coeficientesR: [1, 1], coeficientesP: [2], nota: "Óxido básico + agua." },
    { id: 287, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de potasio + agua", reactivos: ["K2O", "H2O"], productos: ["KOH"], coeficientesR: [1, 1], coeficientesP: [2], nota: "Óxido básico + agua." },
    { id: 288, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de fósforo(V) + agua", reactivos: ["P4O10", "H2O"], productos: ["H3PO4"], coeficientesR: [1, 6], coeficientesP: [4], nota: "Formación de ácido fosfórico." },
    { id: 289, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de azufre(VI) + hidróxido de sodio", reactivos: ["SO3", "NaOH"], productos: ["Na2SO4", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Óxido ácido + base." },
    { id: 290, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de carbono + hidróxido de calcio", reactivos: ["CO2", "Ca(OH)2"], productos: ["CaCO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Enturbia el agua de cal." },
    { id: 291, categoria: "Reacciones redox y otras inorgánicas", titulo: "Carbonato de calcio + dióxido de carbono + agua", reactivos: ["CaCO3", "CO2", "H2O"], productos: ["Ca(HCO3)2"], coeficientesR: [1, 1, 1], coeficientesP: [1], nota: "Con exceso de CO₂ el precipitado de CaCO₃ se disuelve como bicarbonato soluble." },
    { id: 292, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cloruro de amonio + hidróxido de sodio", reactivos: ["NH4Cl", "NaOH"], productos: ["NH3", "NaCl", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Una sal de amonio con base fuerte libera amoníaco." },
    { id: 293, categoria: "Reacciones redox y otras inorgánicas", titulo: "Nitrato de amonio + hidróxido de sodio", reactivos: ["NH4NO3", "NaOH"], productos: ["NH3", "NaNO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1, 1], nota: "Liberación de amoníaco." },
    { id: 294, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cloruro de sodio fundido", reactivos: ["NaCl"], productos: ["Na", "Cl2"], coeficientesR: [2], coeficientesP: [2, 1], nota: "Electrólisis de sal fundida." },
    { id: 295, categoria: "Reacciones redox y otras inorgánicas", titulo: "Permanganato + oxalato en medio ácido", reactivos: ["MnO4-", "C2O4^2-", "H+"], productos: ["Mn^2+", "CO2", "H2O"], coeficientesR: [2, 5, 16], coeficientesP: [2, 10, 8], nota: "Ecuación iónica neta; valoración clásica." },
    { id: 296, categoria: "Reacciones redox y otras inorgánicas", titulo: "Hidróxido de aluminio + exceso de hidróxido de sodio", reactivos: ["Al(OH)3", "NaOH"], productos: ["Na[Al(OH)4]"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Comportamiento anfótero; forma aluminato en exceso de base." },
    { id: 297, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cloruro de hierro(III) + tiocianato de potasio", reactivos: ["Fe^3+", "SCN-"], productos: ["[FeSCN]^2+"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Prueba de complejo rojo; ecuación iónica neta." },
    { id: 298, categoria: "Reacciones redox y otras inorgánicas", titulo: "Permanganato + yoduro en medio ácido", reactivos: ["MnO4-", "I-", "H+"], productos: ["Mn^2+", "I2", "H2O"], coeficientesR: [2, 10, 16], coeficientesP: [2, 5, 8], nota: "Ecuación iónica neta redox." },
    { id: 299, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dicromato + yoduro en medio ácido", reactivos: ["Cr2O7^2-", "I-", "H+"], productos: ["Cr^3+", "I2", "H2O"], coeficientesR: [1, 6, 14], coeficientesP: [2, 3, 7], nota: "Ecuación iónica neta; Cr(VI) es tóxico." },
    { id: 300, categoria: "Reacciones redox y otras inorgánicas", titulo: "Clorato + cloruro en medio ácido", reactivos: ["ClO3-", "Cl-", "H+"], productos: ["Cl2", "H2O"], coeficientesR: [1, 5, 6], coeficientesP: [3, 3], nota: "Genera cloro; solo ecuación teórica." },
    { id: 301, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cobre + ácido nítrico diluido", reactivos: ["Cu", "HNO3"], productos: ["Cu(NO3)2", "NO", "H2O"], coeficientesR: [3, 8], coeficientesP: [3, 2, 4], nota: "El nítrico oxida al cobre; se libera NO." },
    { id: 302, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de manganeso + ácido oxálico", reactivos: ["MnO2", "H2C2O4", "H2SO4"], productos: ["MnSO4", "CO2", "H2O"], coeficientesR: [1, 1, 1], coeficientesP: [1, 2, 2], nota: "Redox global simplificada." },
    { id: 303, categoria: "Reacciones redox y otras inorgánicas", titulo: "Sulfuro de hidrógeno + cloro", reactivos: ["H2S", "Cl2"], productos: ["S", "HCl"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Oxidación del sulfuro." },
    { id: 304, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de azufre + cloro + agua", reactivos: ["SO2", "Cl2", "H2O"], productos: ["H2SO4", "HCl"], coeficientesR: [1, 1, 2], coeficientesP: [1, 2], nota: "Oxidación de SO₂." },
    { id: 305, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cobre + ácido nítrico concentrado", reactivos: ["Cu", "HNO3"], productos: ["Cu(NO3)2", "NO2", "H2O"], coeficientesR: [1, 4], coeficientesP: [1, 2, 2], nota: "Se libera NO₂ tóxico; solo estudio teórico." },
    { id: 306, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de cobre(II) + amoníaco", reactivos: ["CuO", "NH3"], productos: ["Cu", "N2", "H2O"], coeficientesR: [3, 2], coeficientesP: [3, 1, 3], nota: "Reducción de óxido; condiciones de calentamiento." },
    { id: 307, categoria: "Reacciones redox y otras inorgánicas", titulo: "Óxido de plomo(II) + carbono", reactivos: ["PbO", "C"], productos: ["Pb", "CO"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Reducción metalúrgica; plomo tóxico." },
    { id: 308, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cloruro de hierro(III) + yoduro", reactivos: ["Fe^3+", "I-"], productos: ["Fe^2+", "I2"], coeficientesR: [2, 2], coeficientesP: [2, 1], nota: "Ecuación iónica neta redox." },
    { id: 309, categoria: "Reacciones redox y otras inorgánicas", titulo: "Bromo + tiosulfato (exceso de bromo)", reactivos: ["Br2", "S2O3^2-", "H2O"], productos: ["Br-", "SO4^2-", "H+"], coeficientesR: [4, 1, 5], coeficientesP: [8, 2, 10], nota: "El bromo oxida el tiosulfato hasta sulfato; el yodo, más débil, solo llega a tetrationato." },
    { id: 310, categoria: "Reacciones redox y otras inorgánicas", titulo: "Yodo + tiosulfato", reactivos: ["I2", "S2O3^2-"], productos: ["I-", "S4O6^2-"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Reacción de valoración." },
    { id: 311, categoria: "Reacciones redox y otras inorgánicas", titulo: "Sulfito + peróxido de hidrógeno", reactivos: ["SO3^2-", "H2O2"], productos: ["SO4^2-", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Oxidación de sulfito." },
    { id: 312, categoria: "Reacciones redox y otras inorgánicas", titulo: "Hierro(II) + peróxido de hidrógeno en ácido", reactivos: ["Fe^2+", "H2O2", "H+"], productos: ["Fe^3+", "H2O"], coeficientesR: [2, 1, 2], coeficientesP: [2, 2], nota: "Oxidación de Fe(II)." },
    { id: 313, categoria: "Reacciones redox y otras inorgánicas", titulo: "Oxalato + oxígeno en medio ácido", reactivos: ["C2O4^2-", "O2", "H+"], productos: ["CO2", "H2O"], coeficientesR: [2, 1, 4], coeficientesP: [4, 2], nota: "Ecuación global redox en medio ácido." },
    { id: 314, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cloro + hidróxido de sodio", reactivos: ["Cl2", "NaOH"], productos: ["NaCl", "NaClO", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 1, 1], nota: "Dismutación del cloro; base de la lejía." },
    { id: 315, categoria: "Reacciones redox y otras inorgánicas", titulo: "Sulfuro de plomo(II) + oxígeno", reactivos: ["PbS", "O2"], productos: ["PbO", "SO2"], coeficientesR: [2, 3], coeficientesP: [2, 2], nota: "Tostación metalúrgica; plomo y SO₂ peligrosos." },
    { id: 316, categoria: "Reacciones redox y otras inorgánicas", titulo: "Sulfuro de zinc + oxígeno", reactivos: ["ZnS", "O2"], productos: ["ZnO", "SO2"], coeficientesR: [2, 3], coeficientesP: [2, 2], nota: "Tostación metalúrgica." },
    { id: 317, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de nitrógeno + agua + oxígeno", reactivos: ["NO2", "O2", "H2O"], productos: ["HNO3"], coeficientesR: [4, 1, 2], coeficientesP: [4], nota: "Formación de ácido nítrico; proceso global." },
    { id: 318, categoria: "Reacciones redox y otras inorgánicas", titulo: "Nitruro de magnesio + agua", reactivos: ["Mg3N2", "H2O"], productos: ["Mg(OH)2", "NH3"], coeficientesR: [1, 6], coeficientesP: [3, 2], nota: "Hidrólisis de nitruro." },
    { id: 319, categoria: "Reacciones redox y otras inorgánicas", titulo: "Carburo de calcio + agua", reactivos: ["CaC2", "H2O"], productos: ["C2H2", "Ca(OH)2"], coeficientesR: [1, 2], coeficientesP: [1, 1], nota: "Genera acetileno; no realizar sin instalaciones adecuadas." },
    { id: 320, categoria: "Reacciones redox y otras inorgánicas", titulo: "Fosfuro de calcio + agua", reactivos: ["Ca3P2", "H2O"], productos: ["Ca(OH)2", "PH3"], coeficientesR: [1, 6], coeficientesP: [3, 2], nota: "Genera fosfina tóxica; solo ejemplo teórico." },

    /* ---- Reacciones orgánicas básicas ---- */
    { id: 321, categoria: "Reacciones orgánicas básicas", titulo: "Eteno + hidrógeno", reactivos: ["C2H4", "H2"], productos: ["C2H6"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Hidrogenación catalítica." },
    { id: 322, categoria: "Reacciones orgánicas básicas", titulo: "Etino + hidrógeno (hidrogenación completa)", reactivos: ["C2H2", "H2"], productos: ["C2H6"], coeficientesR: [1, 2], coeficientesP: [1], nota: "Hidrogenación completa con catalizador." },
    { id: 323, categoria: "Reacciones orgánicas básicas", titulo: "Eteno + bromo", reactivos: ["C2H4", "Br2"], productos: ["C2H4Br2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Adición de halógeno al doble enlace." },
    { id: 324, categoria: "Reacciones orgánicas básicas", titulo: "Eteno + agua", reactivos: ["C2H4", "H2O"], productos: ["C2H5OH"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Hidratación catalítica." },
    { id: 325, categoria: "Reacciones orgánicas básicas", titulo: "Etanol + oxígeno (oxidación global)", reactivos: ["C2H5OH", "O2"], productos: ["CH3COOH", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Oxidación de etanol a ácido acético en condiciones apropiadas." },
    { id: 326, categoria: "Reacciones orgánicas básicas", titulo: "Etanol (deshidratación)", reactivos: ["C2H5OH"], productos: ["C2H4", "H2O"], coeficientesR: [1], coeficientesP: [1, 1], nota: "Deshidratación bajo condiciones ácidas y calor." },
    { id: 327, categoria: "Reacciones orgánicas básicas", titulo: "Ácido acético + etanol", reactivos: ["CH3COOH", "C2H5OH"], productos: ["CH3COOC2H5", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Esterificación; equilibrio ácido-catalizado." },
    { id: 328, categoria: "Reacciones orgánicas básicas", titulo: "Ácido fórmico + metanol", reactivos: ["HCOOH", "CH3OH"], productos: ["HCOOCH3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Esterificación." },
    { id: 329, categoria: "Reacciones orgánicas básicas", titulo: "Etano + cloro", reactivos: ["C2H6", "Cl2"], productos: ["C2H5Cl", "HCl"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Sustitución radicalaria bajo luz UV; pueden formarse más productos." },
    { id: 330, categoria: "Reacciones orgánicas básicas", titulo: "Benceno + bromo", reactivos: ["C6H6", "Br2"], productos: ["C6H5Br", "HBr"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Sustitución electrofílica aromática con catalizador apropiado." },
    { id: 331, categoria: "Reacciones orgánicas básicas", titulo: "Eteno + oxígeno", reactivos: ["C2H4", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 3], coeficientesP: [2, 2], nota: "Combustión completa." },
    { id: 332, categoria: "Reacciones orgánicas básicas", titulo: "Ácido propanoico + etanol", reactivos: ["C2H5COOH", "C2H5OH"], productos: ["C2H5COOC2H5", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Esterificación." },
    { id: 333, categoria: "Reacciones orgánicas básicas", titulo: "Propeno + hidrógeno", reactivos: ["C3H6", "H2"], productos: ["C3H8"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Hidrogenación." },
    { id: 334, categoria: "Reacciones orgánicas básicas", titulo: "Propeno + bromo", reactivos: ["C3H6", "Br2"], productos: ["C3H6Br2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Adición al doble enlace." },
    { id: 335, categoria: "Reacciones orgánicas básicas", titulo: "Etino + bromo (adición completa)", reactivos: ["C2H2", "Br2"], productos: ["C2H2Br4"], coeficientesR: [1, 2], coeficientesP: [1], nota: "Adición completa de halógeno." },
    { id: 336, categoria: "Reacciones orgánicas básicas", titulo: "Glucosa (fermentación alcohólica)", reactivos: ["C6H12O6"], productos: ["C2H5OH", "CO2"], coeficientesR: [1], coeficientesP: [2, 2], nota: "Fermentación por levaduras en condiciones adecuadas." },
    { id: 337, categoria: "Reacciones orgánicas básicas", titulo: "Glucosa (fermentación láctica)", reactivos: ["C6H12O6"], productos: ["C3H6O3"], coeficientesR: [1], coeficientesP: [2], nota: "Representación global de fermentación láctica." },
    { id: 338, categoria: "Reacciones orgánicas básicas", titulo: "Metano + vapor de agua", reactivos: ["CH4", "H2O"], productos: ["CO", "H2"], coeficientesR: [1, 1], coeficientesP: [1, 3], nota: "Reformado con vapor a alta temperatura y catalizador." },
    { id: 339, categoria: "Reacciones orgánicas básicas", titulo: "Eteno (polimerización)", reactivos: ["CH2=CH2"], productos: ["(--CH2--CH2--)n"], coeficientesR: [1], coeficientesP: [1], nota: "Polimerización para formar polietileno." },
    { id: 340, categoria: "Reacciones orgánicas básicas", titulo: "Ácido salicílico + anhídrido acético", reactivos: ["C7H6O3", "C4H6O3"], productos: ["C9H8O4", "CH3COOH"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Síntesis de aspirina; ejemplo conceptual, no receta de laboratorio." },
    { id: 341, categoria: "Reacciones orgánicas básicas", titulo: "Eteno + bromuro de hidrógeno", reactivos: ["C2H4", "HBr"], productos: ["C2H5Br"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Adición de HBr al doble enlace." },
    { id: 342, categoria: "Reacciones orgánicas básicas", titulo: "Etino + bromo (una molécula)", reactivos: ["C2H2", "Br2"], productos: ["C2H2Br2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Adición; producto puede presentar isomería." },
    { id: 343, categoria: "Reacciones orgánicas básicas", titulo: "Propeno + cloruro de hidrógeno", reactivos: ["C3H6", "HCl"], productos: ["C3H7Cl"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Adición según la regla de Markovnikov; producto principal 2-cloropropano." },
    { id: 344, categoria: "Reacciones orgánicas básicas", titulo: "Etino + cloruro de hidrógeno", reactivos: ["C2H2", "HCl"], productos: ["C2H3Cl"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Adición al triple enlace; forma cloroeteno." },
    { id: 345, categoria: "Reacciones orgánicas básicas", titulo: "Metano + cloro", reactivos: ["CH4", "Cl2"], productos: ["CH3Cl", "HCl"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Sustitución radicalaria bajo luz UV; pueden formarse más productos." },
    { id: 346, categoria: "Reacciones orgánicas básicas", titulo: "Buteno + hidrógeno", reactivos: ["C4H8", "H2"], productos: ["C4H10"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Hidrogenación." },
    { id: 347, categoria: "Reacciones orgánicas básicas", titulo: "Etanol + sodio", reactivos: ["C2H5OH", "Na"], productos: ["C2H5ONa", "H2"], coeficientesR: [2, 2], coeficientesP: [2, 1], nota: "Formación de etóxido de sodio; el sodio reacciona con el alcohol." },
    { id: 348, categoria: "Reacciones orgánicas básicas", titulo: "Acetato de etilo + hidróxido de sodio", reactivos: ["CH3COOC2H5", "NaOH"], productos: ["CH3COONa", "C2H5OH"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Hidrólisis básica de un éster (saponificación)." },
    { id: 349, categoria: "Reacciones orgánicas básicas", titulo: "Ácido acético + metanol", reactivos: ["CH3COOH", "CH3OH"], productos: ["CH3COOCH3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Esterificación; equilibrio ácido-catalizado." },
    { id: 350, categoria: "Reacciones orgánicas básicas", titulo: "Propanol + ácido acético", reactivos: ["C3H7OH", "CH3COOH"], productos: ["CH3COOC3H7", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Esterificación; se omite distinguir isómeros de propanol." },
    { id: 351, categoria: "Reacciones orgánicas básicas", titulo: "Benceno + ácido nítrico", reactivos: ["C6H6", "HNO3"], productos: ["C6H5NO2", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Nitración; sustitución electrofílica con H₂SO₄ como catalizador." },
    { id: 352, categoria: "Reacciones orgánicas básicas", titulo: "Ácido propanoico + hidróxido de sodio", reactivos: ["C2H5COOH", "NaOH"], productos: ["C2H5COONa", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Neutralización orgánica." },
    { id: 353, categoria: "Reacciones orgánicas básicas", titulo: "Ácido palmítico + hidróxido de sodio", reactivos: ["C15H31COOH", "NaOH"], productos: ["C15H31COONa", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Formación de jabón (sal de ácido graso)." },
    { id: 354, categoria: "Reacciones orgánicas básicas", titulo: "Ácido esteárico + hidróxido de potasio", reactivos: ["C17H35COOH", "KOH"], productos: ["C17H35COOK", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Formación de jabón." },
    { id: 355, categoria: "Reacciones orgánicas básicas", titulo: "Benceno + hidrógeno", reactivos: ["C6H6", "H2"], productos: ["C6H12"], coeficientesR: [1, 3], coeficientesP: [1], nota: "Hidrogenación catalítica a ciclohexano." },
    { id: 356, categoria: "Reacciones orgánicas básicas", titulo: "Ciclohexano + oxígeno", reactivos: ["C6H12", "O2"], productos: ["CO2", "H2O"], coeficientesR: [1, 9], coeficientesP: [6, 6], nota: "Combustión completa." },
    { id: 357, categoria: "Reacciones orgánicas básicas", titulo: "Eteno (polimerización)", reactivos: ["C2H4"], productos: ["(--CH2--CH2--)n"], coeficientesR: [1], coeficientesP: [1], nota: "Polimerización por adición." },
    { id: 358, categoria: "Reacciones orgánicas básicas", titulo: "Propeno (polimerización)", reactivos: ["C3H6"], productos: ["(--CH2--CH(CH3)--)n"], coeficientesR: [1], coeficientesP: [1], nota: "Formación de polipropileno." },
    { id: 359, categoria: "Reacciones orgánicas básicas", titulo: "Etino + agua", reactivos: ["C2H2", "H2O"], productos: ["CH3CHO"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Hidratación catalítica; forma etanal." },
    { id: 360, categoria: "Reacciones orgánicas básicas", titulo: "Cloruro de vinilo (polimerización)", reactivos: ["CH2=CHCl"], productos: ["(--CH2--CHCl--)n"], coeficientesR: [1], coeficientesP: [1], nota: "Polimerización por adición; forma PVC." },

    /* ---- Reacciones mixtas y práctica de reconocimiento ---- */
    { id: 361, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de bario + agua", reactivos: ["BaO", "H2O"], productos: ["Ba(OH)2"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Óxido básico + agua." },
    { id: 362, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de calcio + dióxido de silicio", reactivos: ["CaO", "SiO2"], productos: ["CaSiO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de escoria en metalurgia a alta temperatura." },
    { id: 363, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de calcio + dióxido de carbono", reactivos: ["CaO", "CO2"], productos: ["CaCO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Combinación de óxido básico y óxido ácido." },
    { id: 364, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de magnesio + dióxido de carbono", reactivos: ["MgO", "CO2"], productos: ["MgCO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de carbonato." },
    { id: 365, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de aluminio + ácido sulfúrico", reactivos: ["Al2O3", "H2SO4"], productos: ["Al2(SO4)3", "H2O"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "Óxido anfótero con ácido." },
    { id: 366, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de sodio + dióxido de carbono (exceso de base)", reactivos: ["NaOH", "CO2"], productos: ["Na2CO3", "H2O"], coeficientesR: [2, 1], coeficientesP: [1, 1], nota: "El producto depende de la proporción de base y CO₂." },
    { id: 367, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de sodio + dióxido de carbono (exceso de CO₂)", reactivos: ["NaOH", "CO2"], productos: ["NaHCO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Modelo global para formación de bicarbonato en condiciones apropiadas." },
    { id: 368, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Pentóxido de dinitrógeno + agua", reactivos: ["N2O5", "H2O"], productos: ["HNO3"], coeficientesR: [1, 1], coeficientesP: [2], nota: "Óxido ácido + agua; forma ácido nítrico." },
    { id: 369, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Cloruro de amonio + nitrato de plata", reactivos: ["NH4Cl", "AgNO3"], productos: ["AgCl", "NH4NO3"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Precipitación de AgCl." },
    { id: 370, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Nitrato de plata + fosfato de sodio", reactivos: ["AgNO3", "Na3PO4"], productos: ["Ag3PO4", "NaNO3"], coeficientesR: [3, 1], coeficientesP: [1, 3], nota: "Precipitado amarillo." },
    { id: 371, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de fósforo(V) + hidróxido de sodio", reactivos: ["P4O10", "NaOH"], productos: ["Na3PO4", "H2O"], coeficientesR: [1, 12], coeficientesP: [4, 6], nota: "Óxido ácido + base." },
    { id: 372, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Sulfato de aluminio + fosfato de sodio", reactivos: ["Al2(SO4)3", "Na3PO4"], productos: ["AlPO4", "Na2SO4"], coeficientesR: [1, 2], coeficientesP: [2, 3], nota: "Precipitado de fosfato de aluminio." },
    { id: 373, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de bario + ácido sulfúrico", reactivos: ["Ba(OH)2", "H2SO4"], productos: ["BaSO4", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Neutralización y precipitación simultáneas." },
    { id: 374, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Dióxido de azufre + hidróxido de calcio", reactivos: ["SO2", "Ca(OH)2"], productos: ["CaSO3", "H2O"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Óxido ácido + base; se usa para retener SO₂." },
    { id: 375, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Sulfuro de sodio + ácido clorhídrico", reactivos: ["Na2S", "HCl"], productos: ["NaCl", "H2S"], coeficientesR: [1, 2], coeficientesP: [2, 1], nota: "Libera gas tóxico; solo estudiar teóricamente." },
    { id: 376, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Magnesio + dióxido de carbono", reactivos: ["Mg", "CO2"], productos: ["MgO", "C"], coeficientesR: [2, 1], coeficientesP: [2, 1], nota: "El magnesio arde incluso en CO₂; redox." },
    { id: 377, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Nitrato de potasio + cloruro de sodio en disolución", reactivos: ["KNO3", "NaCl"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "Los iones permanecen disueltos; no se forma precipitado, gas ni electrolito débil." },
    { id: 378, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de hierro(III) + monóxido de carbono", reactivos: ["Fe2O3", "CO"], productos: ["Fe", "CO2"], coeficientesR: [1, 3], coeficientesP: [2, 3], nota: "Reducción en el alto horno." },
    { id: 379, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Ácido clorhídrico + nitrato de sodio en disolución", reactivos: ["HCl", "NaNO3"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "No hay fuerza impulsora para una reacción iónica neta." },
    { id: 380, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de sodio + cloruro de potasio en disolución", reactivos: ["NaOH", "KCl"], productos: [], coeficientesR: [1, 1], coeficientesP: [], nota: "No se forma precipitado, gas ni sustancia débilmente ionizada." },
    { id: 381, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de hierro(III) + hidrógeno", reactivos: ["Fe2O3", "H2"], productos: ["Fe", "H2O"], coeficientesR: [1, 3], coeficientesP: [2, 3], nota: "Reducción del óxido con hidrógeno a alta temperatura." },
    { id: 382, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de sodio + dióxido de carbono", reactivos: ["Na2O", "CO2"], productos: ["Na2CO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de carbonato." },
    { id: 383, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de potasio + dióxido de azufre", reactivos: ["K2O", "SO2"], productos: ["K2SO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de sulfito." },
    { id: 384, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de calcio + trióxido de azufre", reactivos: ["CaO", "SO3"], productos: ["CaSO4"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de sulfato." },
    { id: 385, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de sodio + trióxido de azufre", reactivos: ["Na2O", "SO3"], productos: ["Na2SO4"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de sulfato." },
    { id: 386, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de zinc + carbono", reactivos: ["ZnO", "C"], productos: ["Zn", "CO"], coeficientesR: [1, 1], coeficientesP: [1, 1], nota: "Reducción metalúrgica a alta temperatura." },
    { id: 387, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de calcio + dióxido de carbono (exceso de CO₂)", reactivos: ["Ca(OH)2", "CO2"], productos: ["Ca(HCO3)2"], coeficientesR: [1, 2], coeficientesP: [1], nota: "Con exceso de CO₂ y agua puede formarse bicarbonato soluble; ecuación global." },
    { id: 388, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de sodio + dióxido de azufre (proporción 1:1)", reactivos: ["NaOH", "SO2"], productos: ["NaHSO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de bisulfito con proporción adecuada." },
    { id: 389, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de potasio + dióxido de carbono (proporción 1:1)", reactivos: ["KOH", "CO2"], productos: ["KHCO3"], coeficientesR: [1, 1], coeficientesP: [1], nota: "Formación de bicarbonato." },
    { id: 390, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Carbonato de sodio + dióxido de carbono + agua", reactivos: ["Na2CO3", "CO2", "H2O"], productos: ["NaHCO3"], coeficientesR: [1, 1, 1], coeficientesP: [2], nota: "Formación de bicarbonato." },
    { id: 391, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de hierro(II) + oxígeno", reactivos: ["FeO", "O2"], productos: ["Fe2O3"], coeficientesR: [4, 1], coeficientesP: [2], nota: "Oxidación de hierro(II) a hierro(III)." },
    { id: 392, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Sulfuro de cobre(I) + oxígeno", reactivos: ["Cu2S", "O2"], productos: ["Cu", "SO2"], coeficientesR: [1, 1], coeficientesP: [2, 1], nota: "Obtención de cobre por tostación; libera SO₂." },
    { id: 393, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Sulfato de amonio + hidróxido de sodio", reactivos: ["(NH4)2SO4", "NaOH"], productos: ["Na2SO4", "NH3", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2, 2], nota: "Una sal de amonio con base fuerte libera amoníaco." },
    { id: 394, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Carbonato de sodio + hidróxido de calcio", reactivos: ["Na2CO3", "Ca(OH)2"], productos: ["CaCO3", "NaOH"], coeficientesR: [1, 1], coeficientesP: [1, 2], nota: "Causticización; precipita carbonato de calcio." },
    { id: 395, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Sulfuro de hidrógeno + dióxido de azufre", reactivos: ["H2S", "SO2"], productos: ["S", "H2O"], coeficientesR: [2, 1], coeficientesP: [3, 2], nota: "Proceso Claus; ambos gases son tóxicos." },
    { id: 396, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido nítrico + oxígeno + agua", reactivos: ["NO", "O2", "H2O"], productos: ["HNO3"], coeficientesR: [4, 3, 2], coeficientesP: [4], nota: "Ecuación global simplificada." },
    { id: 397, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de aluminio + ácido sulfúrico", reactivos: ["Al(OH)3", "H2SO4"], productos: ["Al2(SO4)3", "H2O"], coeficientesR: [2, 3], coeficientesP: [1, 6], nota: "Neutralización." },
    { id: 398, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de hierro(III) + ácido clorhídrico", reactivos: ["Fe(OH)3", "HCl"], productos: ["FeCl3", "H2O"], coeficientesR: [1, 3], coeficientesP: [1, 3], nota: "Neutralización." },
    { id: 399, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de cobre(II) + ácido nítrico", reactivos: ["Cu(OH)2", "HNO3"], productos: ["Cu(NO3)2", "H2O"], coeficientesR: [1, 2], coeficientesP: [1, 2], nota: "Neutralización." },
    { id: 400, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de magnesio + ácido fosfórico", reactivos: ["Mg(OH)2", "H3PO4"], productos: ["Mg3(PO4)2", "H2O"], coeficientesR: [3, 2], coeficientesP: [1, 6], nota: "Neutralización y formación de sal." },

    /* ---- Ampliación: reacciones complejas (100_reacciones_complejas_verificadas.docx) ----
       Se añadieron las 42 que no estaban en el banco; las otras 58 del documento ya existían (ids 20-397). ---- */
    { id: 401, categoria: "Síntesis y combinación", titulo: "Óxido de aluminio + trióxido de azufre", reactivos: ["Al2O3","SO3"], productos: ["Al2(SO4)3"], coeficientesR: [1,3], coeficientesP: [1], nota: "Combinación formal de óxidos." },
    { id: 402, categoria: "Síntesis y combinación", titulo: "Óxido de calcio + pentóxido de difósforo", reactivos: ["CaO","P2O5"], productos: ["Ca3(PO4)2"], coeficientesR: [3,1], coeficientesP: [1], nota: "Combinación formal de óxidos." },
    { id: 403, categoria: "Síntesis y combinación", titulo: "Óxido de hierro(III) + trióxido de azufre", reactivos: ["Fe2O3","SO3"], productos: ["Fe2(SO4)3"], coeficientesR: [1,3], coeficientesP: [1], nota: "Combinación formal de óxidos." },
    { id: 404, categoria: "Síntesis y combinación", titulo: "Óxido de magnesio + pentóxido de dinitrógeno", reactivos: ["MgO","N2O5"], productos: ["Mg(NO3)2"], coeficientesR: [1,1], coeficientesP: [1], nota: "Combinación formal de óxidos." },
    { id: 405, categoria: "Síntesis y combinación", titulo: "Amoníaco + ácido sulfúrico", reactivos: ["NH3","H2SO4"], productos: ["(NH4)2SO4"], coeficientesR: [2,1], coeficientesP: [1], nota: "Neutralización global." },
    { id: 406, categoria: "Síntesis y combinación", titulo: "Sulfato de potasio + ácido sulfúrico", reactivos: ["K2SO4","H2SO4"], productos: ["KHSO4"], coeficientesR: [1,1], coeficientesP: [2], nota: "Formación de sal ácida." },
    { id: 407, categoria: "Síntesis y combinación", titulo: "Hidrogenofosfato de sodio + hidróxido de sodio", reactivos: ["Na2HPO4","NaOH"], productos: ["Na3PO4","H2O"], coeficientesR: [1,1], coeficientesP: [1,1], nota: "Reacción ácido-base; el hidrogenofosfato cede su último protón y forma fosfato." },
    { id: 408, categoria: "Descomposición", titulo: "Bicarbonato de calcio", reactivos: ["Ca(HCO3)2"], productos: ["CaCO3","CO2","H2O"], coeficientesR: [1], coeficientesP: [1,1,1], nota: "Al calentar o perder CO₂." },
    { id: 409, categoria: "Combustión y oxidación", titulo: "Ácido acético", reactivos: ["CH3COOH","O2"], productos: ["CO2","H2O"], coeficientesR: [1,2], coeficientesP: [2,2], nota: "Combustión completa." },
    { id: 410, categoria: "Combustión y oxidación", titulo: "Sulfuro de hierro(II) (tostación)", reactivos: ["FeS","O2"], productos: ["Fe2O3","SO2"], coeficientesR: [4,7], coeficientesP: [2,4], nota: "Ecuación global industrial." },
    { id: 411, categoria: "Neutralización ácido-base", titulo: "Ácido carbónico + hidróxido de bario", reactivos: ["H2CO3","Ba(OH)2"], productos: ["BaCO3","H2O"], coeficientesR: [1,1], coeficientesP: [1,2], nota: "Neutralización y precipitación." },
    { id: 412, categoria: "Neutralización ácido-base", titulo: "Ácido oxálico + hidróxido de aluminio", reactivos: ["H2C2O4","Al(OH)3"], productos: ["Al2(C2O4)3","H2O"], coeficientesR: [3,2], coeficientesP: [1,6], nota: "Ecuación global formal." },
    { id: 413, categoria: "Neutralización ácido-base", titulo: "Ácido cítrico + hidróxido de calcio", reactivos: ["C6H8O7","Ca(OH)2"], productos: ["Ca3(C6H5O7)2","H2O"], coeficientesR: [2,3], coeficientesP: [1,6], nota: "Neutralización completa." },
    { id: 414, categoria: "Neutralización ácido-base", titulo: "Ácido sulfúrico + hidróxido de hierro(III)", reactivos: ["H2SO4","Fe(OH)3"], productos: ["Fe2(SO4)3","H2O"], coeficientesR: [3,2], coeficientesP: [1,6], nota: "Neutralización completa." },
    { id: 415, categoria: "Neutralización ácido-base", titulo: "Ácido nítrico + hidróxido de magnesio", reactivos: ["HNO3","Mg(OH)2"], productos: ["Mg(NO3)2","H2O"], coeficientesR: [2,1], coeficientesP: [1,2], nota: "Neutralización completa." },
    { id: 416, categoria: "Neutralización ácido-base", titulo: "Ácido clorhídrico + hidróxido de cobre(II)", reactivos: ["HCl","Cu(OH)2"], productos: ["CuCl2","H2O"], coeficientesR: [2,1], coeficientesP: [1,2], nota: "Neutralización completa." },
    { id: 417, categoria: "Neutralización ácido-base", titulo: "Ácido tartárico + hidróxido de sodio", reactivos: ["C4H6O6","NaOH"], productos: ["Na2C4H4O6","H2O"], coeficientesR: [1,2], coeficientesP: [1,2], nota: "Neutralización de dos protones." },
    { id: 418, categoria: "Neutralización ácido-base", titulo: "Ácido sulfuroso + hidróxido de calcio", reactivos: ["H2SO3","Ca(OH)2"], productos: ["CaSO3","H2O"], coeficientesR: [1,1], coeficientesP: [1,2], nota: "Ecuación global idealizada." },
    { id: 419, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de aluminio + ácido clorhídrico", reactivos: ["Al2(CO3)3","HCl"], productos: ["AlCl3","CO2","H2O"], coeficientesR: [1,6], coeficientesP: [2,3,3], nota: "Ecuación formal; la sal no es estable en agua." },
    { id: 420, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Carbonato de calcio + ácido fosfórico", reactivos: ["CaCO3","H3PO4"], productos: ["Ca3(PO4)2","CO2","H2O"], coeficientesR: [3,2], coeficientesP: [1,3,3], nota: "La precipitación depende del pH." },
    { id: 421, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Sulfito de sodio + ácido sulfúrico", reactivos: ["Na2SO3","H2SO4"], productos: ["Na2SO4","SO2","H2O"], coeficientesR: [1,1], coeficientesP: [1,1,1], nota: "Genera SO₂ irritante; ejemplo teórico." },
    { id: 422, categoria: "Ácidos con metales, óxidos y sales (carbonatos, sulfitos, sulfuros)", titulo: "Óxido de hierro(III) + ácido nítrico", reactivos: ["Fe2O3","HNO3"], productos: ["Fe(NO3)3","H2O"], coeficientesR: [1,6], coeficientesP: [2,3], nota: "Óxido con ácido." },
    { id: 423, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de aluminio + hidróxido de bario", reactivos: ["Al2(SO4)3","Ba(OH)2"], productos: ["BaSO4","Al(OH)3"], coeficientesR: [1,3], coeficientesP: [3,2], nota: "Se forman dos precipitados." },
    { id: 424, categoria: "Doble desplazamiento y precipitación", titulo: "Sulfato de cobre(II) + hidróxido de bario", reactivos: ["CuSO4","Ba(OH)2"], productos: ["BaSO4","Cu(OH)2"], coeficientesR: [1,1], coeficientesP: [1,1], nota: "Se forman dos precipitados." },
    { id: 425, categoria: "Doble desplazamiento y precipitación", titulo: "Fosfato de potasio + nitrato de hierro(III)", reactivos: ["K3PO4","Fe(NO3)3"], productos: ["FePO4","KNO3"], coeficientesR: [1,1], coeficientesP: [1,3], nota: "Precipitación de fosfato de hierro(III)." },
    { id: 426, categoria: "Doble desplazamiento y precipitación", titulo: "Carbonato de sodio + nitrato de plomo(II)", reactivos: ["Na2CO3","Pb(NO3)2"], productos: ["PbCO3","NaNO3"], coeficientesR: [1,1], coeficientesP: [1,2], nota: "Precipitación de carbonato de plomo." },
    { id: 427, categoria: "Sustitución simple y desplazamiento", titulo: "Aluminio + sulfato de hierro(III)", reactivos: ["Al","Fe2(SO4)3"], productos: ["Al2(SO4)3","Fe"], coeficientesR: [2,1], coeficientesP: [1,2], nota: "Desplazamiento metálico; condiciones de superficie importan." },
    { id: 428, categoria: "Sustitución simple y desplazamiento", titulo: "Magnesio + nitrato de cobre(II)", reactivos: ["Mg","Cu(NO3)2"], productos: ["Mg(NO3)2","Cu"], coeficientesR: [1,1], coeficientesP: [1,1], nota: "Desplazamiento clásico." },
    { id: 429, categoria: "Sustitución simple y desplazamiento", titulo: "Carbono + dióxido de carbono", reactivos: ["C","CO2"], productos: ["CO"], coeficientesR: [1,1], coeficientesP: [2], nota: "Equilibrio a alta temperatura (reacción de Boudouard)." },
    { id: 430, categoria: "Reacciones redox y otras inorgánicas", titulo: "Permanganato + peróxido de hidrógeno en medio ácido", reactivos: ["MnO4-","H2O2","H+"], productos: ["Mn^2+","O2","H2O"], coeficientesR: [2,5,6], coeficientesP: [2,5,8], nota: "Ecuación iónica neta balanceada." },
    { id: 431, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dicromato + sulfito en medio ácido", reactivos: ["Cr2O7^2-","SO3^2-","H+"], productos: ["Cr^3+","SO4^2-","H2O"], coeficientesR: [1,3,8], coeficientesP: [2,3,4], nota: "Ecuación iónica neta balanceada." },
    { id: 432, categoria: "Reacciones redox y otras inorgánicas", titulo: "Clorato + yoduro en medio ácido", reactivos: ["ClO3-","I-","H+"], productos: ["Cl-","I2","H2O"], coeficientesR: [1,6,6], coeficientesP: [1,3,3], nota: "Ecuación iónica neta balanceada." },
    { id: 433, categoria: "Reacciones redox y otras inorgánicas", titulo: "Cobre + nitrato en medio ácido (forma NO)", reactivos: ["Cu","NO3-","H+"], productos: ["Cu^2+","NO","H2O"], coeficientesR: [3,2,8], coeficientesP: [3,2,4], nota: "Producto depende de las condiciones." },
    { id: 434, categoria: "Reacciones redox y otras inorgánicas", titulo: "Dióxido de manganeso + ácido clorhídrico", reactivos: ["MnO2","HCl"], productos: ["MnCl2","Cl2","H2O"], coeficientesR: [1,4], coeficientesP: [1,1,2], nota: "Puede liberar cloro tóxico; ejemplo teórico." },
    { id: 435, categoria: "Reacciones orgánicas básicas", titulo: "Hidrólisis del acetato de etilo", reactivos: ["CH3COOC2H5","H2O"], productos: ["CH3COOH","C2H5OH"], coeficientesR: [1,1], coeficientesP: [1,1], nota: "Hidrólisis reversible." },
    { id: 436, categoria: "Reacciones orgánicas básicas", titulo: "Sacarosa + agua (hidrólisis)", reactivos: ["C12H22O11","H2O"], productos: ["C6H12O6"], coeficientesR: [1,1], coeficientesP: [2], nota: "Produce glucosa y fructosa (isómeros, ambos C₆H₁₂O₆); se registra como 2 C₆H₁₂O₆." },
    { id: 437, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Cloruro de aluminio + carbonato de sodio en agua", reactivos: ["AlCl3","Na2CO3","H2O"], productos: ["Al(OH)3","CO2","NaCl"], coeficientesR: [2,3,3], coeficientesP: [2,3,6], nota: "Ecuación global acuosa." },
    { id: 438, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Sulfato de aluminio + carbonato de sodio en agua", reactivos: ["Al2(SO4)3","Na2CO3","H2O"], productos: ["Al(OH)3","CO2","Na2SO4"], coeficientesR: [1,3,3], coeficientesP: [2,3,3], nota: "Ecuación global acuosa." },
    { id: 439, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Cloruro de amonio + hidróxido de calcio", reactivos: ["NH4Cl","Ca(OH)2"], productos: ["CaCl2","NH3","H2O"], coeficientesR: [2,1], coeficientesP: [1,2,2], nota: "Liberación de amoníaco." },
    { id: 440, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Cloruro de hierro(III) + carbonato de sodio en agua", reactivos: ["FeCl3","Na2CO3","H2O"], productos: ["Fe(OH)3","CO2","NaCl"], coeficientesR: [2,3,3], coeficientesP: [2,3,6], nota: "Precipitación y liberación de CO₂." },
    { id: 441, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Óxido de zinc + hidróxido de sodio", reactivos: ["ZnO","NaOH"], productos: ["Na2ZnO2","H2O"], coeficientesR: [1,2], coeficientesP: [1,1], nota: "Representación formal del zincato; en disolución se forma el complejo Na₂[Zn(OH)₄]." },
    { id: 442, categoria: "Reacciones mixtas y práctica de reconocimiento", titulo: "Hidróxido de zinc + exceso de hidróxido de sodio", reactivos: ["Zn(OH)2","NaOH"], productos: ["Na2[Zn(OH)4]"], coeficientesR: [1,2], coeficientesP: [1], nota: "Formación de complejo soluble." }
  ];

  /* =========================================================================
     9c. CONSULTA DEL BANCO (búsqueda en cadena del simulador paso a paso)
     Solo lee BANCO_REACCIONES; no modifica datos ni funciones anteriores.
     - reactivosDisponibles()          → todo lo que puede ser Reactivo 1
     - reactivosCompatibles(r1)        → qué sustancias reaccionan con r1
     - tercerosPosibles(r1, r2)        → tercer reactivo (reacciones de 3 reactivos)
     - buscarReaccion(r1, r2, r3)      → reacciones exactas (varias = variantes)
     Un reactivo vacío ('' o null) significa "sin ese reactivo".
     ====================================================================== */
  function conteoBanco(filtro, extraer) {
    var cuenta = {}, orden = [];
    BANCO_REACCIONES.forEach(function (r) {
      if (filtro && !filtro(r)) return;
      extraer(r).forEach(function (id) {
        if (!(id in cuenta)) { cuenta[id] = 0; orden.push(id); }
        cuenta[id]++;
      });
    });
    return orden.map(function (id) { return { id: id, reacciones: cuenta[id] }; });
  }

  function reactivosDisponibles() {
    return conteoBanco(null, function (r) { return r.reactivos; });
  }

  function reactivosCompatibles(r1) {
    var solo = 0;
    var companeros = conteoBanco(function (r) {
      if (r.reactivos.indexOf(r1) < 0) return false;
      if (r.reactivos.length === 1) { solo++; return false; }
      return true;
    }, function (r) { return r.reactivos.filter(function (x) { return x !== r1; }); });
    return { companeros: companeros, soloUno: solo };
  }

  function tercerosPosibles(r1, r2) {
    if (!r1 || !r2) return [];
    return conteoBanco(function (r) {
      return r.reactivos.length === 3 && r.reactivos.indexOf(r1) >= 0 && r.reactivos.indexOf(r2) >= 0;
    }, function (r) { return r.reactivos.filter(function (x) { return x !== r1 && x !== r2; }); });
  }

  function buscarReaccion(r1, r2, r3) {
    var pedido = [r1, r2, r3].filter(Boolean);
    if (!pedido.length) return [];
    var clave = pedido.slice().sort().join('|');
    return BANCO_REACCIONES.filter(function (r) {
      return r.reactivos.length === pedido.length && r.reactivos.slice().sort().join('|') === clave;
    });
  }

  /* =========================================================================
     10. EXPORTACIÓN
     reacciones.js lee: elementos, compuestos, iones, reglas, resolverFormula,
     resolverAmbiguedad. El resto son utilidades públicas.
     ====================================================================== */
  var CATALOGO = {
    meta: {
      version: '1.1',
      datosDePrueba: false,
      nota: 'Masas atómicas estándar abreviadas (IUPAC, g/mol). Elementos sin isótopo estable: número de masa del ' +
            'isótopo más estable. Reglas de predicción de nivel introductorio: no inventan productos fuera de ellas.'
    },
    elementos: ELEMENTOS,
    compuestos: COMPUESTOS,
    iones: IONES,
    reglas: REGLAS,

    /* nombres con el estilo pedido en el proyecto */
    ELEMENTOS: ELEMENTOS,
    COMPUESTOS: COMPUESTOS,
    IONES: IONES,

    parsearFormula: parsearFormula,
    calcularMasaMolar: calcularMasaMolar,
    masaMolarDetallada: masaMolarDetallada,
    separarCarga: separarCarga,
    resolverFormula: resolverFormula,
    registroIndice: registroIndice,
    buscar: buscar,
    compuestoIonico: compuestoIonico,
    solubilidad: solubilidad,
    predecir: predecir,
    balancear: balancear,
    resolverAmbiguedad: resolverAmbiguedad,
    validar: validar,

    /* banco de reacciones para la búsqueda en cadena */
    bancoReacciones: BANCO_REACCIONES,
    BANCO_REACCIONES: BANCO_REACCIONES,
    reactivosDisponibles: reactivosDisponibles,
    reactivosCompatibles: reactivosCompatibles,
    tercerosPosibles: tercerosPosibles,
    buscarReaccion: buscarReaccion
  };

  /* Exportación global: FORMULAS_REACCIONES es el nombre que lee reacciones.js;
     CATALOGO es el alias del estándar de variables globales del proyecto.
     (No se crean otras variables globales, para no chocar con otros archivos.) */
  global.FORMULAS_REACCIONES = CATALOGO;
  global.CATALOGO = CATALOGO;
  global.BANCO_REACCIONES = BANCO_REACCIONES;

  if (typeof module !== 'undefined' && module.exports) module.exports = CATALOGO;
})(typeof window !== 'undefined' ? window : globalThis);
