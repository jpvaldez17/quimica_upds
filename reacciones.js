/* =============================================================================
   reacciones.js — Pestaña "Reacciones químicas y estequiometría" · QuímicApp
   Versión 4.2 · SIMULADOR PASO A PASO (usa formulas.js v1.2 y su BANCO_REACCIONES).
   Flujo: 1) escribir/elegir reactivos con búsqueda encadenada  2) «Determinar reacción»:
   productos esperados + clasificación + observación del banco  3) «Balancear ecuación»:
   ecuación con coeficientes  4) paneles de masas molares, moles y estequiometría.
   Versión 3.4 (usa el motor de formulas.js v1.0; rediseño: chips compactos, reacción completa en negro,
   ecuación balanceada en gris, acordeones de análisis llamativos)

   Depende ÚNICAMENTE de formulas.js (window.FORMULAS_REACCIONES / CATALOGO).
   No usa Internet ni librerías externas. No modifica otras pestañas.

   Todas las fórmulas, masas atómicas y estados de oxidación se leen del
   catálogo. Aquí no se escribe ningún dato químico "a mano": solo reglas de
   comportamiento (qué productos se forman con qué reactivos) que refieren a
   sustancias del catálogo por su identificador.

   SECCIONES
    1. Configuración
    2. Utilidades
    3. Catálogo (índice, búsqueda, verificación)
    4. Fórmulas y lectura de la entrada del usuario
    5. Masas molares
    6. Clasificación ácido-base
    7. Balanceo (independiente de la predicción)
    8. Análisis: medio, redox, tipo de reacción
    9. Estequiometría (reactivo limitante)
   10. Estado de la pestaña
   11. Vista (DOM)
   12. Acciones del usuario
   13. Inicio y API pública
   ========================================================================== */

(function (global) {
  'use strict';

  /* ===========================================================================
     1. CONFIGURACIÓN
     ======================================================================== */
  var CONFIG = {
    limiteReactivos: 5,
    limiteProductos: 5,
    maxSugerencias: 6,
    idContenedor: 'reacciones'
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
      .replace(/->|=>|\u27f6|\u2192|\s=\s/g, '\u2192');   // CH2=CH2 conserva su doble enlace
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

  /* --- Sustancias del banco de reacciones ---------------------------------
     El banco usa más sustancias que el catálogo. Las que el catálogo no tiene se
     resuelven con la tabla periódica (formulas.js) y, si ni así se pueden analizar
     (polímeros, iones complejos), se muestran tal cual, sin composición. */
  var IDS_BANCO = null;
  function idsDelBanco() {
    if (IDS_BANCO) return IDS_BANCO;
    IDS_BANCO = {};
    ((CATALOGO && CATALOGO.BANCO_REACCIONES) || []).forEach(function (r) {
      r.reactivos.concat(r.productos).forEach(function (id) { IDS_BANCO[id] = true; });
    });
    return IDS_BANCO;
  }

  function sustanciaDeBanco(id) {
    if (INDICE[id]) return INDICE[id];
    var din = CATALOGO && CATALOGO.resolverFormula ? CATALOGO.resolverFormula(id) : null;
    if (din) { INDICE[din.id] = din; return din; }
    var carga = CATALOGO && CATALOGO.separarCarga ? CATALOGO.separarCarga(id).carga : 0;
    var extra = (CATALOGO && CATALOGO.nombresBanco && CATALOGO.nombresBanco[id]) || 'Sustancia del banco';
    INDICE[id] = { id: id, tipo: carga ? 'ion' : 'compuesto', formula: id, nombre: extra, composicion: {},
                   carga: carga, clasificacion: '', estadosAsignados: null, sinComposicion: true, datoDePrueba: false };
    return INDICE[id];
  }

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
    if (idsDelBanco()[t]) return { sustancia: sustanciaDeBanco(t), interpretado: false };
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
     4. FÓRMULAS Y ENTRADA DEL USUARIO
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

  /* Divide un lado de la ecuación en términos. Un "+" separa términos cuando
     tiene espacios alrededor ("A + B"); también se acepta "A+B" si el texto
     completo no es una especie del catálogo (así "Na+" sigue siendo un ion). */
  function dividirTerminos(lado) {
    var out = [];
    lado.split(/\s+\+\s+/).forEach(function (p) {
      p = p.trim();
      if (!p) return;
      if (resolverToken(p) || p.indexOf('+') < 0) { out.push(p); return; }
      p.split('+').forEach(function (q) { q = q.trim(); if (q) out.push(q); });
    });
    return out;
  }

  /* Lee lo que escribió la persona: "A + B" o "A + B → C + D".
     Devuelve los términos, qué sustancia es cada uno y los errores didácticos. */
  function parsearEntrada(texto) {
    var t = limpiarEntrada(texto);
    var res = { reactivos: [], productos: [], flecha: false, errores: [], avisos: [], estado: 'vacio' };
    if (!t.trim()) return res;

    var partes = t.split('\u2192');
    if (partes.length > 2) {
      res.errores.push('Solo puede haber una flecha (\u2192) en la ecuación.');
    }
    res.flecha = partes.length > 1;
    if (res.flecha) res.errores.push('Escribe solo los reactivos, separados por +. Los productos los determina el simulador.');

    function leer(lado) {
      return dividirTerminos(lado || '').map(function (txt) {
        var r = resolverToken(txt);
        return { texto: txt, sustancia: r ? r.sustancia : null, interpretado: r ? r.interpretado : false };
      });
    }
    res.reactivos = leer(partes[0]);
    res.productos = res.flecha ? leer(partes.slice(1).join(' ')) : [];

    function revisarLado(lista, nombreLado, limite) {
      var vistos = [];
      lista.forEach(function (tk) {
        if (!tk.sustancia) {
          var v = validarFormula(tk.texto);
          if (v.ok) {
            res.errores.push('\u00ab' + tk.texto + '\u00bb es una fórmula bien escrita, pero todavía no está en el catálogo.');
          } else if (v.desconocidos) {
            res.errores.push('\u00ab' + tk.texto + '\u00bb: ' + v.error);
          } else {
            res.errores.push('\u00ab' + tk.texto + '\u00bb no se reconoce. ' + v.error +
              ' Recuerda: la primera letra de cada elemento va en mayúscula (Co es cobalto, CO es monóxido de carbono).');
          }
        } else {
          if (vistos.indexOf(tk.sustancia.id) >= 0) {
            res.errores.push(tk.sustancia.nombre + ' está repetido en los ' + nombreLado + '. Escríbelo una sola vez.');
          }
          vistos.push(tk.sustancia.id);
          if (tk.interpretado) {
            res.avisos.push('\u00ab' + tk.texto + '\u00bb se interpretó como ' + tk.sustancia.formula + ' (' + tk.sustancia.nombre + ').');
          }
        }
      });
      if (lista.length > limite) {
        res.errores.push('Máximo ' + limite + ' ' + nombreLado + '. Quita ' + (lista.length - limite) + '.');
      }
    }
    revisarLado(res.reactivos, 'reactivos', CONFIG.limiteReactivos);
    if (res.flecha) {
      if (!res.productos.length) res.errores.push('Escribe los productos después de la flecha \u2192, o quítala para que la app los proponga.');
      revisarLado(res.productos, 'productos', CONFIG.limiteProductos);
    }
    if (!res.reactivos.length && res.flecha) res.errores.push('Falta escribir al menos un reactivo antes de la flecha.');

    res.estado = res.errores.length ? 'error' : 'ok';
    return res;
  }

  /* ===========================================================================
     5. MASAS MOLARES
     ======================================================================== */
  function calcularMasaMolar(composicion) {
    if (!CATALOGO) return null;
    var total = 0, claves = Object.keys(composicion);
    if (!claves.length) return null;
    for (var k = 0; k < claves.length; k++) {
      var e = CATALOGO.elementos[claves[k]];
      if (!e || typeof e.masaAtomica !== 'number') return null;
      total += e.masaAtomica * composicion[claves[k]];
    }
    return total;
  }

  /* ===========================================================================
     6. CLASIFICACIÓN ÁCIDO-BASE
     (Los productos ya no se predicen aquí: salen del banco de reacciones de formulas.js.)
     ======================================================================== */
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
     10. ESTADO
     ======================================================================== */
  var estado = {
    entrada: parsearEntradaVacia(),
    productos: [],       // ids
    origen: null,        // 'banco'
    nombreRegla: '',
    reaccion: null,      // fila elegida del BANCO_REACCIONES
    variantes: [],       // todas las filas del banco para esos reactivos
    paso: 0,             // 0 = nada · 1 = reacción determinada · 2 = ecuación balanceada
    llave: null,         // evita repetir animaciones al volver a pintar lo mismo
    balanceo: null,
    redox: null,
    tipo: null,
    medio: null,
    estequio: null
  };

  function parsearEntradaVacia() {
    return { reactivos: [], productos: [], flecha: false, errores: [], avisos: [], estado: 'vacio' };
  }

  function invalidarResultados() {
    estado.productos = []; estado.origen = null; estado.nombreRegla = '';
    estado.reaccion = null; estado.variantes = []; estado.paso = 0;
    estado.balanceo = null; estado.redox = null; estado.tipo = null;
    estado.medio = null; estado.estequio = null;
  }

  /* Con una reacción determinada, los reactivos van en el orden del banco (así
     coinciden con sus coeficientes); antes, en el orden en que los escribió la persona. */
  function reactivosActuales() {
    if (estado.reaccion) return estado.reaccion.reactivos.map(sustanciaDeBanco);
    return estado.entrada.reactivos.filter(function (t) { return t.sustancia; })
      .map(function (t) { return t.sustancia; });
  }
  function productosActuales() { return estado.productos.map(sustanciaDeBanco); }

  function recalcularAnalisis() {
    var R = reactivosActuales(), P = productosActuales();
    if (!P.length) { estado.redox = null; estado.tipo = null; estado.medio = null; return; }
    var b = estado.balanceo && estado.balanceo.estado === 'ok' ? estado.balanceo : null;
    estado.redox = analizarRedox(R, P, b ? b.coeficientesReactivos : null, b ? b.coeficientesProductos : null);
    estado.tipo = clasificarReaccion(R, P, estado.redox);
    estado.medio = detectarMedio(R);
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

  /* Icono ? de Ayuda (SVG propio: se ve aunque Font Awesome no cargue). Usa el color del texto. */
  function iconoAyuda() {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('width', '15'); svg.setAttribute('height', '15');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    var c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', '12'); c.setAttribute('cy', '12'); c.setAttribute('r', '11'); c.setAttribute('fill', 'currentColor');
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', 'M9.2 9.3a2.9 2.9 0 1 1 4.4 2.5c-.9.6-1.6 1.1-1.6 2.2M12 17.2v.1');
    p.setAttribute('fill', 'none'); p.setAttribute('stroke', '#fff'); p.setAttribute('stroke-width', '2.4'); p.setAttribute('stroke-linecap', 'round');
    svg.appendChild(c); svg.appendChild(p);
    return svg;
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

  /* Casos de práctica: todos existen en el banco de reacciones de formulas.js. */
  var CASOS_PRACTICA = [
    ['H2', 'O2'], ['N2', 'H2'], ['Mg', 'O2'], ['Na', 'Cl2'], ['Zn', 'HCl'],
    ['HCl', 'NaOH'], ['H2SO4', 'NaOH'], ['AgNO3', 'NaCl'], ['Fe', 'CuSO4'], ['MnO4-', 'Fe^2+', 'H+']
  ];

  /* Reacciones reversibles (⇌): el banco las marca en la observación o son bien conocidas. */
  var IDS_REVERSIBLES = [5, 20];
  function esReversible(r) {
    if (!r) return false;
    if (IDS_REVERSIBLES.indexOf(r.id) >= 0) return true;
    return /equilibrio|reversible|esterificaci|disociaci/i.test((r.nota || '') + ' ' + (r.titulo || ''));
  }

  function probarCaso(ids) {
    $.input.value = ids.join(' + ');
    alEscribir(true);
    determinarReaccion();
  }

  /* Estilos del encabezado y de los casos de práctica (se inyectan al iniciar; ganan a cualquier CSS antiguo). */
  var estilosEncabezado = `/* ---- Encabezado (mismo estilo que Enlaces): título + Ayuda + icono -------------- */
#reacciones .rxn-root .rxn-encabezado { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 0; }
#reacciones .rxn-root .rxn-titulo { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.2; color: #2b2f36; text-align: left; }
#reacciones .rxn-root .rxn-cab-d { flex: 0 0 auto; display: flex; align-items: center; gap: 8px; }
#reacciones .rxn-root .rxn-logo {
  flex: 0 0 auto;
  display: inline-flex; align-items: center; justify-content: center;
  width: 38px; height: 38px;
  background: var(--rxn-verde-fondo);
  border: 0;
  border-radius: 12px;
}
#reacciones .rxn-root .rxn-logo svg { width: 24px; height: 24px; }

/* Botón Ayuda: idéntico al de Enlaces (naranja) */
#reacciones .rxn-root .rxn-ayuda {
  min-height: 34px;
  padding: 0 12px;
  border-radius: 17px;
  border: 1.5px solid #27AE60;
  background: #ffffff;
  color: #1e8e4e;
  font: 700 12.5px "Poppins", Arial, sans-serif;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
}
#reacciones .rxn-root .rxn-ayuda.on { background: #27AE60; color: #ffffff; }
#reacciones .rxn-root .rxn-ayuda.on svg path { stroke: #27AE60; }
#reacciones .rxn-root .rxn-ayuda:focus-visible { outline: 3px solid #1686c9; outline-offset: 2px; }

#reacciones .rxn-root .rxn-ay {
  margin-top: 10px;
  padding: 10px 12px;
  background: #e8f7ee;
  border-left: 4px solid #27AE60;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  color: #2b2f36;
}
#reacciones .rxn-root .rxn-ay[hidden] { display: none; }
#reacciones .rxn-root .rxn-ay h3 { margin: 10px 0 3px; font-size: 12px; font-weight: 700; color: #1e8e4e; }
#reacciones .rxn-root .rxn-ay h3:first-child { margin-top: 0; }
#reacciones .rxn-root .rxn-ay p { margin: 0; }
#reacciones .rxn-root .rxn-ay ol, #reacciones .rxn-root .rxn-ay ul { margin: 0; padding-left: 18px; }
#reacciones .rxn-root .rxn-ay li { margin: 2px 0; }

/* ---- Casos de práctica: 10 botones en 2 filas de 5, todos del mismo ancho ------- */
#reacciones .rxn-root .rxn-casos { margin: 10px 0 0; padding: 9px 10px 10px; background: #e8ebee; border-radius: 16px; }
#reacciones .rxn-root .rxn-casos-tit { margin: 0 0 7px; font-size: 14.5px; font-weight: 700; line-height: 1.2; color: #111111; }
#reacciones .rxn-root .rxn-casos-tit small { font-size: 11.5px; font-weight: 500; color: #4a525c; }
#reacciones .rxn-root .rxn-casos-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
#reacciones .rxn-root .rxn-caso {
  display: flex; align-items: center; justify-content: center; text-align: center;
  min-width: 0;
  min-height: 44px;
  padding: 2px 2px;
  font: 600 11px/1.15 "Poppins", Arial, sans-serif;
  color: #ffffff;
  background: #2a2e35;
  border: 1.5px solid #8f969f;
  border-radius: 14px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background .2s, border-color .2s;
}
#reacciones .rxn-root .rxn-caso:hover { background: #3a3f48; }
#reacciones .rxn-root .rxn-caso:active { transform: scale(.96); }
#reacciones .rxn-root .rxn-caso:focus-visible { outline: 3px solid #1686c9; outline-offset: 2px; }
/* Caso elegido: verde (en Enlaces es naranja) */
#reacciones .rxn-root .rxn-caso.rxn-caso--activo,
#reacciones .rxn-root .rxn-caso.rxn-caso--activo:hover { background: var(--rxn-verde); border-color: var(--rxn-verde); color: #06280f; }
@media (min-width: 480px) {
  #reacciones .rxn-root .rxn-caso { font-size: 12.5px; min-height: 34px; border-radius: 17px; }
}


#reacciones .rxn-root .rxn-casos { display: block; margin: 10px 0 0; padding: 9px 10px 10px; background: #e8ebee; border-radius: 16px; }
#reacciones .rxn-root .rxn-casos-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
#reacciones .rxn-root .rxn-caso { white-space: normal; box-shadow: none; }
#reacciones .rxn-root .rxn-ayuda svg { flex: 0 0 auto; }
`;
  function inyectarEstilos() {
    if (document.getElementById('rxn-estilos-cab')) return;
    var st = document.createElement('style');
    st.id = 'rxn-estilos-cab';
    st.textContent = estilosEncabezado;
    document.head.appendChild(st);
  }

  function construirVista(contenedor) {
    inyectarEstilos();
    var raiz = el('div', { class: 'rxn-root' });

    /* --- Encabezado (igual que Enlaces): título + botón Ayuda + icono; casos de práctica en 2 filas de 5 --- */
    $.botonesCasos = CASOS_PRACTICA.map(function (ids) {
      var etq = ids.map(function (id) { return formulaPlana(sustanciaDeBanco(id)); }).join(' + ');
      var b = el('button', {
        type: 'button', class: 'rxn-caso', 'aria-label': 'Probar ' + etq, 'aria-pressed': 'false',
        onclick: function () { probarCaso(ids); }
      }, [etq]);
      b._ids = ids.slice().sort().join('|');
      return b;
    });
    $.btnAyuda = el('button', {
      type: 'button', class: 'rxn-ayuda', 'aria-expanded': 'false', 'aria-controls': 'rxn-ay',
      onclick: function () {
        var abierta = $.panelAyuda.hidden;
        $.panelAyuda.hidden = !abierta;
        $.btnAyuda.setAttribute('aria-expanded', String(abierta));
        $.btnAyuda.classList.toggle('on', abierta);
      }
    }, [iconoAyuda(), ' Ayuda']);
    $.panelAyuda = el('div', { class: 'rxn-ay', id: 'rxn-ay', hidden: true }, [
      el('h3', { text: '¿Qué es?' }),
      el('p', {}, ['Un simulador paso a paso: eliges los ', el('b', { text: 'reactivos' }), ' y te muestra la reacción completa, la ecuación balanceada y los cálculos de estequiometría.']),
      el('h3', { text: '¿Cómo se usa?' }),
      el('ol', {}, [
        el('li', { text: 'Toca un caso de práctica o escribe un reactivo y pulsa + (puedes buscar por fórmula o nombre).' }),
        el('li', { text: 'Pulsa “Determinar reacción” para ver los productos.' }),
        el('li', { text: 'Pulsa “Balancear ecuación” y abre los paneles de análisis y estequiometría.' })
      ]),
      el('h3', { text: '¿Qué significa el resultado?' }),
      el('ul', {}, [
        el('li', {}, [el('b', { text: 'Flecha →' }), ': la reacción es irreversible. ', el('b', { text: '⇌' }), ': es reversible (llega a un equilibrio).']),
        el('li', {}, [el('b', { text: 'Completa / Parcial' }), ': cuando los mismos reactivos pueden reaccionar en distinta proporción, elige la variante.']),
        el('li', {}, [el('b', { text: 'Reactivo limitante' }), ': el que se acaba primero; define cuánto producto se obtiene.'])
      ])
    ]);
    raiz.appendChild(el('section', { class: 'rxn-card rxn-card--intro' }, [
      el('header', { class: 'rxn-encabezado' }, [
        el('h2', { class: 'rxn-titulo', text: 'Reacciones y Estequiometría' }),
        el('div', { class: 'rxn-cab-d' }, [$.btnAyuda, iconoMatraz()])
      ]),
      $.panelAyuda,
      el('div', { class: 'rxn-casos' }, [
        el('h2', { class: 'rxn-casos-tit' }, ['Casos de práctica ', el('small', { text: '(toca uno para probar)' })]),
        el('div', { class: 'rxn-casos-grid' }, $.botonesCasos)
      ])
    ]));

    /* --- 1. Reactivos: campo (borde negro grueso + botón verde +), chips, Determinar / Borrar --- */
    $.contadorR = el('span', { class: 'rxn-contador' });
    $.input = el('input', {
      type: 'text', id: 'rxn-entrada', class: 'rxn-input', autocomplete: 'off', autocapitalize: 'off',
      autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next',
      placeholder: 'Escribe un reactivo y pulsa +', 'aria-controls': 'rxn-sugerencias',
      oninput: alEscribir, onkeydown: alTecla, onfocus: alEscribir,
      onscroll: sincronizarEspejo, onkeyup: sincronizarEspejo, onclick: sincronizarEspejo
    });
    $.espejo = el('div', { class: 'rxn-espejo', 'aria-hidden': 'true' });
    $.btnMas = el('button', {
      type: 'button', class: 'rxn-campo-mas', 'aria-label': 'Agregar reactivo',
      onmousedown: function (ev) { ev.preventDefault(); },
      onclick: agregarReactivo
    }, []);
    $.campo = el('div', { class: 'rxn-campo' }, [$.espejo, $.input, $.btnMas]);
    $.sugerencias = el('ul', { class: 'rxn-sugerencias', id: 'rxn-sugerencias', role: 'listbox', hidden: true });
    $.msgEntrada = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
    $.chips = el('ul', { class: 'rxn-chips', 'aria-label': 'Reactivos agregados' });
    $.vacioR = el('p', { class: 'rxn-vacio', text: 'Aún no hay reactivos. Escribe una fórmula o un nombre (ej. HCl, agua).' });
    $.btnDeterminar = el('button', { type: 'button', class: 'rxn-btn rxn-btn--primario rxn-btn--fila', onclick: determinarReaccion }, ['Determinar reacción']);
    $.btnBorrar = el('button', {
      type: 'button', class: 'rxn-pastilla rxn-pastilla--borrar rxn-btn-borrar', 'aria-label': 'Borrar todo',
      onclick: borrarTodo
    }, ['Borrar']);

    raiz.appendChild(el('section', { class: 'rxn-card' }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: 'Reactivos' }), $.contadorR]),
      el('label', { class: 'rxn-solo-lector', for: 'rxn-entrada', text: 'Escribe los reactivos separados por +' }),
      el('div', { class: 'rxn-entrada-wrap' }, [$.campo, $.sugerencias]),
      $.msgEntrada, $.chips, $.vacioR,
      el('div', { class: 'rxn-acciones' }, [$.btnDeterminar, $.btnBorrar])
    ]));

    /* --- 2. Reacción (fondo negro): se revela en secuencia --- */
    $.contadorP = el('span', { class: 'rxn-contador rxn-contador--oscuro' });
    $.msgProductos = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
    $.reaccion = el('div', { class: 'rxn-reaccion rxn-reaccion--vacia', text: 'Pulsa \u201cDeterminar reacción\u201d y aquí aparecerá la reacción completa.' });
    $.leyenda = el('div', { class: 'rxn-leyenda', hidden: true });
    $.variantes = el('div', { class: 'rxn-variantes', hidden: true });
    $.clasif = el('div', { class: 'rxn-dato-banco rxn-dato-banco--clasif', hidden: true });
    $.btnBalancear = el('button', { type: 'button', class: 'rxn-btn rxn-btn--balancear rxn-btn--ancho', onclick: balancear, hidden: true }, ['\u2696\ufe0f Balancear ecuación']);
    $.cardReaccion = el('section', { class: 'rxn-card rxn-card--oscura', id: 'rxn-reaccion' }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: 'Reacción completa' }), $.contadorP]),
      $.msgProductos, $.reaccion, $.leyenda, $.variantes, $.btnBalancear, $.clasif
    ]);
    raiz.appendChild($.cardReaccion);

    /* --- 3. Ecuación balanceada (fondo gris) + botón rojo de semirreacciones --- */
    $.medio = el('span', { class: 'rxn-medio', hidden: true });
    $.ecuacion = el('div', { class: 'rxn-ecuacion rxn-ecuacion--vacia', text: 'Aquí verás tu ecuación balanceada.' });
    $.msgEcuacion = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
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
    $.cardResultado = el('section', { class: 'rxn-card rxn-card--gris', id: 'rxn-resultado' }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: 'Ecuación balanceada' }), $.medio]),
      $.ecuacion, $.msgEcuacion, $.detSemi
    ]);
    raiz.appendChild($.cardResultado);

    /* --- 4. Análisis (acordeones numerados, orden fijo) --- */
    raiz.appendChild(el('section', { class: 'rxn-card', id: 'rxn-analisis' }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: 'Análisis y estequiometría' })]),
      el('p', { class: 'rxn-analisis-guia', text: 'Toca cada botón de color para abrir su explicación.' }),
      tarjetaNumerada(1, 'Tipo de reacción', 'Clasificación y análisis redox', 'cuerpo-tipo', 'Se mostrará al determinar la reacción.'),
      tarjetaNumerada(2, 'Estados de oxidación', 'El número de oxidación de cada átomo', 'cuerpo-oxidacion', 'Balancea la ecuación para ver los números de oxidación.'),
      tarjetaNumerada(3, 'Masas molares', 'Cuánto pesa un mol de cada sustancia', 'cuerpo-masas', 'Balancea la ecuación para ver las masas molares.'),
      tarjetaNumerada(4, 'Cálculos estequiométricos', 'Reactivo limitante, exceso y producción teórica', 'cuerpo-estequio', 'Primero balancea la ecuación.')
    ]));

    contenedor.appendChild(raiz);

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest || !ev.target.closest('#' + CONFIG.idContenedor + ' .rxn-entrada-wrap')) ocultarSugerencias();
    });
  }

  /* ---------- Chips ---------- */
  function crearChip(tk, indice, lado, quitable) {
    var s = tk.sustancia;
    var chip = el('li', { class: 'rxn-chip' + (s ? '' : ' rxn-chip--error') });
    chip.appendChild(el('span', { class: 'rxn-chip-textos' }, [
      el('span', { class: 'rxn-chip-formula' }, s ? [formulaNodos(s)] : [tk.texto]),
      el('span', { class: 'rxn-chip-nombre', text: s ? s.nombre : 'no reconocido' })
    ]));
    if (quitable) {
      chip.appendChild(el('button', {
        type: 'button', class: 'rxn-chip-x', 'aria-label': 'Quitar ' + (s ? s.nombre : tk.texto),
        onclick: function () { quitarTermino(lado, indice); }
      }, ['\u00d7']));
    }
    return chip;
  }

  function renderChips() {
    var e = estado.entrada;
    limpiar($.chips);
    e.reactivos.forEach(function (tk, i) { $.chips.appendChild(crearChip(tk, i, 'R', true)); });
    $.vacioR.hidden = e.reactivos.length > 0;
    $.chips.hidden = e.reactivos.length === 0;
    $.contadorR.textContent = e.reactivos.length + ' / ' + CONFIG.limiteReactivos;
    $.contadorR.className = 'rxn-contador' + (e.reactivos.length > CONFIG.limiteReactivos ? ' rxn-contador--error' : '');
    $.btnDeterminar.disabled = e.estado !== 'ok';
    $.btnMas.disabled = e.reactivos.length >= CONFIG.limiteReactivos;
    marcarCasoActivo();
  }

  /* Resalta en verde el caso de práctica cuyos reactivos coinciden con los elegidos. */
  function marcarCasoActivo() {
    if (!$.botonesCasos) return;
    var e = estado.entrada;
    var clave = e.reactivos.map(function (t) { return t.sustancia.id; }).sort().join('|');
    $.botonesCasos.forEach(function (b) {
      var on = !!clave && !e.flecha && b._ids === clave;
      b.classList.toggle('rxn-caso--activo', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  function lineaNombres(titulo, lista) {
    return el('p', {}, [el('b', { text: titulo + ': ' }), lista.map(function (s) { return s.nombre; }).join(' \u00b7 ')]);
  }

  /* Vuelve a lanzar la animación de aparición de un bloque (con retraso en ms). */
  function reiniciarAnim(nodo, retardo) {
    if (!nodo) return;
    nodo.classList.remove('rxn-revela');
    void nodo.offsetWidth;
    nodo.style.animationDelay = retardo + 'ms';
    nodo.classList.add('rxn-revela');
  }

  /* Etiqueta de cada variante: condición (entre paréntesis en el banco) + proporción de reactivos. */
  function etiquetaVariante(v, V) {
    var m = /\(([^)]+)\)/.exec(v.titulo), cond = m ? m[1] : '';
    if (!cond) {
      var hayParcial = V.some(function (o) { return o !== v && /\((parcial|[^)]*incompleta[^)]*)\)/i.test(o.titulo); });
      cond = hayParcial ? 'Completa' : 'Principal';
    }
    cond = cond.charAt(0).toUpperCase() + cond.slice(1);
    var rel = v.reactivos.map(function (id, i) { return v.coeficientesR[i] + ' ' + formulaPlana(sustanciaDeBanco(id)); }).join(' : ');
    return { cond: cond, rel: rel };
  }

  /* Tarjeta negra, paso 2: reacción completa (reactivos → productos) → nombres → variantes →
     botón Balancear → clasificación y observación. Todo sale del banco; nada se calcula aquí. */
  function renderReaccion() {
    var r = estado.reaccion, P = productosActuales(), R0 = r ? reactivosActuales() : [];
    if (r && P.length) {
      $.contadorP.textContent = esReversible(r) ? '\u21cc Reversible' : '\u2192 Irreversible';
      $.contadorP.hidden = false;
    } else $.contadorP.hidden = true;
    var llave = r ? String(r.id) : '';
    if (estado.llave === llave) return;           // mismo contenido: no se repite la animación
    estado.llave = llave;

    [$.reaccion, $.leyenda, $.variantes, $.clasif].forEach(limpiar);
    if (!r) {
      $.reaccion.className = 'rxn-reaccion rxn-reaccion--vacia';
      $.reaccion.textContent = 'Pulsa \u201cDeterminar reacción\u201d y aquí aparecerá la reacción completa.';
      [$.leyenda, $.variantes, $.clasif, $.btnBalancear].forEach(function (n) { n.hidden = true; });
      return;
    }

    /* Reacción completa */
    if (P.length) {
      $.reaccion.className = 'rxn-reaccion';
      $.reaccion.appendChild(nodoEcuacion(R0, null, P, null, esReversible(r)));
      $.leyenda.appendChild(lineaNombres('Reactivos', R0));
      $.leyenda.appendChild(lineaNombres('Productos', P));
      if (esReversible(r)) $.leyenda.appendChild(el('p', {}, [el('b', { text: 'Flecha doble (\u21cc): ' }), 'reacción reversible, ocurre en ambos sentidos.']));
      $.leyenda.hidden = false;
    } else {
      $.reaccion.className = 'rxn-reaccion rxn-reaccion--vacia';
      $.reaccion.textContent = 'No se forma ningún producto nuevo: no hay reacción neta.';
      $.leyenda.hidden = true;
    }

    /* Variantes (p. ej. completa / parcial, o combustión completa / incompleta) */
    var V = estado.variantes;
    if (V.length > 1) {
      $.variantes.appendChild(el('p', { class: 'rxn-variantes-tit', text: 'Esta combinación reacciona de ' + V.length + ' formas según la proporción de reactivos. Elige una:' }));
      var fila = el('div', { class: 'rxn-variantes-fila' });
      V.forEach(function (v, i) {
        var et = etiquetaVariante(v, V);
        fila.appendChild(el('button', {
          type: 'button', class: 'rxn-variante' + (v === r ? ' rxn-variante--activa' : ''),
          'aria-pressed': v === r ? 'true' : 'false', onclick: function () { elegirVariante(i); }
        }, [el('span', { class: 'rxn-variante-cond', text: et.cond }), el('span', { class: 'rxn-variante-rel', text: et.rel })]));
      });
      $.variantes.appendChild(fila);
      $.variantes.hidden = false;
    } else $.variantes.hidden = true;

    /* Botón Balancear: justo debajo, solo si hay productos que balancear */
    $.btnBalancear.hidden = !P.length;

    /* Clasificación + observación del banco, en un solo bloque compacto */
    $.clasif.appendChild(el('span', { class: 'rxn-dato-et', text: 'Clasificación' }));
    $.clasif.appendChild(el('span', { class: 'rxn-dato-val', text: r.categoria }));
    if (r.nota) $.clasif.appendChild(el('span', { class: 'rxn-dato-nota', text: r.nota }));
    $.clasif.hidden = false;

    /* Aparición secuencial */
    reiniciarAnim($.reaccion, 0);
    if (!$.leyenda.hidden) reiniciarAnim($.leyenda, 140);
    if (!$.variantes.hidden) reiniciarAnim($.variantes, 240);
    if (!$.btnBalancear.hidden) reiniciarAnim($.btnBalancear, 340);
    reiniciarAnim($.clasif, 460);
  }

  /* ---------- Ecuación ---------- */
  /* Cada especie lleva pegado su "+" (o la flecha, si es el último reactivo):
     así, al saltar de línea en el celular, un "+" nunca queda solo al inicio. */
  function nodoEcuacion(R, coefR, P, coefP, reversible) {
    var frag = document.createDocumentFragment();
    function lado(lista, coefs, cierraConFlecha) {
      lista.forEach(function (s, i) {
        var grupo = el('span', { class: 'rxn-eq-esp' });
        if (coefs && coefs[i] !== 1) grupo.appendChild(el('span', { class: 'rxn-eq-coef', text: String(coefs[i]) }));
        grupo.appendChild(el('span', {}, [formulaNodos(s)]));
        if (i < lista.length - 1) grupo.appendChild(el('span', { class: 'rxn-eq-signo', text: '+' }));
        else if (cierraConFlecha) grupo.appendChild(el('span', { class: 'rxn-eq-flecha', text: reversible ? '\u21cc' : '\u2192' }));
        frag.appendChild(grupo);
      });
    }
    lado(R, coefR, true);
    lado(P, coefP, false);
    return frag;
  }

  function renderEcuacion() {
    limpiar($.ecuacion);
    var b = estado.balanceo;
    if (b && b.estado === 'ok' && b.conservacion && b.conservacion.atomos && b.conservacion.carga) {
      var R = reactivosActuales(), P = productosActuales();
      $.ecuacion.className = 'rxn-ecuacion';
      $.ecuacion.appendChild(nodoEcuacion(R, b.coeficientesReactivos, P, b.coeficientesProductos, esReversible(estado.reaccion)));
      $.medio.textContent = '\u270f\ufe0f Medio: ' + estado.medio;
      $.medio.hidden = false;
      var hayCarga = R.concat(P).some(function (s) { return s.carga; });
      if (b.noVerificable) mostrarMensajes($.msgEcuacion, 'info', ['Coeficientes tomados del banco de reacciones. Esta ecuación incluye sustancias sin fórmula analizable (polímero o ion complejo), por eso la conservación no se verificó automáticamente.']);
      else mostrarMensajes($.msgEcuacion, 'exito', ['\u2713 Conservación verificada: los átomos' + (hayCarga ? ' y las cargas' : '') + ' son iguales a ambos lados.']);
    } else {
      $.ecuacion.className = 'rxn-ecuacion rxn-ecuacion--vacia';
      $.ecuacion.textContent = 'Aquí verás tu ecuación balanceada.';
      $.medio.hidden = true;
      if (b && b.estado !== 'ok') mostrarMensajes($.msgEcuacion, 'error', [b.mensaje]);
      else if (b) mostrarMensajes($.msgEcuacion, 'error', ['El balanceo no superó la verificación de conservación, por eso no se muestra.']);
      else mostrarMensajes($.msgEcuacion, 'exito', []);
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

  /* Los paneles se activan por pasos: el 1 al determinar la reacción; 2, 3 y 4 al balancearla. */
  function marcarBloqueos() {
    [['cuerpo-tipo-det', 1], ['cuerpo-oxidacion-det', 2], ['cuerpo-masas-det', 2], ['cuerpo-estequio-det', 2]].forEach(function (x) {
      var d = $[x[0]]; if (!d) return;
      var bloqueado = estado.paso < x[1];
      d.classList.toggle('rxn-acordeon--bloqueado', bloqueado);
    });
  }

  function pulsarPanel(clave, retardo) {
    var d = $[clave]; if (!d) return;
    d.classList.remove('rxn-acordeon--activo');
    void d.offsetWidth;
    d.style.animationDelay = retardo + 'ms';
    d.classList.add('rxn-acordeon--activo');
  }

  /* Moles y masa de cada sustancia según los coeficientes de la ecuación balanceada. */
  function agregarMolesPorEcuacion(cont, R, P) {
    var b = estado.balanceo;
    if (!b || b.estado !== 'ok') return;
    cont.appendChild(el('p', { class: 'rxn-subtitulo', text: 'Moles y masa según la ecuación balanceada' }));
    var tabla = el('table', { class: 'rxn-tabla' }, [el('thead', {}, [el('tr', {}, [
      el('th', { text: 'Sustancia' }), el('th', { text: 'Moles' }), el('th', { text: 'Masa (g)' })
    ])])]);
    var tb = el('tbody'), totR = 0, totP = 0, completo = true;
    function fila(s, coef, rol, lado) {
      var M = calcularMasaMolar(s.composicion), g = M === null ? null : M * coef;
      if (g === null) completo = false; else if (lado === 'R') totR += g; else totP += g;
      tb.appendChild(el('tr', {}, [
        el('td', {}, [el('strong', {}, [formulaNodos(s)]), el('span', { class: 'rxn-rol', text: rol })]),
        el('td', { class: 'rxn-num-celda', text: String(coef) + ' mol' }),
        el('td', { class: 'rxn-num-celda', text: g === null ? 'sin datos' : formatoNum(g, 3) })
      ]));
    }
    R.forEach(function (s, i) { fila(s, b.coeficientesReactivos[i], 'reactivo', 'R'); });
    P.forEach(function (s, i) { fila(s, b.coeficientesProductos[i], 'producto', 'P'); });
    tabla.appendChild(tb);
    cont.appendChild(el('div', { class: 'rxn-tabla-wrap' }, [tabla]));
    if (completo) {
      var igual = Math.abs(totR - totP) <= Math.max(totR, totP) * 1e-9;
      cont.appendChild(parrafo((igual ? '\u2713 ' : '') + 'Masa de reactivos: ' + formatoNum(totR, 3) + ' g \u00b7 masa de productos: ' + formatoNum(totP, 3) + ' g.' +
        (igual ? ' La masa se conserva (ley de Lavoisier).' : ''), 'rxn-nota'));
    }
  }

  function renderAnalisis() {
    var R = reactivosActuales(), P = productosActuales();
    marcarBloqueos();

    /* 1. Tipo: categoría y observación del banco (+ análisis por reglas si lo hay) */
    var t = $['cuerpo-tipo']; limpiar(t);
    var rb = estado.reaccion;
    if (!rb) t.appendChild(parrafo('Se mostrará al determinar la reacción.', 'rxn-pendiente'));
    else if (estado.tipo && estado.tipo.nombre !== 'Sin clasificar') {
      t.appendChild(el('p', { class: 'rxn-etiqueta', text: 'Tipo de reacción:' }));
      t.appendChild(el('p', { class: 'rxn-dato-fuerte', text: estado.tipo.nombre }));
      t.appendChild(parrafo(estado.tipo.texto));
      if (estado.tipo.nota) t.appendChild(parrafo(estado.tipo.nota, 'rxn-nota'));
    } else t.appendChild(parrafo('La clasificación de esta reacción está en la tarjeta negra.', 'rxn-pendiente'));

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
    if (estado.paso < 2) o.appendChild(parrafo('Balancea la ecuación para ver los números de oxidación.', 'rxn-pendiente'));
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
    if (estado.paso < 2) mm.appendChild(parrafo('Balancea la ecuación para ver las masas molares y los moles.', 'rxn-pendiente'));
    else {
      var tabla = el('table', { class: 'rxn-tabla' }, [el('thead', {}, [el('tr', {}, [el('th', { text: 'Sustancia' }), el('th', { text: 'Masa molar' })])])]);
      var cuerpo = el('tbody');
      function filaMasa(s, rol) {
        var M = calcularMasaMolar(s.composicion);
        var desglose = Object.keys(s.composicion).map(function (sim) {
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
      agregarMolesPorEcuacion(mm, R, P);
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

  /* La ecuación balanceada aparece al determinar; el análisis, al balancear. */
  function actualizarVisibilidad() {
    $.cardResultado.hidden = estado.paso < 1;
    var ca = $['cuerpo-tipo-det'] && $['cuerpo-tipo-det'].parentNode;
    if (ca) ca.hidden = estado.paso < 2;
  }

  function renderTodo() {
    actualizarVisibilidad();
    renderChips(); renderReaccion(); renderEcuacion(); renderAnalisis();
  }

  /* ---------- Entrada, validación y sugerencias ---------- */
  function ocultarSugerencias() { if ($.sugerencias) { $.sugerencias.hidden = true; limpiar($.sugerencias); } }

  /* Un "+" separa reactivos si lleva espacio antes o si va pegado a otra fórmula
     (CH4+O2). Un "+" al final de una fórmula (Na+, Fe^2+) es una carga. */
  function tokenActual(valor) {
    var t = limpiarEntrada(valor), ini = 0, m;
    var re = /\s\+\s*|\+(?=[A-Za-z(])|\u2192/g;
    while ((m = re.exec(t)) !== null) ini = m.index + m[0].length;
    return { texto: t.slice(ini).trim(), inicio: ini };
  }

  /* Reactivos ya elegidos antes del que se está escribiendo. */
  function idsPrevios(valor, tk) {
    var antes = limpiarEntrada(valor).slice(0, tk.inicio);
    if (!antes.trim()) return [];
    return parsearEntrada(antes).reactivos.filter(function (x) { return x.sustancia; })
      .map(function (x) { return x.sustancia.id; });
  }

  /* Búsqueda encadenada: solo se ofrece lo que el banco puede combinar con lo ya elegido. */
  function sugerenciasBanco(texto, previos) {
    var q = normalizar(limpiarEntrada(texto)), res = [];
    var lista = CATALOGO.reactivosCompatiblesCon(previos).companeros;
    lista.forEach(function (c) {
      var s = sustanciaDeBanco(c.id), mejor = null;
      if (!q) { res.push({ s: s, p: 3, n: c.reacciones }); return; }
      var cand = [normalizar(s.id)];
      if (!s.sinComposicion && s.nombre !== 'Compuesto fuera del catálogo') cand.push(normalizar(s.nombre));
      cand.forEach(function (x) {
        var p = x === q ? 0 : (x.indexOf(q) === 0 ? 1 : (x.indexOf(q) > 0 ? 2 : null));
        if (p !== null && (mejor === null || p < mejor)) mejor = p;
      });
      if (mejor !== null) res.push({ s: s, p: mejor, n: c.reacciones });
    });
    res.sort(function (a, b) { return a.p - b.p || b.n - a.n; });
    return res;
  }

  function mostrarSugerencias() {
    var valor = $.input.value, tk = tokenActual(valor);
    limpiar($.sugerencias);
    if (document.activeElement !== $.input) { $.sugerencias.hidden = true; return; }
    var previos = idsPrevios(valor, tk);
    if ((!tk.texto && !previos.length) || previos.length >= CONFIG.limiteReactivos) { $.sugerencias.hidden = true; return; }
    /* Con texto: lista flotante corta (como antes). Sin texto (recién pulsado +): lista de la
       cadena dentro del flujo, para que empuje el contenido y nunca tape «Determinar reacción». */
    $.sugerencias.className = 'rxn-sugerencias' + (tk.texto ? '' : ' rxn-sugerencias--cadena');
    var lista = sugerenciasBanco(tk.texto, previos).slice(0, tk.texto ? CONFIG.maxSugerencias : 40);
    if (!lista.length) {
      if (!tk.texto) { $.sugerencias.hidden = true; return; }
      $.sugerencias.appendChild(el('li', { class: 'rxn-sug-vacio', text: previos.length
        ? 'Nada en el banco reacciona con esa combinación. Prueba con otro reactivo.'
        : 'Ese reactivo no está en el banco de reacciones.' }));
      $.sugerencias.hidden = false; return;
    }
    if (tk.texto && lista.length === 1 && lista[0].s.id === limpiarEntrada(tk.texto)) { $.sugerencias.hidden = true; return; }
    if (!tk.texto) {
      $.sugerencias.appendChild(el('li', { class: 'rxn-sug-cab', text: 'Reaccionan con ' +
        previos.map(function (id) { return formulaPlana(sustanciaDeBanco(id)); }).join(' + ') + ':' }));
    }
    lista.forEach(function (x) {
      var s = x.s;
      $.sugerencias.appendChild(el('li', { role: 'option' }, [
        el('button', { type: 'button', class: 'rxn-sug',
          onmousedown: function (ev) { ev.preventDefault(); },
          onclick: function () { elegirSugerencia(s, tk.inicio); } }, [
          el('span', { class: 'rxn-sug-formula' }, [formulaNodos(s)]),
          el('span', { class: 'rxn-sug-nombre', text: s.nombre }),
          el('span', { class: 'rxn-sug-tipo', text: x.n + (x.n === 1 ? ' reacción' : ' reacciones') })
        ])
      ]));
    });
    $.sugerencias.hidden = false;
  }

  function elegirSugerencia(s, inicio) {
    var v = limpiarEntrada($.input.value), prefijo = v.slice(0, inicio);
    if (prefijo && !/\s$/.test(prefijo)) prefijo += ' ';
    $.input.value = prefijo + s.id;
    ocultarSugerencias();
    alEscribir(true);
    $.input.focus();
  }

  /* La barra de entrada es un <input>, que no permite colorear letras sueltas.
     Por eso se dibuja el mismo texto en una capa detrás (con los "+" en verde)
     y el texto real del input se vuelve transparente. */
  function sincronizarEspejo() { if ($.espejo) $.espejo.scrollLeft = $.input.scrollLeft; }
  function actualizarEspejo() {
    if (!$.espejo) return;
    limpiar($.espejo);
    String($.input.value).split('+').forEach(function (t, i) {
      if (i > 0) $.espejo.appendChild(el('span', { class: 'rxn-espejo-mas', text: '+' }));
      if (t) $.espejo.appendChild(document.createTextNode(t));
    });
    sincronizarEspejo();
  }

  /* Guía de la búsqueda encadenada: qué sigue después de los reactivos ya elegidos. */
  function guiaCadena() {
    var e = estado.entrada;
    if (e.estado !== 'ok' || !e.reactivos.length || !CATALOGO.reactivosCompatiblesCon) return { tipo: 'info', textos: [] };
    var info = CATALOGO.reactivosCompatiblesCon(e.reactivos.map(function (t) { return t.sustancia.id; }));
    var n = info.exactas.length, c = info.companeros.length, textos = [];
    var esperando = /\s\+\s*$/.test(limpiarEntrada($.input.value));
    if (!n && !c) return { tipo: 'aviso', textos: ['Esta combinación no está en el banco de reacciones. Quita un reactivo o prueba con otro.'] };
    if (n) textos.push('Listo: pulsa \u201cDeterminar reacción\u201d.' + (n > 1 ? ' Hay ' + n + ' formas de reaccionar según la proporción.' : ''));
    if (c && !esperando) textos.push('También puedes pulsar + para sumar otro reactivo (' + c + (c === 1 ? ' opción' : ' opciones') + ').');
    return { tipo: 'info', textos: textos };
  }

  function alEscribir(sinSugerencias) {
    actualizarEspejo();
    estado.entrada = parsearEntrada($.input.value);
    invalidarResultados();
    var e = estado.entrada;
    $.campo.className = 'rxn-campo' + (e.estado === 'ok' ? ' rxn-campo--ok' : (e.estado === 'error' ? ' rxn-campo--error' : ''));
    if (e.estado === 'error') mostrarMensajes($.msgEntrada, 'error', e.errores);
    else { var g = guiaCadena(); mostrarMensajes($.msgEntrada, g.tipo, e.avisos.concat(g.textos)); }
    mostrarMensajes($.msgProductos, 'info', []);
    renderTodo();
    if (sinSugerencias === true) ocultarSugerencias(); else mostrarSugerencias();
  }

  function alTecla(ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); agregarReactivo(); }
    else if (ev.key === 'Escape') ocultarSugerencias();
  }

  /* Paso 1: botón + o Enter. Fija el reactivo que se está escribiendo (si hace falta,
     elige la primera sugerencia compatible) y deja listo el siguiente. */
  function agregarReactivo() {
    var v = $.input.value, tk = tokenActual(v);
    if (!tk.texto) {
      $.input.focus();
      if (!v.trim()) mostrarMensajes($.msgEntrada, 'aviso', ['Escribe o elige un reactivo y luego pulsa +.']);
      else mostrarSugerencias();
      return;
    }
    var previos = idsPrevios(v, tk);
    if (previos.length >= CONFIG.limiteReactivos) {
      mostrarMensajes($.msgEntrada, 'aviso', ['Ya tienes el máximo de ' + CONFIG.limiteReactivos + ' reactivos.']);
      return;
    }
    var r = resolverToken(tk.texto);
    if (!r) {
      var sug = sugerenciasBanco(tk.texto, previos);
      if (sug.length) r = { sustancia: sug[0].s };
    }
    if (!r) {
      mostrarMensajes($.msgEntrada, 'error', ['\u00ab' + tk.texto + '\u00bb no se reconoce como reactivo. Revisa la fórmula o elige una sugerencia.']);
      $.campo.className = 'rxn-campo rxn-campo--error';
      $.input.focus();
      return;
    }
    if (previos.indexOf(r.sustancia.id) >= 0) {
      mostrarMensajes($.msgEntrada, 'error', [r.sustancia.nombre + ' ya está en la lista.']);
      return;
    }
    var prefijo = limpiarEntrada(v).slice(0, tk.inicio);
    if (prefijo && !/\s$/.test(prefijo)) prefijo += ' ';
    /* Solo se deja el " + " listo si el banco todavía tiene algo que sumar a estos reactivos. */
    var sigue = CATALOGO.reactivosCompatiblesCon(previos.concat(r.sustancia.id)).companeros.length > 0;
    $.input.value = prefijo + r.sustancia.id + (sigue ? ' + ' : '');
    alEscribir(true);
    $.input.focus();
    if (sigue) mostrarSugerencias();
  }

  function borrarTodo() {
    $.input.value = '';
    ocultarSugerencias();
    alEscribir(true);
    $.input.focus();
  }

  function quitarTermino(lado, indice) {
    var e = estado.entrada;
    var izq = e.reactivos.filter(function (_, i) { return !(lado === 'R' && i === indice); }).map(function (t) { return t.texto; });
    var der = e.productos.map(function (t) { return t.texto; });
    var texto = izq.join(' + ');
    if (e.flecha && der.length) texto += ' \u2192 ' + der.join(' + ');
    $.input.value = texto;
    alEscribir(true);
  }

  /* ===========================================================================
     12. ACCIONES DEL USUARIO
     ======================================================================== */
  /* Paso 2: busca la reacción en el banco y muestra, en secuencia, productos esperados,
     clasificación y observación. NO muestra aún la ecuación con coeficientes. */
  function determinarReaccion() {
    var e = estado.entrada;
    if (e.estado !== 'ok') {
      mostrarMensajes($.msgEntrada, 'error', e.errores.length ? e.errores : ['Escribe al menos un reactivo.']);
      $.campo.className = 'rxn-campo rxn-campo--error';
      return;
    }
    ocultarSugerencias();
    var ids = e.reactivos.map(function (t) { return t.sustancia.id; });
    var hallazgos = CATALOGO.buscarReaccionExacta(ids);
    invalidarResultados();
    estado.llave = null;
    if (!hallazgos.length) {
      var R = e.reactivos.map(function (t) { return formulaPlana(t.sustancia); }).join(' + ');
      var info = CATALOGO.reactivosCompatiblesCon(ids), msgs = ['No hay una reacción registrada para ' + R + '.'];
      if (info.companeros.length) {
        msgs.push('Con estos reactivos puedes sumar: ' + info.companeros.slice(0, 8).map(function (c) { return formulaPlana(sustanciaDeBanco(c.id)); }).join(', ') +
                  (info.companeros.length > 8 ? '\u2026' : '') + '. Pulsa + para ver las opciones.');
      } else msgs.push('Quita un reactivo o prueba con otra combinación.');
      mostrarMensajes($.msgProductos, 'aviso', msgs);
      renderTodo();
      desplazarA($.cardReaccion);
      return;
    }
    estado.variantes = hallazgos.map(function (h) { return CATALOGO.describirReaccion(h); });
    estado.variantes.sort(function (a, b) {
      return (/\(/.test(a.titulo) ? 1 : 0) - (/\(/.test(b.titulo) ? 1 : 0) || a.id - b.id;
    });
    elegirVariante(0);
    desplazarA($.cardReaccion);
  }

  function elegirVariante(i) {
    var r = estado.variantes[i];
    if (!r) return;
    estado.reaccion = r;
    estado.productos = r.productos.slice();
    estado.origen = 'banco'; estado.nombreRegla = r.titulo;
    estado.balanceo = null; estado.estequio = null; estado.paso = 1;
    estado.llave = null;
    mostrarMensajes($.msgProductos, 'info', []);
    recalcularAnalisis();
    renderTodo();
    pulsarPanel('cuerpo-tipo-det', 700);
  }

  /* Paso 3: revela la ecuación con los coeficientes del banco (verificados con átomos y carga;
     si alguno fallara, se recalcula con el balanceador matricial). Paso 4: activa los paneles. */
  function balancear() {
    mostrarMensajes($.msgEcuacion, 'exito', []);
    var r = estado.reaccion;
    if (!r || !r.productos.length) {
      estado.balanceo = { estado: 'invalida', mensaje: 'Primero determina una reacción con productos: no hay nada que balancear.' };
      renderEcuacion(); desplazarA($.cardResultado); return;
    }
    var R = reactivosActuales(), P = productosActuales();
    var res = { estado: 'ok', coeficientesReactivos: r.coeficientesR.slice(), coeficientesProductos: r.coeficientesP.slice(), fuente: 'banco' };
    var analizable = R.concat(P).every(function (s) { return s.composicion && Object.keys(s.composicion).length; });
    if (analizable) {
      res.conservacion = verificarConservacion(R, P, res.coeficientesReactivos, res.coeficientesProductos);
      if (!res.conservacion.atomos || !res.conservacion.carga) {
        var alt = balancearEcuacion(R, P);
        if (alt.estado === 'ok') {
          alt.conservacion = verificarConservacion(R, P, alt.coeficientesReactivos, alt.coeficientesProductos);
          alt.fuente = 'calculo'; res = alt;
        }
      }
    } else {
      res.conservacion = { atomos: true, carga: true };
      res.noVerificable = true;
    }
    var bien = res.estado === 'ok' && res.conservacion && res.conservacion.atomos && res.conservacion.carga;
    estado.balanceo = res; estado.estequio = null; estado.paso = bien ? 2 : 1;
    recalcularAnalisis();
    renderTodo();
    if (bien) { pulsarPanel('cuerpo-oxidacion-det', 300); pulsarPanel('cuerpo-masas-det', 450); pulsarPanel('cuerpo-estequio-det', 600); }
    desplazarA($.cardResultado);
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
    if (!CATALOGO) { console.error('[Reacciones] formulas.js no está cargado; se conserva el contenido original.'); return; }
    if (!CATALOGO.reactivosCompatiblesCon || !CATALOGO.buscarReaccionExacta) { console.error('[Reacciones] formulas.js es anterior a v1.2 (faltan las consultas del banco); se conserva el contenido original.'); return; }
    try {
      construirIndice();
      var problemas = verificarCatalogo();
      if (problemas.length) console.warn('[Reacciones] Problemas en el catálogo:\n' + problemas.join('\n'));
      var problemasBanco = CATALOGO.validarBanco ? CATALOGO.validarBanco() : [];
      if (problemasBanco.length) console.warn('[Reacciones] Problemas en el banco de reacciones:\n' + problemasBanco.join('\n'));
      var temporal = document.createElement('div');
      construirVista(temporal);
      limpiar(contenedor);
      while (temporal.firstChild) contenedor.appendChild(temporal.firstChild);
      renderTodo();
    } catch (err) {
      console.error('[Reacciones] Error al construir la pestaña:', err);
    }
  }

  /* Para pruebas (consola o Node): construirIndice() antes de usar el resto. */
  var API = {
    config: CONFIG,
    iniciarIndice: construirIndice,
    parsearFormula: parsearFormula, validarFormula: validarFormula,
    parsearEntrada: parsearEntrada, resolverToken: resolverToken,
    calcularMasaMolar: calcularMasaMolar,
    balancearEcuacion: balancearEcuacion, verificarConservacion: verificarConservacion,
    analizarRedox: analizarRedox, clasificarReaccion: clasificarReaccion, detectarMedio: detectarMedio,
    calcularEstequiometria: calcularEstequiometria,
    verificarCatalogo: verificarCatalogo, buscarSustancias: buscarSustancias,
    obtenerSustancia: obtenerSustancia, sustanciaDeBanco: sustanciaDeBanco,
    sugerenciasBanco: sugerenciasBanco, tokenActual: tokenActual
  };
  global.ReaccionesUPDS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
  }
})(typeof window !== 'undefined' ? window : globalThis);
