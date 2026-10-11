/* =============================================================================
   formulas.js — Motor de datos y cálculo químico de QuímicApp
   Catálogo v1.0  ·  lo consume reacciones.js (pestaña Reacciones)

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
     10. EXPORTACIÓN
     reacciones.js lee: elementos, compuestos, iones, reglas, resolverFormula,
     resolverAmbiguedad. El resto son utilidades públicas.
     ====================================================================== */
  var CATALOGO = {
    meta: {
      version: '1.0',
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
    validar: validar
  };

  /* Exportación global: FORMULAS_REACCIONES es el nombre que lee reacciones.js;
     CATALOGO es el alias del estándar de variables globales del proyecto.
     (No se crean otras variables globales, para no chocar con otros archivos.) */
  global.FORMULAS_REACCIONES = CATALOGO;
  global.CATALOGO = CATALOGO;

  if (typeof module !== 'undefined' && module.exports) module.exports = CATALOGO;
})(typeof window !== 'undefined' ? window : globalThis);
