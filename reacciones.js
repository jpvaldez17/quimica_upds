/* =============================================================================
   reacciones.js — Pestaña "Reacciones químicas y estequiometría" · QuímicApp
   Versión 4.0 · SIMULADOR DIDÁCTICO PASO A PASO (usa el motor de formulas.js v1.1)

   Depende ÚNICAMENTE de formulas.js (window.FORMULAS_REACCIONES / CATALOGO).
   No usa Internet ni librerías externas. No modifica otras pestañas.

   FLUJO (todo sale del BANCO_REACCIONES; la app no inventa reacciones)
    1. Reactivo 1  →  el Reactivo 2 solo ofrece lo que reacciona con él en el banco
                      (si hace falta, aparece un Reactivo 3; si hay varias variantes, se elige).
    2. 🟢 Determinar reacción  →  productos esperados, categoría y nota del banco
                      (la ecuación completa todavía NO se muestra).
    3. ⚖️ Balancear ecuación  →  ecuación sin balancear y, después, la balanceada con
                      coeficientes destacados (coeficientes del banco verificados con el
                      balanceador matricial y la conservación de átomos y carga).
    4. Análisis y estequiometría  →  tipo/redox, números de oxidación, masas molares,
                      moles y reactivo limitante.

   SECCIONES
    1. Configuración           8. Análisis: medio, redox, tipo
    2. Utilidades              9. Estequiometría (reactivo limitante)
    3. Catálogo               10. Estado del simulador
    4. Fórmulas y especies    11. Vista (DOM)
    5. Masas molares          12. Acciones del usuario (pasos 1 a 4)
    7. Balanceo               13. Inicio y API pública
   ========================================================================== */

(function (global) {
  'use strict';

  /* ===========================================================================
     1. CONFIGURACIÓN
     ======================================================================== */
  var CONFIG = {
    idContenedor: 'reacciones',
    retrasoAnalisis: 1500        // ms que tarda en activarse el paso 4 tras balancear
  };
  if (global.REACCIONES_CONFIG) {
    Object.keys(global.REACCIONES_CONFIG).forEach(function (k) {
      CONFIG[k] = global.REACCIONES_CONFIG[k];
    });
  }

  /* ===========================================================================
     2. UTILIDADES
     ======================================================================== */
  function normalizar(texto) {
    return String(texto || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  function mcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }
  function mcm(a, b) { return (a / mcd(a, b)) * b; }

  function formatoSigno(n) {
    if (n > 0) return '+' + n;
    if (n < 0) return '\u2212' + Math.abs(n);
    return '0';
  }

  function formatoNum(n, dec) {
    if (dec === undefined) dec = 3;
    try {
      return n.toLocaleString('es', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    } catch (e) { return n.toFixed(dec); }
  }

  function unicos(lista) {
    var out = [];
    lista.forEach(function (x) { if (out.indexOf(x) < 0) out.push(x); });
    return out;
  }

  /* Convierte subíndices/superíndices Unicode y símbolos "bonitos" a ASCII
     para que "H₂SO₄", "SO₄²⁻", "−" o "⟶" también se entiendan. */
  function limpiarEntrada(t) {
    return String(t || '')
      .replace(/[\u2080-\u2089]/g, function (c) { return String(c.charCodeAt(0) - 0x2080); })
      .replace(/\u00b2/g, '^2').replace(/\u00b3/g, '^3')
      .replace(/\u207a/g, '+').replace(/[\u207b\u2212\u2013]/g, '-')
      .replace(/->|=>|\u27f6|\u2192|=/g, '\u2192');
  }

  /* ===========================================================================
     3. CATÁLOGO
     ======================================================================== */
  var CATALOGO = global.FORMULAS_REACCIONES ||
                 (global.CATALOGO && global.CATALOGO.elementos ? global.CATALOGO : null);
  var INDICE = {};
  var ORDEN = [];

  function registrar(s) {
    if (INDICE[s.id]) { console.warn('[Reacciones] Identificador duplicado: ' + s.id); return; }
    INDICE[s.id] = s; ORDEN.push(s.id);
  }

  /* Un elemento libre (Fe, Zn...) siempre tiene estado de oxidación 0. */
  function ceroOxidacion(sim) { var o = {}; o[sim] = 0; return o; }

  function construirIndice() {
    INDICE = {}; ORDEN = [];
    if (!CATALOGO) return;
    Object.keys(CATALOGO.elementos || {}).forEach(function (sim) {
      var e = CATALOGO.elementos[sim];
      var comp = {}; comp[e.simbolo] = 1;
      registrar({ id: sim, tipo: 'elemento', formula: e.simbolo, nombre: e.nombre, composicion: comp,
                  carga: 0, clasificacion: e.clasificacion, numeroAtomico: e.numeroAtomico,
                  estadosAsignados: ceroOxidacion(e.simbolo), datoDePrueba: !!e.datoDePrueba });
    });
    Object.keys(CATALOGO.compuestos || {}).forEach(function (f) {
      var c = CATALOGO.compuestos[f];
      registrar({ id: f, tipo: 'compuesto', formula: c.formula, nombre: c.nombre, composicion: c.composicion,
                  carga: 0, clasificacion: c.clasificacion, estadosAsignados: c.oxidacionEnCompuesto || null,
                  datoDePrueba: !!c.datoDePrueba });
    });
    Object.keys(CATALOGO.iones || {}).forEach(function (f) {
      var i = CATALOGO.iones[f];
      registrar({ id: f, tipo: 'ion', formula: i.formula, nombre: i.nombre, composicion: i.composicion,
                  carga: i.carga, clasificacion: i.clasificacion, estadosAsignados: i.oxidacionEnIon || null,
                  datoDePrueba: !!i.datoDePrueba });
    });
  }

  function obtenerSustancia(id) { return INDICE[id] || null; }

  /* Devuelve la sustancia que corresponde a un texto (fórmula o nombre). */
  function resolverToken(txt) {
    var t = limpiarEntrada(txt).trim();
    if (!t) return null;
    if (INDICE[t]) return { sustancia: INDICE[t], interpretado: false };
    var n = normalizar(t);
    var porId = ORDEN.filter(function (id) { return normalizar(id) === n; });
    if (porId.length === 1) return { sustancia: INDICE[porId[0]], interpretado: true };
    var porNombre = ORDEN.filter(function (id) { return normalizar(INDICE[id].nombre) === n; });
    if (porNombre.length === 1) return { sustancia: INDICE[porNombre[0]], interpretado: true };
    /* Fórmula válida pero fuera del catálogo: formulas.js calcula su composición
       y su masa molar con la tabla periódica (sin clasificación ni estados de oxidación). */
    var dinamica = CATALOGO && CATALOGO.resolverFormula ? CATALOGO.resolverFormula(t) : null;
    if (dinamica) {
      if (!INDICE[dinamica.id]) INDICE[dinamica.id] = dinamica;   // no entra en ORDEN: no ensucia las sugerencias
      return { sustancia: INDICE[dinamica.id], interpretado: false };
    }
    return null;
  }

  function buscarSustancias(texto) {
    var q = normalizar(limpiarEntrada(texto));
    if (!q) return [];
    var res = [];
    ORDEN.forEach(function (id) {
      var s = INDICE[id];
      var mejor = null;
      [normalizar(s.id), normalizar(s.nombre)].forEach(function (c) {
        var p = c === q ? 0 : (c.indexOf(q) === 0 ? 1 : (c.indexOf(q) > 0 ? 2 : null));
        if (p !== null && (mejor === null || p < mejor)) mejor = p;
      });
      if (mejor !== null) res.push({ s: s, p: mejor });
    });
    res.sort(function (a, b) { return a.p - b.p; });
    return res.map(function (r) { return r.s; });
  }

  function verificarCatalogo() {
    var problemas = [];
    if (!CATALOGO) return ['formulas.js no está cargado.'];
    ORDEN.forEach(function (id) {
      var s = INDICE[id];
      Object.keys(s.composicion).forEach(function (sim) {
        if (!CATALOGO.elementos[sim]) problemas.push(id + ': el elemento "' + sim + '" no existe.');
        else if (typeof CATALOGO.elementos[sim].masaAtomica !== 'number') problemas.push(id + ': "' + sim + '" no tiene masa atómica.');
        if (!(s.composicion[sim] >= 1) || s.composicion[sim] % 1 !== 0) problemas.push(id + ': cantidad no válida para "' + sim + '".');
      });
      if (s.estadosAsignados) {
        var suma = 0;
        Object.keys(s.composicion).forEach(function (sim) {
          if (s.estadosAsignados[sim] === undefined) problemas.push(id + ': falta el estado de oxidación de "' + sim + '".');
          else suma += s.estadosAsignados[sim] * s.composicion[sim];
        });
        if (suma !== s.carga) problemas.push(id + ': los estados de oxidación suman ' + suma + ' y la carga es ' + s.carga + '.');
      }
    });
    return problemas;
  }

  /* ===========================================================================
     4. FÓRMULAS Y ESPECIES DEL BANCO
     ======================================================================== */
  function parsearFormula(texto) {
    var s = String(texto || '').replace(/\s+/g, '');
    if (!s) return { ok: false, error: 'La fórmula está vacía.' };
    var pila = [{}], i = 0;
    function leerNumero() {
      var m = /^\d+/.exec(s.slice(i));
      if (!m) return 1;
      i += m[0].length; return parseInt(m[0], 10);
    }
    while (i < s.length) {
      var c = s.charAt(i), tope = pila[pila.length - 1];
      if (c === '(') { pila.push({}); i++; }
      else if (c === ')') {
        if (pila.length < 2) return { ok: false, error: 'Hay un paréntesis de cierre sin apertura.' };
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
        tope[sim] = (tope[sim] || 0) + n;
      } else {
        return { ok: false, error: 'Carácter no válido en la fórmula: "' + c + '".' };
      }
    }
    if (pila.length !== 1) return { ok: false, error: 'Falta cerrar un paréntesis.' };
    if (!Object.keys(pila[0]).length) return { ok: false, error: 'La fórmula no contiene elementos.' };
    return { ok: true, composicion: pila[0] };
  }

  function validarFormula(texto) {
    var p = parsearFormula(texto);
    if (!p.ok) return p;
    var desc = Object.keys(p.composicion).filter(function (sim) {
      return !(CATALOGO && CATALOGO.elementos && CATALOGO.elementos[sim]);
    });
    if (desc.length) return { ok: false, desconocidos: desc,
      error: 'Elemento(s) fuera del catálogo actual: ' + desc.join(', ') + '.' };
    return { ok: true, composicion: p.composicion };
  }

  /* Convierte una fórmula del banco ("Fe^2+", "MnO4-", "CH2=CH2"...) en una sustancia.
     Primero busca en el catálogo; si no está, calcula su composición con el parser;
     si ni así se puede (polímeros con "n"), queda como sustancia sin composición:
     se muestra igual, pero sin masa molar ni estados de oxidación. */
  var CACHE_ESPECIES = {};
  function especie(id) {
    if (CACHE_ESPECIES[id]) return CACHE_ESPECIES[id];
    var r = resolverToken(id), s = r ? r.sustancia : null;
    if (!s) {
      var base = id, carga = 0, m = /^(.*?)(\^\d+[+-]|[+-])$/.exec(id);
      if (m) {
        base = m[1];
        var n = /^\^(\d+)([+-])$/.exec(m[2]);
        carga = n ? (n[2] === '-' ? -1 : 1) * parseInt(n[1], 10) : (m[2] === '-' ? -1 : 1);
      }
      var p = parsearFormula(base.replace(/\[/g, '(').replace(/\]/g, ')').replace(/=/g, ''));
      s = { id: id, tipo: carga ? 'ion' : 'compuesto', formula: id, nombre: id,
            composicion: p.ok ? p.composicion : null, carga: carga, clasificacion: null,
            estadosAsignados: null, sinCatalogo: true };
    }
    CACHE_ESPECIES[id] = s;
    return s;
  }


  /* ===========================================================================
     5. MASAS MOLARES
     ======================================================================== */
  function calcularMasaMolar(composicion) {
    if (!CATALOGO || !composicion) return null;
    var total = 0, claves = Object.keys(composicion);
    for (var k = 0; k < claves.length; k++) {
      var e = CATALOGO.elementos[claves[k]];
      if (!e || typeof e.masaAtomica !== 'number') return null;
      total += e.masaAtomica * composicion[claves[k]];
    }
    return total;
  }


  /* Usada por la clasificación de la reacción (sección 8). */
  function parAcidoBase(R) {
    if (R.length !== 2) return null;
    var ac = R.filter(function (s) { return s.clasificacion === 'acido'; });
    var ba = R.filter(function (s) { return s.clasificacion === 'base'; });
    return (ac.length === 1 && ba.length === 1) ? { acido: ac[0], base: ba[0] } : null;
  }

  /* ===========================================================================
     7. BALANCEO
     Independiente de la predicción: recibe especies ya definidas.
     Resuelve conservación de átomos (y de carga) con fracciones exactas.
     ======================================================================== */
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = mcd(n, d) || 1;
    return [n / g, d / g];
  }
  function frSuma(a, b) { return fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
  function frMul(a, b) { return fr(a[0] * b[0], a[1] * b[1]); }
  function frDiv(a, b) { return fr(a[0] * b[1], a[1] * b[0]); }

  function balancearEcuacion(reactivos, productos) {
    if (!reactivos.length || !productos.length) {
      return { estado: 'invalida', mensaje: 'Se necesita al menos un reactivo y un producto.' };
    }
    var especies = reactivos.concat(productos), nR = reactivos.length, n = especies.length;

    var elementos = [];
    especies.forEach(function (s) {
      Object.keys(s.composicion).forEach(function (e) { if (elementos.indexOf(e) < 0) elementos.push(e); });
    });

    /* Cada elemento debe estar en ambos lados; si no, no se puede conservar. */
    var solo = elementos.filter(function (e) {
      var izq = reactivos.some(function (s) { return s.composicion[e]; });
      var der = productos.some(function (s) { return s.composicion[e]; });
      return !(izq && der);
    });
    if (solo.length) {
      return { estado: 'imposible',
        mensaje: 'No se puede balancear: ' + solo.join(', ') + ' aparece solo de un lado. ' +
                 'Los átomos no se crean ni se destruyen, así que cada elemento debe estar en reactivos y productos.' };
    }

    var hayCarga = especies.some(function (s) { return !!s.carga; });
    var filas = elementos.map(function (e) {
      return especies.map(function (s, j) { return fr((s.composicion[e] || 0) * (j < nR ? 1 : -1)); });
    });
    if (hayCarga) filas.push(especies.map(function (s, j) { return fr((s.carga || 0) * (j < nR ? 1 : -1)); }));

    var m = filas.length, pivotes = [], fila = 0;
    for (var col = 0; col < n && fila < m; col++) {
      var p = -1;
      for (var r = fila; r < m; r++) { if (filas[r][col][0] !== 0) { p = r; break; } }
      if (p < 0) continue;
      var tmp = filas[fila]; filas[fila] = filas[p]; filas[p] = tmp;
      var piv = filas[fila][col];
      filas[fila] = filas[fila].map(function (x) { return frDiv(x, piv); });
      for (var r2 = 0; r2 < m; r2++) {
        if (r2 !== fila && filas[r2][col][0] !== 0) {
          var f = fr(-filas[r2][col][0], filas[r2][col][1]), base = filas[fila];
          filas[r2] = filas[r2].map(function (x, k) { return frSuma(x, frMul(f, base[k])); });
        }
      }
      pivotes.push(col); fila++;
    }

    var libres = [];
    for (var c = 0; c < n; c++) { if (pivotes.indexOf(c) < 0) libres.push(c); }
    if (libres.length === 0) {
      return { estado: 'imposible',
        mensaje: 'Estas sustancias no se pueden balancear juntas: no existe una combinación de coeficientes que conserve los átomos' + (hayCarga ? ' y las cargas' : '') + '. Revisa que reactivos y productos sean los correctos.' };
    }
    if (libres.length > 1 && CATALOGO && CATALOGO.resolverAmbiguedad) {
      var conocido = CATALOGO.resolverAmbiguedad(reactivos, productos);
      if (conocido) {
        var vc = verificarConservacion(reactivos, productos, conocido.coeficientesReactivos, conocido.coeficientesProductos);
        if (vc.atomos && vc.carga) {
          return { estado: 'ok', coeficientesReactivos: conocido.coeficientesReactivos, coeficientesProductos: conocido.coeficientesProductos };
        }
      }
    }
    if (libres.length > 1) {
      return { estado: 'ambigua',
        mensaje: 'Hay más de una forma independiente de balancear estas sustancias (' + libres.length + ' grados de libertad); probablemente se mezclan dos reacciones. Revisa los productos.' };
    }

    var libre = libres[0], x = [];
    for (var k = 0; k < n; k++) x.push(fr(0));
    x[libre] = fr(1);
    pivotes.forEach(function (cp, idx) { x[cp] = frMul(fr(-1), filas[idx][libre]); });

    var den = 1;
    x.forEach(function (v) { den = mcm(den, v[1]); });
    var enteros = x.map(function (v) { return v[0] * (den / v[1]); });
    var g = enteros.reduce(function (acc, v) { return mcd(acc, v); }, 0) || 1;
    enteros = enteros.map(function (v) { return v / g; });
    if (enteros.every(function (v) { return v <= 0; })) enteros = enteros.map(function (v) { return -v; });
    if (enteros.some(function (v) { return v <= 0; })) {
      return { estado: 'imposible',
        mensaje: 'La solución matemática exige coeficientes cero o negativos: con estas sustancias la reacción no puede ocurrir tal como se plantea.' };
    }
    return { estado: 'ok', coeficientesReactivos: enteros.slice(0, nR), coeficientesProductos: enteros.slice(nR) };
  }

  function verificarConservacion(reactivos, productos, coefR, coefP) {
    function tot(lista, coefs) {
      var at = {}, carga = 0;
      lista.forEach(function (s, i) {
        Object.keys(s.composicion).forEach(function (e) { at[e] = (at[e] || 0) + s.composicion[e] * coefs[i]; });
        carga += (s.carga || 0) * coefs[i];
      });
      return { atomos: at, carga: carga };
    }
    var a = tot(reactivos, coefR), b = tot(productos, coefP);
    var els = Object.keys(a.atomos).concat(Object.keys(b.atomos));
    return { atomos: els.every(function (e) { return (a.atomos[e] || 0) === (b.atomos[e] || 0); }),
             carga: a.carga === b.carga, izquierda: a, derecha: b };
  }


  /* Ecuación balanceada para una reacción del banco. Los coeficientes son los del banco;
     se verifican con la conservación de átomos y carga y se comparan con el balanceador
     matricial. Si el banco no cerrara, se usa la matriz. Las especies sin composición fija
     (polímeros) no se pueden verificar: se muestran los coeficientes del banco tal cual. */
  function obtenerBalanceo(rx, R, P) {
    var banco = { estado: 'ok', coeficientesReactivos: rx.coeficientesR.slice(), coeficientesProductos: rx.coeficientesP.slice() };
    var completo = R.concat(P).every(function (s) { return !!s.composicion; });
    if (!completo) {
      banco.conservacion = { atomos: true, carga: true, sinVerificar: true };
      banco.fuente = 'banco-sin-verificar';
      return banco;
    }
    var v = verificarConservacion(R, P, banco.coeficientesReactivos, banco.coeficientesProductos);
    var m = balancearEcuacion(R, P);
    if (v.atomos && v.carga) {
      banco.conservacion = v;
      banco.fuente = (m.estado === 'ok' &&
        m.coeficientesReactivos.join() === banco.coeficientesReactivos.join() &&
        m.coeficientesProductos.join() === banco.coeficientesProductos.join()) ? 'banco+matriz' : 'banco';
      return banco;
    }
    if (m.estado === 'ok') {
      m.conservacion = verificarConservacion(R, P, m.coeficientesReactivos, m.coeficientesProductos);
      m.fuente = 'matriz';
      return m;
    }
    return { estado: 'imposible', mensaje: 'Los coeficientes del banco no conservan los átomos y el balanceador matricial tampoco encontró solución.' };
  }

  /* ===========================================================================
     8. ANÁLISIS: MEDIO, REDOX, TIPO
     ======================================================================== */
  function detectarMedio(R) {
    var ac = R.some(function (s) { return s.clasificacion === 'acido' || s.id === 'H+'; });
    var ba = R.some(function (s) { return s.clasificacion === 'base' || s.id === 'OH-'; });
    if (ac && ba) return 'NEUTRALIZACIÓN';
    if (ac) return 'ÁCIDO';
    if (ba) return 'BÁSICO';
    return 'NEUTRO';
  }

  function estadosDe(lista, el, coefs) {
    var out = [];
    lista.forEach(function (s, idx) {
      if (s.composicion[el]) {
        out.push({ sp: s, idx: idx, estado: s.estadosAsignados[el], n: s.composicion[el],
                   coef: coefs ? coefs[idx] : null });
      }
    });
    return out;
  }

  /* Compara, elemento por elemento, el estado de oxidación en reactivos y
     productos. Con coeficientes calcula también los electrones transferidos. */
  function analizarRedox(R, P, coefR, coefP) {
    var todas = R.concat(P);
    var sinDatos = todas.filter(function (s) { return !s.estadosAsignados; });
    if (sinDatos.length) {
      return { estado: 'sin-datos',
        mensaje: 'Faltan estados de oxidación en el catálogo para: ' + sinDatos.map(function (s) { return s.formula; }).join(', ') + '.' };
    }
    var elementos = [];
    todas.forEach(function (s) { Object.keys(s.composicion).forEach(function (e) { if (elementos.indexOf(e) < 0) elementos.push(e); }); });

    var cambios = [], complejos = [];
    elementos.forEach(function (e) {
      var sR = estadosDe(R, e, coefR), sP = estadosDe(P, e, coefP);
      if (!sR.length || !sP.length) return;
      var setR = unicos(sR.map(function (x) { return x.estado; }));
      var setP = unicos(sP.map(function (x) { return x.estado; }));
      var perdidos = setR.filter(function (x) { return setP.indexOf(x) < 0; });
      var ganados = setP.filter(function (x) { return setR.indexOf(x) < 0; });
      if (!perdidos.length && !ganados.length) return;
      if (!perdidos.length || !ganados.length || (perdidos.length > 1 && ganados.length > 1)) {
        complejos.push(e); return;
      }
      function atomos(lista, est) {
        if (!lista.length || lista[0].coef === null) return null;
        var t = 0;
        lista.forEach(function (x) { if (x.estado === est) t += x.coef * x.n; });
        return t;
      }
      var pares = [];
      if (perdidos.length === 1) ganados.forEach(function (g) { pares.push({ de: perdidos[0], a: g, lado: 'P' }); });
      else perdidos.forEach(function (d) { pares.push({ de: d, a: ganados[0], lado: 'R' }); });
      pares.forEach(function (pr) {
        var dif = Math.abs(pr.a - pr.de);
        var at = pr.lado === 'P' ? atomos(sP, pr.a) : atomos(sR, pr.de);
        cambios.push({
          elemento: e, de: pr.de, a: pr.a, tipo: pr.a > pr.de ? 'oxidacion' : 'reduccion',
          electronesPorAtomo: dif, atomos: at, electrones: at === null ? null : at * dif,
          reactivos: sR.filter(function (x) { return x.estado === pr.de; }).map(function (x) { return x.sp; }),
          productos: sP.filter(function (x) { return x.estado === pr.a; }).map(function (x) { return x.sp; })
        });
      });
    });

    var ox = cambios.filter(function (c) { return c.tipo === 'oxidacion'; });
    var re = cambios.filter(function (c) { return c.tipo === 'reduccion'; });
    var eOx = null, eRe = null;
    if (cambios.length && cambios.every(function (c) { return c.electrones !== null; })) {
      eOx = ox.reduce(function (a, c) { return a + c.electrones; }, 0);
      eRe = re.reduce(function (a, c) { return a + c.electrones; }, 0);
    }
    function especiesDe(lista) {
      var out = [];
      lista.forEach(function (c) { c.reactivos.forEach(function (s) { if (out.indexOf(s) < 0) out.push(s); }); });
      return out;
    }
    return { estado: 'ok', cambios: cambios, complejos: complejos, esRedox: cambios.length > 0,
             oxidantes: especiesDe(re), reductores: especiesDe(ox),
             electronesCedidos: eOx, electronesGanados: eRe,
             electronesIguales: eOx !== null && eOx === eRe };
  }

  function clasificarReaccion(R, P, redox) {
    var esRedox = !!(redox && redox.estado === 'ok' && redox.esRedox);
    var clases = function (l) { return l.map(function (s) { return s.clasificacion; }); };
    var ids = function (l) { return l.map(function (s) { return s.id; }); };
    var ab = parAcidoBase(R);

    if (ab && P.some(function (s) { return s.clasificacion === 'sal'; }) && ids(P).indexOf('H2O') >= 0) {
      return { nombre: 'Neutralización (ácido + base)',
        texto: 'Un ácido y una base reaccionan y se forman una sal y agua. Es como si el H\u207a del ácido se uniera al OH\u207b de la base para dar H\u2082O.',
        nota: esRedox ? '' : 'No cambia ningún número de oxidación, así que no es redox.' };
    }
    if (R.length === 2 && ids(R).indexOf('O2') >= 0 && (clases(R).indexOf('hidrocarburo') >= 0 || clases(R).indexOf('organico') >= 0 || R.some(function (s) { return !!(CATALOGO && CATALOGO.compuestos[s.id] && CATALOGO.compuestos[s.id].combustible); })) && ids(P).indexOf('CO2') >= 0) {
      return { nombre: 'Combustión',
        texto: 'Una sustancia reacciona con el oxígeno y libera energía. Con un compuesto orgánico y oxígeno suficiente se forman CO\u2082 y H\u2082O.',
        nota: 'También es redox: el carbono se oxida y el oxígeno se reduce.' };
    }
    if (R.length === 2 && ids(P).indexOf('CO2') >= 0 && ids(P).indexOf('H2O') >= 0 && !esRedox &&
        R.some(function (s) { return s.clasificacion === 'acido'; }) &&
        R.some(function (s) { var c = CATALOGO && CATALOGO.compuestos[s.id]; return !!(c && c.iones && (c.iones.anion === 'CO3^2-' || c.iones.anion === 'HCO3-') && c.clasificacion === 'sal'); })) {
      return { nombre: 'Ácido + carbonato (desprende CO\u2082)',
        texto: 'Un ácido ataca a un carbonato y se forman una sal, agua y CO\u2082 gaseoso (el burbujeo). En el fondo es un doble desplazamiento seguido de la descomposición del H\u2082CO\u2083.',
        nota: 'No cambia ningún número de oxidación, así que no es redox.' };
    }
    if (R.length === 1 && P.length >= 2) {
      return { nombre: 'Descomposición',
        texto: 'Un solo reactivo se rompe en dos o más sustancias más simples.', nota: esRedox ? 'Además es redox.' : '' };
    }
    if (R.length >= 2 && P.length === 1) {
      return { nombre: 'Síntesis (combinación)',
        texto: 'Dos o más sustancias se unen para formar una sola, más compleja.', nota: esRedox ? 'Además es redox.' : '' };
    }
    var elR = R.filter(function (s) { return s.clasificacion === 'elemento' || s.tipo === 'elemento'; }).length;
    var elP = P.filter(function (s) { return s.clasificacion === 'elemento' || s.tipo === 'elemento'; }).length;
    if (R.length === 2 && P.length === 2 && elR === 1 && elP === 1 && esRedox) {
      return { nombre: 'Desplazamiento simple',
        texto: 'Una sustancia simple desplaza a otro elemento de un compuesto y ocupa su lugar.', nota: 'Es redox.' };
    }
    if (R.length === 2 && P.length === 2 && !esRedox) {
      return { nombre: 'Doble desplazamiento',
        texto: 'Dos compuestos intercambian sus partes (iones) para formar dos compuestos nuevos.', nota: 'No cambia ningún número de oxidación.' };
    }
    if (esRedox) {
      return { nombre: 'Oxidación-reducción (redox)',
        texto: 'Hay transferencia de electrones: un elemento los pierde (se oxida) y otro los gana (se reduce).', nota: '' };
    }
    if (redox && redox.estado === 'sin-datos') {
      return { nombre: 'Sin clasificar', texto: 'No se pudo decidir el tipo porque faltan datos de oxidación en el catálogo.', nota: '' };
    }
    return { nombre: 'Sin clasificar', texto: 'Con las categorías disponibles esta reacción no encaja en un tipo conocido.', nota: '' };
  }

  /* ===========================================================================
     9. ESTEQUIOMETRÍA
     ======================================================================== */
  function calcularEstequiometria(R, P, coefR, coefP, gramos) {
    var filas = R.map(function (s, i) {
      var M = calcularMasaMolar(s.composicion);
      var mol = gramos[i] / M;
      return { sustancia: s, masaMolar: M, gramos: gramos[i], moles: mol, coef: coefR[i], razon: mol / coefR[i] };
    });
    if (filas.some(function (f) { return f.masaMolar === null || !isFinite(f.moles); })) {
      return { estado: 'error', mensaje: 'No se pudo calcular: falta la masa molar de alguna sustancia.' };
    }
    var minimo = Math.min.apply(null, filas.map(function (f) { return f.razon; }));
    filas.forEach(function (f) {
      f.limitante = Math.abs(f.razon - minimo) <= minimo * 1e-9;
      f.molConsumidos = minimo * f.coef;
      f.gConsumidos = f.molConsumidos * f.masaMolar;
      f.gSobrantes = f.limitante ? 0 : Math.max(0, f.gramos - f.gConsumidos);
    });
    var prods = P.map(function (s, k) {
      var M = calcularMasaMolar(s.composicion), mol = minimo * coefP[k];
      return { sustancia: s, masaMolar: M, coef: coefP[k], moles: mol, gramos: M === null ? null : mol * M };
    });
    return { estado: 'ok', reactivos: filas, productos: prods, avance: minimo };
  }

  /* ===========================================================================
     10. ESTADO DEL SIMULADOR
     r1 / r2 / r3: null = sin elegir · '' = "ninguno" · otro = fórmula del banco.
     paso: 0 eligiendo · 1 reacción determinada · 2 ecuación balanceada.
     ======================================================================== */
  var estado = {
    r1: null, r2: null, r3: null,
    opciones: [], variante: 0,
    paso: 0, reaccion: null, R: [], P: [],
    balanceo: null, redox: null, tipo: null, medio: null, estequio: null,
    temporizador: null
  };

  function limpiarResultados() {
    if (estado.temporizador) { clearTimeout(estado.temporizador); estado.temporizador = null; }
    estado.paso = 0; estado.reaccion = null; estado.R = []; estado.P = [];
    estado.balanceo = null; estado.redox = null; estado.tipo = null;
    estado.medio = null; estado.estequio = null;
  }

  function reactivosActuales() { return estado.R; }
  function productosActuales() { return estado.P; }

  function recalcularAnalisis() {
    var R = estado.R, P = estado.P;
    if (!P.length) { estado.redox = null; estado.tipo = null; estado.medio = null; return; }
    var b = estado.balanceo && estado.balanceo.estado === 'ok' ? estado.balanceo : null;
    estado.redox = analizarRedox(R, P, b ? b.coeficientesReactivos : null, b ? b.coeficientesProductos : null);
    estado.tipo = clasificarReaccion(R, P, estado.redox);
    estado.medio = detectarMedio(R);
  }

  function terceros() {
    return estado.r1 && estado.r2 ? CATALOGO.tercerosPosibles(estado.r1, estado.r2) : [];
  }

  /* Reacciones del banco que corresponden a lo elegido (varias = variantes). */
  function calcularOpciones() {
    var t = terceros();
    if (!estado.r1 || estado.r2 === null || (t.length && estado.r3 === null)) return [];
    return CATALOGO.buscarReaccion(estado.r1, estado.r2 || null, estado.r3 || null);
  }

  function porNombre(a, b) { return especie(a.id).nombre.localeCompare(especie(b.id).nombre, 'es'); }
  function aOpciones(lista) {
    return lista.map(function (o) { return { id: o.id, n: o.reacciones }; }).sort(porNombre);
  }
  function opcionesR1() { return aOpciones(CATALOGO.reactivosDisponibles()); }
  function opcionesR2() {
    var c = CATALOGO.reactivosCompatibles(estado.r1), l = aOpciones(c.companeros);
    if (c.soloUno) l.unshift({ id: '', n: c.soloUno });
    return l;
  }
  function opcionesR3() {
    var l = aOpciones(CATALOGO.tercerosPosibles(estado.r1, estado.r2));
    var directas = CATALOGO.buscarReaccion(estado.r1, estado.r2 || null).length;
    if (directas) l.unshift({ id: '', n: directas });
    return l;
  }


  /* ===========================================================================
     11. VISTA
     ======================================================================== */
  var $ = {};

  function el(tag, props, hijos) {
    var n = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (k) {
        var v = props[k];
        if (v === false || v === null || v === undefined) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
        else n.setAttribute(k, v === true ? '' : v);
      });
    }
    (hijos || []).forEach(function (h) {
      if (h === null || h === undefined) return;
      n.appendChild(typeof h === 'string' ? document.createTextNode(h) : h);
    });
    return n;
  }
  function limpiar(n) { while (n.firstChild) n.removeChild(n.firstChild); }

  var RE_CARGA = /^(.*?)(\^\d+[+-]|[+-])$/;

  function formulaNodos(s) {
    var frag = document.createDocumentFragment(), texto = s.formula, carga = '';
    if (s.tipo === 'ion') {
      var m = RE_CARGA.exec(texto);
      if (m) { texto = m[1]; carga = m[2].replace('^', ''); }
    }
    for (var i = 0; i < texto.length; i++) {
      var ch = texto.charAt(i);
      if (/\d/.test(ch)) frag.appendChild(el('sub', { text: ch }));
      else frag.appendChild(document.createTextNode(ch));
    }
    if (carga) {
      var signo = carga.slice(-1) === '-' ? '\u2212' : '+', cifra = carga.slice(0, -1);
      frag.appendChild(el('sup', { text: (cifra === '1' ? '' : cifra) + signo }));
    }
    return frag;
  }

  /* Fórmula como texto plano con Unicode (para semirreacciones y mensajes). */
  function formulaPlana(s) {
    var t = s.formula, c = '';
    if (s.tipo === 'ion') { var m = RE_CARGA.exec(t); if (m) { t = m[1]; c = m[2].replace('^', ''); } }
    t = t.replace(/\d/g, function (d) { return String.fromCharCode(0x2080 + parseInt(d, 10)); });
    if (c) {
      var sg = c.slice(-1) === '-' ? '\u207b' : '\u207a';
      var ci = c.slice(0, -1).replace(/\d/g, function (d) { return '\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079'.charAt(parseInt(d, 10)); });
      t += (ci === '\u00b9' ? '' : ci) + sg;
    }
    return t;
  }

  function parrafo(texto, clase) { return el('p', { class: clase || null, text: texto }); }

  function mostrarMensajes(nodo, tipo, textos) {
    limpiar(nodo);
    if (!textos || !textos.length) { nodo.hidden = true; return; }
    nodo.className = 'rxn-msg rxn-msg--' + tipo;
    textos.forEach(function (t) { nodo.appendChild(el('p', { text: t })); });
    nodo.hidden = false;
  }

  function desplazarA(nodo) {
    if (!nodo || !nodo.scrollIntoView) return;
    var reducir = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nodo.scrollIntoView({ behavior: reducir ? 'auto' : 'smooth', block: 'start' });
  }

  function tarjetaNumerada(num, titulo, subtitulo, clave, pendiente) {
    var cuerpo = el('div', { class: 'rxn-acordeon-cuerpo' }, [el('p', { class: 'rxn-pendiente', text: pendiente })]);
    $[clave] = cuerpo;
    var det = el('details', { class: 'rxn-acordeon rxn-acc-' + num }, [
      el('summary', {}, [
        el('span', { class: 'rxn-num', text: String(num) }),
        el('span', { class: 'rxn-acordeon-textos' }, [
          el('span', { class: 'rxn-acordeon-titulo', text: titulo }),
          el('span', { class: 'rxn-acordeon-sub', text: subtitulo })
        ]),
        el('span', { class: 'rxn-acordeon-mas', 'aria-hidden': 'true' })
      ]),
      cuerpo
    ]);
    $[clave + '-det'] = det;
    return det;
  }

  /* Icono del matraz (SVG propio: no depende de Font Awesome ni de Internet). */
  function iconoMatraz() {
    var NS = 'http://www.w3.org/2000/svg';
    function s(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      return n;
    }
    var svg = s('svg', { viewBox: '0 0 48 48', width: '28', height: '28', 'aria-hidden': 'true', focusable: 'false' });
    svg.appendChild(s('path', { d: 'M19 5h10v3h-2v11.4l10.6 17.5A4.5 4.5 0 0 1 33.8 43H14.2a4.5 4.5 0 0 1-3.8-6.1L21 19.4V8h-2z', fill: '#27AE60' }));
    svg.appendChild(s('path', { d: 'M15.6 31h16.8l3.6 6a1.6 1.6 0 0 1-1.4 2.4H13.4A1.6 1.6 0 0 1 12 37z', fill: '#fff', opacity: '.9' }));
    svg.appendChild(s('circle', { cx: '21', cy: '35', r: '1.8', fill: '#27AE60' }));
    svg.appendChild(s('circle', { cx: '27.5', cy: '33.6', r: '1.3', fill: '#27AE60' }));
    return el('span', { class: 'rxn-logo', 'aria-hidden': 'true' }, [svg]);
  }

  function mostrar(nodo) {
    nodo.hidden = false;
    nodo.classList.remove('rxn-aparece');
    void nodo.offsetWidth;                       // reinicia la animación de entrada
    nodo.classList.add('rxn-aparece');
  }

  function ocultarEtapas() {
    [$.cardRx, $.cardEcuacion, $.cardAnalisis].forEach(function (n) { if (n) n.hidden = true; });
  }

  /* ---------- Selector flotante (hoja inferior con búsqueda; no abre el teclado solo) ---------- */
  function crearSelector(clave, etiqueta, pista, opciones) {
    var valorEl = el('span', { class: 'rxn-sel-valor' });
    var btn = el('button', { type: 'button', class: 'rxn-sel', 'aria-haspopup': 'dialog' }, [
      el('span', { class: 'rxn-sel-et', text: etiqueta }), valorEl,
      el('span', { class: 'rxn-sel-flecha', 'aria-hidden': 'true', text: '\u25BE' })
    ]);
    var sel = { clave: clave, etiqueta: etiqueta, pista: pista, opciones: opciones, btn: btn, valorEl: valorEl };
    btn.addEventListener('click', function () { abrirHoja(sel); });
    return sel;
  }

  function pintarSelector(sel) {
    var v = estado[sel.clave];
    limpiar(sel.valorEl);
    sel.btn.classList.toggle('rxn-sel--lleno', v !== null);
    if (v === null) { sel.valorEl.appendChild(el('span', { class: 'rxn-sel-ph', text: sel.pista })); return; }
    if (v === '') { sel.valorEl.appendChild(el('span', { class: 'rxn-sel-nombre', text: 'Ninguno' })); return; }
    var s = especie(v);
    sel.valorEl.appendChild(el('strong', { class: 'rxn-sel-formula' }, [formulaNodos(s)]));
    if (s.nombre !== s.formula) sel.valorEl.appendChild(el('span', { class: 'rxn-sel-nombre', text: s.nombre }));
  }

  function abrirHoja(sel) {
    if (sel.btn.disabled) return;
    $.selActivo = sel;
    $.hojaOps = sel.opciones();
    $.hojaTit.textContent = sel.etiqueta;
    $.buscar.value = '';
    pintarLista('');
    $.hoja.hidden = false;
    $.panel.focus({ preventScroll: true });      // sin enfocar el buscador: el teclado no se abre solo
    $.lista.scrollTop = 0;
  }

  function cerrarHoja() {
    if ($.hoja.hidden) return;
    $.hoja.hidden = true;
    if ($.selActivo) $.selActivo.btn.focus({ preventScroll: true });
  }

  function pintarLista(texto) {
    var q = normalizar(limpiarEntrada(texto)), sel = $.selActivo, vistos = [];
    limpiar($.lista);
    /* Orden: coincidencia exacta, luego empieza por lo escrito, luego lo contiene (y el orden alfabético). */
    $.hojaOps.forEach(function (o, i) {
      var s = o.id === '' ? null : especie(o.id);
      var f = s ? normalizar(s.formula) : '', nm = s ? normalizar(s.nombre) : '';
      var todo = s ? f + ' ' + nm : 'ninguno sin segundo reactivo reacciona solo';
      if (q && todo.indexOf(q) < 0) return;
      var rango = !q ? 0 : (f === q || nm === q ? 0 : (f.indexOf(q) === 0 || nm.indexOf(q) === 0 ? 1 : 2));
      vistos.push({ o: o, s: s, r: rango, i: i });
    });
    vistos.sort(function (a, b) { return a.r - b.r || a.i - b.i; });
    vistos.forEach(function (v) {
      var o = v.o, s = v.s;
      $.lista.appendChild(el('li', {}, [el('button', {
        type: 'button', class: 'rxn-op' + (estado[sel.clave] === o.id ? ' rxn-op--sel' : ''),
        onclick: function () { cerrarHoja(); elegir(sel.clave, o.id); }
      }, [
        el('span', { class: 'rxn-op-formula' }, s ? [formulaNodos(s)] : ['\u2205']),
        el('span', { class: 'rxn-op-nombre', text: s ? (s.nombre !== s.formula ? s.nombre : '') : 'Ninguno: reacciona solo (calor, catalizador\u2026)' }),
        el('span', { class: 'rxn-op-n', text: o.n + (o.n === 1 ? ' reacción' : ' reacciones') })
      ])]));
    });
    if (!vistos.length) $.lista.appendChild(el('li', { class: 'rxn-op-vacio', text: 'Sin resultados. Prueba con otra fórmula o nombre.' }));
  }

  /* ---------- Indicador de pasos ---------- */
  var NOMBRES_PASOS = ['Reactivos', 'Reacción', 'Balanceo', 'Cálculos'];
  function renderPasos() {
    var p = !estado.opciones.length ? 0 : (estado.paso === 0 ? 1 : (estado.paso === 1 ? 2 :
            (estado.balanceo && estado.balanceo.estado === 'ok' ? (estado.estequio ? 4 : 3) : 2)));
    limpiar($.pasos);
    NOMBRES_PASOS.forEach(function (n, i) {
      $.pasos.appendChild(el('li', { class: 'rxn-paso' + (i < p ? ' rxn-paso--hecho' : (i === p && !(estado.reaccion && !estado.P.length) ? ' rxn-paso--actual' : '')) }, [
        el('span', { class: 'rxn-paso-num', text: i < p ? '\u2713' : String(i + 1) }),
        el('span', { class: 'rxn-paso-nom', text: n })
      ]));
    });
  }

  function construirVista(contenedor) {
    var raiz = el('div', { class: 'rxn-root' });

    raiz.appendChild(el('header', { class: 'rxn-encabezado' }, [
      el('h2', { class: 'rxn-titulo', text: 'Reacciones y estequiometría' }),
      iconoMatraz()
    ]));
    $.pasos = el('ol', { class: 'rxn-pasos', 'aria-label': 'Progreso del simulador' });
    raiz.appendChild($.pasos);

    /* --- Paso 1: elegir reactivos --- */
    $.selR1 = crearSelector('r1', 'Reactivo 1', 'Elegir\u2026', opcionesR1);
    $.selR2 = crearSelector('r2', 'Reactivo 2', 'Elegir\u2026', opcionesR2);
    $.selR3 = crearSelector('r3', 'Reactivo 3', 'Elegir\u2026', opcionesR3);
    $.pistaR2 = el('p', { class: 'rxn-pista' });
    $.filaR3 = el('div', { class: 'rxn-fila-r3', hidden: true }, [
      el('p', { class: 'rxn-pista', text: 'Esta reacción necesita un tercer reactivo.' }), $.selR3.btn
    ]);
    $.variantes = el('div', { class: 'rxn-variantes', hidden: true });
    $.btnDeterminar = el('button', { type: 'button', class: 'rxn-btn rxn-btn--determinar rxn-btn--ancho', onclick: determinar, disabled: true },
      ['\uD83D\uDFE2 Determinar reacción']);
    raiz.appendChild(el('section', { class: 'rxn-card', id: 'rxn-reactivos' }, [
      el('div', { class: 'rxn-card-cab' }, [
        el('h3', { class: 'rxn-card-titulo', text: '1 \u00b7 Elige los reactivos' }),
        el('button', { type: 'button', class: 'rxn-btn-texto', onclick: limpiarTodo }, ['\u21BA Limpiar'])
      ]),
      el('div', { class: 'rxn-sels' }, [$.selR1.btn, el('span', { class: 'rxn-mas', 'aria-hidden': 'true', text: '+' }), $.selR2.btn]),
      $.pistaR2, $.filaR3, $.variantes, $.btnDeterminar
    ]));

    /* --- Paso 2: reacción determinada (productos, categoría, nota) --- */
    $.cuerpoRx = el('div', { class: 'rxn-rx-cuerpo' });
    $.cardRx = el('section', { class: 'rxn-card rxn-card--rx', id: 'rxn-reaccion', hidden: true }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: '2 \u00b7 Reacción determinada' })]),
      $.cuerpoRx
    ]);
    raiz.appendChild($.cardRx);

    /* --- Paso 3: ecuación sin balancear → balanceada + semirreacciones --- */
    $.medio = el('span', { class: 'rxn-medio', hidden: true });
    $.eqSin = el('div', { class: 'rxn-reaccion' });
    $.eqBal = el('div', { class: 'rxn-ecuacion' });
    $.conteo = el('div', { class: 'rxn-conteo' });
    $.msgEcuacion = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
    $.bloqueBal = el('div', { class: 'rxn-eq-bloque rxn-aparece', style: '--i:3' }, [
      el('span', { class: 'rxn-etiqueta', text: 'Balanceada' }), $.eqBal, $.conteo
    ]);
    $.cuerpoSemi = el('div', { class: 'rxn-semi-cuerpo' }, [el('p', { class: 'rxn-pendiente', text: 'Balancea una ecuación para ver las semirreacciones.' })]);
    $.detSemi = el('details', { class: 'rxn-semi' }, [
      el('summary', { class: 'rxn-semi-btn' }, [
        el('span', { class: 'rxn-semi-icono', 'aria-hidden': 'true' }),
        el('span', { class: 'rxn-semi-textos' }, [
          el('span', { class: 'rxn-semi-ver', text: 'Ver semirreacciones' }),
          el('span', { class: 'rxn-semi-ocultar', text: 'Ocultar semirreacciones' }),
          el('span', { class: 'rxn-semi-sub', text: 'Oxidación y reducción con electrones' })
        ])
      ]),
      $.cuerpoSemi
    ]);
    $.cardEcuacion = el('section', { class: 'rxn-card rxn-card--gris', id: 'rxn-resultado', hidden: true }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: '3 \u00b7 Ecuación química' }), $.medio]),
      el('div', { class: 'rxn-eq-bloque rxn-aparece', style: '--i:0' }, [
        el('span', { class: 'rxn-etiqueta', text: 'Sin balancear' }), $.eqSin,
        el('p', { class: 'rxn-dato-sub', text: 'Solo fórmulas: todavía no sabemos cuántas unidades de cada sustancia intervienen.' })
      ]),
      $.bloqueBal, $.msgEcuacion, $.detSemi
    ]);
    raiz.appendChild($.cardEcuacion);

    /* --- Paso 4: análisis y estequiometría (se activa al balancear) --- */
    $.cardAnalisis = el('section', { class: 'rxn-card rxn-card--analisis', id: 'rxn-analisis', hidden: true }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: '4 \u00b7 Análisis y estequiometría' })]),
      el('p', { class: 'rxn-analisis-guia', text: 'Con la ecuación balanceada ya puedes calcular. Toca cada botón de color para abrirlo.' }),
      tarjetaNumerada(1, 'Tipo de reacción', 'Clasificación y análisis redox', 'cuerpo-tipo', 'Se mostrará al determinar la reacción.'),
      tarjetaNumerada(2, 'Estados de oxidación', 'El número de oxidación de cada átomo', 'cuerpo-oxidacion', 'Aún sin datos.'),
      tarjetaNumerada(3, 'Masas molares', 'Cuánto pesa un mol de cada sustancia', 'cuerpo-masas', 'Aún sin datos.'),
      tarjetaNumerada(4, 'Moles y reactivo limitante', 'Gramos \u2192 moles, exceso y producción teórica', 'cuerpo-estequio', 'Primero balancea la ecuación.')
    ]);
    raiz.appendChild($.cardAnalisis);

    /* --- Hoja flotante de selección --- */
    $.hojaTit = el('h3', { class: 'rxn-hoja-titulo' });
    $.buscar = el('input', {
      type: 'search', class: 'rxn-buscar', placeholder: 'Buscar por fórmula o nombre\u2026', autocomplete: 'off',
      autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', 'aria-label': 'Buscar sustancia',
      oninput: function () { pintarLista($.buscar.value); }
    });
    $.lista = el('ul', { class: 'rxn-lista' });
    $.panel = el('div', { class: 'rxn-hoja-panel', tabindex: '-1' }, [
      el('div', { class: 'rxn-hoja-cab' }, [
        $.hojaTit,
        el('button', { type: 'button', class: 'rxn-hoja-x', 'aria-label': 'Cerrar', onclick: cerrarHoja }, ['\u00d7'])
      ]),
      $.buscar, $.lista
    ]);
    $.hoja = el('div', { class: 'rxn-hoja', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Elegir sustancia', hidden: true }, [
      el('div', { class: 'rxn-hoja-fondo', onclick: cerrarHoja }), $.panel
    ]);
    raiz.appendChild($.hoja);

    contenedor.appendChild(raiz);
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrarHoja(); });
  }

  /* ---------- Paso 1: refresco de los selectores ---------- */
  function actualizar() {
    var r1 = estado.r1, c = r1 ? CATALOGO.reactivosCompatibles(r1) : null;
    [$.selR1, $.selR2, $.selR3].forEach(pintarSelector);
    $.selR2.btn.disabled = !r1;
    $.pistaR2.textContent = !r1
      ? 'Elige el Reactivo 1: el Reactivo 2 mostrará solo lo que reacciona con él.'
      : c.companeros.length + (c.companeros.length === 1 ? ' sustancia reacciona' : ' sustancias reaccionan') +
        ' con ' + formulaPlana(especie(r1)) + (c.soloUno ? ' (también hay una reacción sin segundo reactivo)' : '') + '.';
    $.filaR3.hidden = !terceros().length;

    estado.opciones = calcularOpciones();
    if (estado.variante >= estado.opciones.length) estado.variante = 0;
    limpiar($.variantes);
    if (estado.opciones.length > 1) {
      $.variantes.appendChild(el('p', { class: 'rxn-pista', text: 'Hay ' + estado.opciones.length + ' reacciones posibles con estos reactivos. Elige una:' }));
      estado.opciones.forEach(function (o, i) {
        $.variantes.appendChild(el('button', {
          type: 'button', class: 'rxn-variante' + (i === estado.variante ? ' rxn-variante--sel' : ''), 'aria-pressed': i === estado.variante ? 'true' : 'false',
          onclick: function () { estado.variante = i; limpiarResultados(); ocultarEtapas(); actualizar(); }
        }, [o.titulo]));
      });
    }
    $.variantes.hidden = estado.opciones.length < 2;
    $.btnDeterminar.disabled = !estado.opciones.length;
    renderPasos();
  }

  function elegir(clave, id) {
    estado[clave] = id;
    if (clave === 'r1') { estado.r2 = null; estado.r3 = null; }
    if (clave === 'r2') estado.r3 = null;
    estado.variante = 0;
    limpiarResultados(); ocultarEtapas(); actualizar();
  }

  function limpiarTodo() {
    estado.r1 = null; estado.r2 = null; estado.r3 = null; estado.variante = 0;
    limpiarResultados(); ocultarEtapas(); actualizar();
  }

  /* ---------- Paso 2: reacción determinada ---------- */
  function renderReaccion() {
    var rx = estado.reaccion, P = estado.P, i = 0;
    limpiar($.cuerpoRx);
    function bloque(clase, hijos) {
      var n = el('div', { class: 'rxn-bloque rxn-aparece ' + clase, style: '--i:' + (i++) }, hijos);
      $.cuerpoRx.appendChild(n);
      return n;
    }
    bloque('rxn-b-titulo', [el('span', { class: 'rxn-etiqueta', text: 'Reacción identificada' }), el('p', { class: 'rxn-rx-titulo', text: rx.titulo })]);
    if (P.length) {
      bloque('rxn-b-prod', [
        el('span', { class: 'rxn-etiqueta', text: 'Productos esperados' }),
        el('ul', { class: 'rxn-prods' }, P.map(function (s) {
          return el('li', { class: 'rxn-prod' }, [
            el('strong', { class: 'rxn-prod-formula' }, [formulaNodos(s)]),
            s.nombre !== s.formula ? el('span', { class: 'rxn-prod-nombre', text: s.nombre }) : null
          ]);
        }))
      ]);
    } else {
      bloque('rxn-b-sinrx', [el('span', { class: 'rxn-etiqueta', text: 'Resultado' }), el('p', { class: 'rxn-rx-sin', text: 'No hay reacción neta: las sustancias no reaccionan entre sí.' })]);
    }
    bloque('rxn-b-cat', [el('span', { class: 'rxn-etiqueta', text: 'Clasificación' }), el('span', { class: 'rxn-categoria', text: rx.categoria })]);
    bloque('rxn-b-nota', [
      el('span', { class: 'rxn-nota-icono', 'aria-hidden': 'true', text: '\uD83D\uDCA1' }),
      el('div', {}, [el('span', { class: 'rxn-etiqueta', text: 'Observación' }), el('p', { text: rx.nota })])
    ]);
    if (P.length) {
      $.btnBalancear = el('button', { type: 'button', class: 'rxn-btn rxn-btn--balancear rxn-btn--ancho', onclick: balancear }, ['\u2696\uFE0F Balancear ecuación']);
      bloque('rxn-b-accion', [$.btnBalancear]);
    }
  }


  /* ---------- Ecuación ---------- */
  /* Cada especie lleva pegado su "+" (o la flecha, si es el último reactivo):
     así, al saltar de línea en el celular, un "+" nunca queda solo al inicio. */
  function nodoEcuacion(R, coefR, P, coefP) {
    var frag = document.createDocumentFragment();
    function lado(lista, coefs, cierraConFlecha) {
      lista.forEach(function (s, i) {
        var grupo = el('span', { class: 'rxn-eq-esp' });
        if (coefs && coefs[i] !== 1) grupo.appendChild(el('span', { class: 'rxn-eq-coef', text: String(coefs[i]) }));
        grupo.appendChild(el('span', {}, [formulaNodos(s)]));
        if (i < lista.length - 1) grupo.appendChild(el('span', { class: 'rxn-eq-signo', text: '+' }));
        else if (cierraConFlecha) grupo.appendChild(el('span', { class: 'rxn-eq-flecha', text: '\u2192' }));
        frag.appendChild(grupo);
      });
    }
    lado(R, coefR, true);
    lado(P, coefP, false);
    return frag;
  }


  /* ---------- Paso 3: ecuaciones ---------- */
  var FUENTES = {
    'banco+matriz': ['exito', '\u2713 Coeficientes del banco de reacciones, confirmados por el balanceador matricial.'],
    'banco': ['exito', '\u2713 Coeficientes del banco de reacciones; átomos y cargas verificados.'],
    'matriz': ['aviso', 'Los coeficientes del banco no cerraban; se muestran los calculados por el balanceador matricial.'],
    'banco-sin-verificar': ['aviso', 'Coeficientes tomados del banco. Esta ecuación incluye una especie sin composición fija (por ejemplo un polímero con \u201cn\u201d), así que no se pudo verificar con la matriz.']
  };

  function renderEcuacion() {
    var b = estado.balanceo, R = estado.R, P = estado.P;
    limpiar($.eqSin); limpiar($.eqBal); limpiar($.conteo);
    $.eqSin.appendChild(nodoEcuacion(R, null, P, null));
    var ok = !!(b && b.estado === 'ok' && b.conservacion && b.conservacion.atomos && b.conservacion.carga);
    $.bloqueBal.hidden = !ok;
    if (ok) {
      $.eqBal.appendChild(nodoEcuacion(R, b.coeficientesReactivos, P, b.coeficientesProductos));
      $.medio.textContent = '\u270f\ufe0f Medio: ' + estado.medio;
      $.medio.hidden = false;
      var c = b.conservacion;
      if (c.izquierda) {
        Object.keys(c.izquierda.atomos).forEach(function (e) {
          $.conteo.appendChild(el('span', { class: 'rxn-at' }, [e + ' ', el('b', { text: String(c.izquierda.atomos[e]) }), ' = ', el('b', { text: String(c.derecha.atomos[e] || 0) }), ' \u2713']));
        });
        if (c.izquierda.carga || c.derecha.carga) {
          $.conteo.appendChild(el('span', { class: 'rxn-at' }, ['carga ', el('b', { text: formatoSigno(c.izquierda.carga) }), ' = ', el('b', { text: formatoSigno(c.derecha.carga) }), ' \u2713']));
        }
      }
      var f = FUENTES[b.fuente] || FUENTES.banco;
      mostrarMensajes($.msgEcuacion, f[0], [f[1]]);
    } else {
      $.medio.hidden = true;
      mostrarMensajes($.msgEcuacion, 'error', [b && b.mensaje ? b.mensaje : 'El balanceo no superó la verificación de conservación, por eso no se muestra.']);
    }
    renderSemirreacciones();
  }


  function textoCambio(c) {
    var at = c.atomos === null ? '' : (c.atomos === 1 ? '' : c.atomos + ' ');
    var e = c.elemento, de = '(' + formatoSigno(c.de) + ')', a = '(' + formatoSigno(c.a) + ')';
    var ne = c.electrones === null ? c.electronesPorAtomo : c.electrones;
    var ele = (ne === 1 ? '' : ne + ' ') + 'e\u207b';
    return c.tipo === 'oxidacion'
      ? at + e + de + ' \u2192 ' + at + e + a + ' + ' + ele
      : at + e + de + ' + ' + ele + ' \u2192 ' + at + e + a;
  }

  function renderSemirreacciones() {
    limpiar($.cuerpoSemi);
    var b = estado.balanceo, rx = estado.redox;
    if (!b || b.estado !== 'ok' || !rx) {
      $.cuerpoSemi.appendChild(parrafo('Balancea una ecuación para ver las semirreacciones.', 'rxn-pendiente')); return;
    }
    if (rx.estado !== 'ok') { $.cuerpoSemi.appendChild(parrafo(rx.mensaje, 'rxn-pendiente')); return; }
    if (!rx.esRedox) { $.cuerpoSemi.appendChild(parrafo('Esta reacción no es redox: ningún número de oxidación cambia, así que no hay semirreacciones.', 'rxn-pendiente')); return; }

    var ox = rx.cambios.filter(function (c) { return c.tipo === 'oxidacion'; });
    var re = rx.cambios.filter(function (c) { return c.tipo === 'reduccion'; });
    function bloque(titulo, lista, clase) {
      $.cuerpoSemi.appendChild(el('p', { class: 'rxn-semi-tit ' + clase, text: titulo }));
      lista.forEach(function (c) { $.cuerpoSemi.appendChild(el('p', { class: 'rxn-semi-eq', text: textoCambio(c) })); });
    }
    if (ox.length) bloque('Oxidación (pierde electrones)', ox, 'rxn-semi-ox');
    if (re.length) bloque('Reducción (gana electrones)', re, 'rxn-semi-re');
    if (rx.electronesCedidos !== null) {
      $.cuerpoSemi.appendChild(parrafo(rx.electronesIguales
        ? '\u2713 Electrones cedidos = electrones ganados = ' + rx.electronesCedidos + '.'
        : 'Electrones cedidos: ' + rx.electronesCedidos + ' \u00b7 ganados: ' + rx.electronesGanados + '. No coinciden; revisa si hay más de un elemento que cambia.', 'rxn-semi-total'));
    }
    $.cuerpoSemi.appendChild(parrafo('Notación: el número entre paréntesis es el estado de oxidación. Están escritas a nivel de átomos; no incluyen H\u207a ni H\u2082O del método ion-electrón completo.', 'rxn-semi-nota'));
  }

  /* ---------- Acordeones de análisis ---------- */
  function badgeOx(simbolo, n, marca) {
    var cls = n > 0 ? 'rxn-ox--pos' : (n < 0 ? 'rxn-ox--neg' : 'rxn-ox--cero');
    if (marca) cls += ' rxn-ox--cambia rxn-ox--' + marca;
    var hijos = [simbolo + ' ', el('b', { text: formatoSigno(n) })];
    if (marca) hijos.push(el('span', { class: 'rxn-ox-marca', text: marca === 'oxidacion' ? '\u2191 se oxida' : '\u2193 se reduce' }));
    return el('span', { class: 'rxn-ox ' + cls }, hijos);
  }

  function renderAnalisis() {
    var R = reactivosActuales(), P = productosActuales();

    /* 1. Tipo */
    var t = $['cuerpo-tipo']; limpiar(t);
    if (!estado.tipo) t.appendChild(parrafo('Se mostrará al determinar la reacción.', 'rxn-pendiente'));
    else {
      t.appendChild(el('p', { class: 'rxn-etiqueta', text: 'Esta reacción es de tipo:' }));
      t.appendChild(el('p', { class: 'rxn-dato-fuerte', text: estado.tipo.nombre }));
      t.appendChild(parrafo(estado.tipo.texto));
      if (estado.tipo.nota) t.appendChild(parrafo(estado.tipo.nota, 'rxn-nota'));
      if (estado.reaccion) t.appendChild(parrafo('Categoría en el banco de reacciones: ' + estado.reaccion.categoria + '.', 'rxn-dato-sub'));
    }

    /* Análisis redox: ahora dentro del bloque 1 (Tipo de reacción) */
    var x = el('div', { class: 'rxn-redox-bloque' });
    x.appendChild(el('p', { class: 'rxn-subtitulo', text: 'Análisis redox' }));
    t.appendChild(x);
    var rx = estado.redox;
    if (!rx) t.removeChild(x);
    else if (rx.estado !== 'ok') x.appendChild(parrafo(rx.mensaje, 'rxn-pendiente'));
    else if (!rx.esRedox) {
      x.appendChild(parrafo('No es una reacción redox: ningún elemento cambia su número de oxidación.'));
      if (rx.complejos.length) x.appendChild(parrafo('Atención: ' + rx.complejos.join(', ') + ' cambia de forma compleja y no se pudo analizar.', 'rxn-nota'));
    } else {
      x.appendChild(parrafo('Oxidarse = perder electrones (el número de oxidación sube). Reducirse = ganar electrones (baja).', 'rxn-dato-sub'));
      rx.cambios.forEach(function (c) {
        var et = c.tipo === 'oxidacion' ? 'Se oxida' : 'Se reduce';
        var verbo = c.tipo === 'oxidacion' ? 'pierde' : 'gana';
        x.appendChild(el('p', { class: 'rxn-redox-linea' }, [
          el('b', { text: et + ': ' }), c.elemento + ' (' + formatoSigno(c.de) + ' \u2192 ' + formatoSigno(c.a) + ') \u00b7 ' + verbo + ' ' + c.electronesPorAtomo + ' e\u207b por átomo'
        ]));
      });
      function nombres(l) { return l.map(function (s) { return formulaPlana(s) + ' (' + s.nombre + ')'; }).join(', '); }
      if (rx.oxidantes.length) x.appendChild(el('p', { class: 'rxn-agente rxn-agente--ox' }, [el('b', { text: 'Agente oxidante: ' }), nombres(rx.oxidantes), el('span', { class: 'rxn-dato-sub', text: ' \u2014 contiene lo que se reduce, y por eso hace que otra sustancia se oxide.' })]));
      if (rx.reductores.length) x.appendChild(el('p', { class: 'rxn-agente rxn-agente--re' }, [el('b', { text: 'Agente reductor: ' }), nombres(rx.reductores), el('span', { class: 'rxn-dato-sub', text: ' \u2014 contiene lo que se oxida, y por eso hace que otra sustancia se reduzca.' })]));
      if (rx.complejos.length) x.appendChild(parrafo('Atención: ' + rx.complejos.join(', ') + ' cambia de forma compleja y no se incluyó.', 'rxn-nota'));
    }

    /* 3. Estados de oxidación */
    var o = $['cuerpo-oxidacion']; limpiar(o);
    if (!R.length) o.appendChild(parrafo('Agrega reactivos para ver sus números de oxidación.', 'rxn-pendiente'));
    else {
      var cambia = {};
      if (estado.redox && estado.redox.estado === 'ok') {
        estado.redox.cambios.forEach(function (c) {
          c.reactivos.concat(c.productos).forEach(function (s) { cambia[s.id + '|' + c.elemento] = c.tipo; });
        });
      }
      function listaOx(titulo, lista) {
        if (!lista.length) return;
        o.appendChild(el('p', { class: 'rxn-subtitulo', text: titulo }));
        lista.forEach(function (s) {
          var fila = el('div', { class: 'rxn-ox-fila' }, [el('div', { class: 'rxn-ox-esp' }, [el('strong', {}, [formulaNodos(s)]), ' ' + s.nombre])]);
          var badges = el('div', { class: 'rxn-ox-lista' });
          if (!s.estadosAsignados) badges.appendChild(el('span', { class: 'rxn-dato-sub', text: 'sin datos en el catálogo' }));
          else Object.keys(s.composicion).forEach(function (sim) { badges.appendChild(badgeOx(sim, s.estadosAsignados[sim], cambia[s.id + '|' + sim])); });
          fila.appendChild(badges); o.appendChild(fila);
        });
      }
      listaOx('Reactivos', R); listaOx('Productos', P);
      if (Object.keys(cambia).length) o.appendChild(parrafo('Los átomos marcados con \u2191 o \u2193 son los que cambian de número de oxidación durante la reacción.', 'rxn-nota'));
      o.appendChild(parrafo('Son los números asignados dentro de cada sustancia (no todos los que el elemento podría tener).', 'rxn-dato-sub'));
    }

    /* 4. Masas molares */
    var mm = $['cuerpo-masas']; limpiar(mm);
    if (!R.length) mm.appendChild(parrafo('Agrega reactivos para ver sus masas molares.', 'rxn-pendiente'));
    else {
      var tabla = el('table', { class: 'rxn-tabla' }, [el('thead', {}, [el('tr', {}, [el('th', { text: 'Sustancia' }), el('th', { text: 'Masa molar' })])])]);
      var cuerpo = el('tbody');
      function filaMasa(s, rol) {
        var M = calcularMasaMolar(s.composicion);
        var desglose = !s.composicion ? 'sin composición fija en el catálogo' : Object.keys(s.composicion).map(function (sim) {
          var e = CATALOGO.elementos[sim];
          return sim + ' ' + formatoNum(e.masaAtomica, 3) + ' \u00d7 ' + s.composicion[sim];
        }).join(' + ');
        cuerpo.appendChild(el('tr', {}, [
          el('td', {}, [el('strong', {}, [formulaNodos(s)]), el('span', { class: 'rxn-rol', text: rol }), el('div', { class: 'rxn-dato-sub', text: desglose })]),
          el('td', { class: 'rxn-num-celda', text: M === null ? 'sin datos' : formatoNum(M, 3) + ' g/mol' })
        ]));
      }
      R.forEach(function (s) { filaMasa(s, 'reactivo'); });
      P.forEach(function (s) { filaMasa(s, 'producto'); });
      tabla.appendChild(cuerpo);
      mm.appendChild(el('div', { class: 'rxn-tabla-wrap' }, [tabla]));
      mm.appendChild(parrafo('Masa molar = suma de (masa atómica \u00d7 número de átomos) de cada elemento.', 'rxn-dato-sub'));
    }

    renderEstequio();
  }

  function renderEstequio() {
    var c = $['cuerpo-estequio']; limpiar(c);
    var b = estado.balanceo;
    if (!b || b.estado !== 'ok' || !b.conservacion || !b.conservacion.atomos || !b.conservacion.carga) {
      c.appendChild(parrafo('Primero balancea la ecuación.', 'rxn-pendiente')); return;
    }
    var R = reactivosActuales();
    c.appendChild(parrafo('Escribe cuántos gramos tienes de cada reactivo:'));
    $.camposMasa = [];
    R.forEach(function (s) {
      var M = calcularMasaMolar(s.composicion);
      var inp = el('input', { type: 'number', inputmode: 'decimal', min: '0', step: 'any', class: 'rxn-input rxn-input--masa', placeholder: 'g', 'aria-label': 'Gramos de ' + s.nombre });
      $.camposMasa.push(inp);
      c.appendChild(el('label', { class: 'rxn-masa-fila' }, [
        el('span', { class: 'rxn-masa-et' }, [el('strong', {}, [formulaNodos(s)]), el('span', { class: 'rxn-dato-sub', text: M === null ? '' : ' ' + formatoNum(M, 2) + ' g/mol' })]),
        inp, el('span', { class: 'rxn-masa-u', text: 'g' })
      ]));
    });
    $.msgEstequio = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
    $.resEstequio = el('div', { class: 'rxn-res-estequio' });
    c.appendChild($.msgEstequio);
    c.appendChild(el('button', { type: 'button', class: 'rxn-btn rxn-btn--primario rxn-btn--ancho', onclick: calcularLimitante }, ['Calcular reactivo limitante']));
    c.appendChild($.resEstequio);
    if (estado.estequio) renderResultadoEstequio();
  }

  function renderResultadoEstequio() {
    var r = estado.estequio; limpiar($.resEstequio);
    if (!r || r.estado !== 'ok') return;
    var lim = r.reactivos.filter(function (f) { return f.limitante; });
    var exc = r.reactivos.filter(function (f) { return !f.limitante; });
    function nombres(l) { return l.map(function (f) { return formulaPlana(f.sustancia); }).join(', '); }

    function tarjetaRes(clase, titulo, principal, detalle) {
      return el('div', { class: 'rxn-res rxn-res--' + clase }, [
        el('span', { class: 'rxn-res-tit', text: titulo }),
        el('span', { class: 'rxn-res-val', text: principal }),
        detalle ? el('span', { class: 'rxn-res-det', text: detalle }) : null
      ]);
    }
    var resumen = el('div', { class: 'rxn-resumen' });
    resumen.appendChild(tarjetaRes('lim', 'Reactivo limitante', nombres(lim) || '\u2014', 'Se acaba primero y detiene la reacción.'));
    resumen.appendChild(tarjetaRes('exc', 'Reactivo en exceso',
      exc.length ? nombres(exc) : 'Ninguno',
      exc.length ? exc.map(function (f) { return formulaPlana(f.sustancia) + ': sobran ' + formatoNum(f.gSobrantes, 3) + ' g'; }).join(' \u00b7 ')
                 : 'Las cantidades son exactamente proporcionales.'));
    r.productos.forEach(function (p) {
      resumen.appendChild(tarjetaRes('prod', 'Producción teórica de ' + formulaPlana(p.sustancia),
        p.gramos === null ? 'sin datos' : formatoNum(p.gramos, 3) + ' g', formatoNum(p.moles, 4) + ' mol'));
    });
    $.resEstequio.appendChild(resumen);

    var t = el('table', { class: 'rxn-tabla' }, [el('thead', {}, [el('tr', {}, [
      el('th', { text: 'Reactivo' }), el('th', { text: 'mol' }), el('th', { text: 'mol \u00f7 coef.' }), el('th', { text: 'Consume (g)' })
    ])])]);
    var tb = el('tbody');
    r.reactivos.forEach(function (f) {
      tb.appendChild(el('tr', { class: f.limitante ? 'rxn-fila-lim' : null }, [
        el('td', {}, [el('strong', {}, [formulaNodos(f.sustancia)]), f.limitante ? el('span', { class: 'rxn-rol rxn-rol--lim', text: 'limitante' }) : null]),
        el('td', { class: 'rxn-num-celda', text: formatoNum(f.moles, 4) }),
        el('td', { class: 'rxn-num-celda', text: formatoNum(f.razon, 4) }),
        el('td', { class: 'rxn-num-celda', text: formatoNum(f.gConsumidos, 3) })
      ]));
    });
    t.appendChild(tb);
    $.resEstequio.appendChild(el('div', { class: 'rxn-tabla-wrap' }, [t]));
    $.resEstequio.appendChild(parrafo('Cómo se decide: moles = gramos \u00f7 masa molar. El que tenga el menor valor de (moles \u00f7 coeficiente) es el limitante.', 'rxn-dato-sub'));
  }

  /* ===========================================================================
     12. ACCIONES DEL USUARIO
     ======================================================================== */
  /* Paso 2: 🟢 Determinar reacción (sin mostrar todavía la ecuación completa). */
  function determinar() {
    var rx = estado.opciones[estado.variante];
    if (!rx) return;
    limpiarResultados(); ocultarEtapas();
    estado.reaccion = rx;
    estado.R = rx.reactivos.map(especie);
    estado.P = rx.productos.map(especie);
    estado.paso = 1;
    recalcularAnalisis();
    renderReaccion();
    mostrar($.cardRx);
    renderPasos();
    desplazarA($.cardRx);
  }

  /* Paso 3: ⚖️ Balancear ecuación → sin balancear, luego balanceada; después se activa el paso 4. */
  function balancear() {
    if (!estado.reaccion || !estado.P.length) return;
    estado.balanceo = obtenerBalanceo(estado.reaccion, estado.R, estado.P);
    estado.estequio = null; estado.paso = 2;
    recalcularAnalisis();
    renderEcuacion(); renderAnalisis();
    mostrar($.cardEcuacion);
    $.btnBalancear.disabled = true;
    $.btnBalancear.textContent = '\u2713 Ecuación balanceada';
    if (estado.temporizador) clearTimeout(estado.temporizador);
    if (estado.balanceo.estado === 'ok') {
      var reducir = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
      estado.temporizador = setTimeout(function () { estado.temporizador = null; mostrar($.cardAnalisis); }, reducir ? 0 : CONFIG.retrasoAnalisis);
    }
    renderPasos();
    desplazarA($.cardEcuacion);
  }


  function calcularLimitante() {
    var b = estado.balanceo;
    if (!b || b.estado !== 'ok') return;
    var R = reactivosActuales(), P = productosActuales(), gramos = [], faltan = [];
    R.forEach(function (s, i) {
      var v = parseFloat(String($.camposMasa[i].value).replace(',', '.'));
      if (!(v > 0)) faltan.push(formulaPlana(s)); else gramos.push(v);
    });
    if (faltan.length) {
      mostrarMensajes($.msgEstequio, 'error', ['Escribe una masa mayor que 0 para: ' + faltan.join(', ') + '.']);
      limpiar($.resEstequio); estado.estequio = null; return;
    }
    var r = calcularEstequiometria(R, P, b.coeficientesReactivos, b.coeficientesProductos, gramos);
    if (r.estado !== 'ok') { mostrarMensajes($.msgEstequio, 'error', [r.mensaje]); return; }
    mostrarMensajes($.msgEstequio, 'info', []);
    estado.estequio = r;
    renderResultadoEstequio();
    $['cuerpo-estequio-det'].open = true;
    desplazarA($.resEstequio);
  }

  /* ===========================================================================
     13. INICIO Y API
     ======================================================================== */
  function iniciar() {
    var contenedor = document.getElementById(CONFIG.idContenedor);
    if (!contenedor) { console.warn('[Reacciones] No se encontró #' + CONFIG.idContenedor + '.'); return; }
    if (!CATALOGO || !CATALOGO.buscarReaccion) { console.error('[Reacciones] formulas.js (v1.1 con el banco de reacciones) no está cargado; se conserva el contenido original.'); return; }
    try {
      construirIndice();
      var problemas = verificarCatalogo();
      if (problemas.length) console.warn('[Reacciones] Problemas en el catálogo:\n' + problemas.join('\n'));
      var temporal = document.createElement('div');
      construirVista(temporal);
      limpiar(contenedor);
      while (temporal.firstChild) contenedor.appendChild(temporal.firstChild);
      actualizar();
    } catch (err) {
      console.error('[Reacciones] Error al construir la pestaña:', err);
    }
  }

  /* Para pruebas (consola o Node): construirIndice() antes de usar el resto. */
  var API = {
    config: CONFIG,
    iniciarIndice: construirIndice,
    parsearFormula: parsearFormula, validarFormula: validarFormula,
    resolverToken: resolverToken, especie: especie,
    calcularMasaMolar: calcularMasaMolar,
    balancearEcuacion: balancearEcuacion, verificarConservacion: verificarConservacion,
    obtenerBalanceo: obtenerBalanceo,
    analizarRedox: analizarRedox, clasificarReaccion: clasificarReaccion, detectarMedio: detectarMedio,
    calcularEstequiometria: calcularEstequiometria,
    verificarCatalogo: verificarCatalogo, buscarSustancias: buscarSustancias,
    obtenerSustancia: obtenerSustancia
  };
  global.ReaccionesUPDS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
  }
})(typeof window !== 'undefined' ? window : globalThis);
