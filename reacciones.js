/* =============================================================================
   reacciones.js — Pestaña "Reacciones químicas y estequiometría" · QuímicApp
   Versión 3.3 (rediseño: chips compactos, reacción completa en negro,
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
    6. Reglas de predicción de productos
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
    for (var k = 0; k < claves.length; k++) {
      var e = CATALOGO.elementos[claves[k]];
      if (!e || typeof e.masaAtomica !== 'number') return null;
      total += e.masaAtomica * composicion[claves[k]];
    }
    return total;
  }

  /* ===========================================================================
     6. REGLAS DE PREDICCIÓN
     Solo se proponen productos cuando una regla los respalda. Nunca se inventan.
     Forma: { id, nombre, aplica(reactivos), productos(reactivos) → [ids] }.
     Para añadir una reacción fija, agrega una línea con reglaFija(...).
     ======================================================================== */
  function mismosIds(R, ids) {
    if (R.length !== ids.length) return false;
    var a = R.map(function (s) { return s.id; }).sort().join('|');
    return a === ids.slice().sort().join('|');
  }

  function reglaFija(id, nombre, rIds, pIds) {
    return { id: id, nombre: nombre,
             aplica: function (R) { return mismosIds(R, rIds); },
             productos: function () { return pIds.slice(); } };
  }

  /* Sal de una neutralización: se busca en el catálogo la sal cuyos elementos
     son los del catión de la base + los del anión del ácido. */
  function buscarSal(acido, base) {
    if (!base.composicion.O || !base.composicion.H || !acido.composicion.H) return null;
    var cat = Object.keys(base.composicion).filter(function (e) { return e !== 'O' && e !== 'H'; });
    var an = Object.keys(acido.composicion).filter(function (e) { return e !== 'H'; });
    if (!cat.length || !an.length) return null;
    var objetivo = unicos(cat.concat(an)).sort().join(',');
    var hallados = ORDEN.filter(function (id) {
      var s = INDICE[id];
      return s.tipo === 'compuesto' && s.clasificacion === 'sal' &&
             Object.keys(s.composicion).sort().join(',') === objetivo;
    });
    return hallados.length === 1 ? hallados[0] : null;
  }

  function parAcidoBase(R) {
    if (R.length !== 2) return null;
    var ac = R.filter(function (s) { return s.clasificacion === 'acido'; });
    var ba = R.filter(function (s) { return s.clasificacion === 'base'; });
    return (ac.length === 1 && ba.length === 1) ? { acido: ac[0], base: ba[0] } : null;
  }

  var REGLAS_PREDICCION = [
    reglaFija('permanganato-yoduro-acido', 'Permanganato + yoduro en medio ácido',
              ['KMnO4', 'KI', 'H2SO4'], ['MnSO4', 'I2', 'K2SO4', 'H2O']),
    reglaFija('sintesis-agua', 'Síntesis del agua', ['H2', 'O2'], ['H2O']),
    reglaFija('sintesis-hcl', 'Síntesis del cloruro de hidrógeno', ['H2', 'Cl2'], ['HCl']),
    reglaFija('descomposicion-peroxido', 'Descomposición del peróxido de hidrógeno', ['H2O2'], ['H2O', 'O2']),
    reglaFija('descomposicion-carbonato', 'Descomposición térmica del carbonato de calcio', ['CaCO3'], ['CaO', 'CO2']),
    reglaFija('electrolisis-agua', 'Electrólisis del agua', ['H2O'], ['H2', 'O2']),
    reglaFija('oxido-basico-agua', 'Óxido básico + agua', ['CaO', 'H2O'], ['Ca(OH)2']),
    {
      id: 'neutralizacion', nombre: 'Neutralización (ácido + base → sal + agua)',
      aplica: function (R) {
        var p = parAcidoBase(R);
        return !!(p && buscarSal(p.acido, p.base) && obtenerSustancia('H2O'));
      },
      productos: function (R) {
        var p = parAcidoBase(R);
        return [buscarSal(p.acido, p.base), 'H2O'];
      }
    },
    {
      id: 'combustion-hidrocarburo', nombre: 'Combustión completa de un hidrocarburo',
      aplica: function (R) {
        return R.length === 2 && R.some(function (s) { return s.id === 'O2'; }) &&
               R.some(function (s) { return s.clasificacion === 'hidrocarburo'; }) &&
               !!obtenerSustancia('CO2') && !!obtenerSustancia('H2O');
      },
      productos: function () { return ['CO2', 'H2O']; }
    }
  ];

  function proponerProductos(R) {
    if (!R.length) return { estado: 'sin-reactivos', productos: [], mensaje: 'Agrega al menos un reactivo.' };
    var aplicables = REGLAS_PREDICCION.filter(function (r) {
      try { return !!r.aplica(R); } catch (e) { return false; }
    });
    if (!aplicables.length) {
      return { estado: 'no-reconocida', productos: [],
        mensaje: 'Reacción no reconocida: todavía no hay una regla para estos reactivos y la app no inventa productos. ' +
                 'Puedes escribirlos tú: \u201cA + B \u2192 C + D\u201d y balancearla igualmente.' };
    }
    var conj = {};
    aplicables.forEach(function (r) {
      var ids = r.productos(R) || [];
      conj[ids.slice().sort().join('|')] = { regla: r, ids: ids };
    });
    var claves = Object.keys(conj);
    if (claves.length > 1) {
      return { estado: 'ambigua', productos: [],
        mensaje: 'Caso ambiguo: varias reglas aplican con resultados distintos (' +
          claves.map(function (k) { return conj[k].regla.nombre; }).join('; ') +
          '). Escribe los productos tú con la flecha \u2192.' };
    }
    var u = conj[claves[0]];
    var falt = u.ids.filter(function (id) { return !obtenerSustancia(id); });
    if (falt.length) return { estado: 'error', productos: [], mensaje: 'La regla "' + u.regla.nombre + '" usa sustancias que no están en el catálogo: ' + falt.join(', ') + '.' };
    if (u.ids.length > CONFIG.limiteProductos) return { estado: 'error', productos: [], mensaje: 'La regla produce más de ' + CONFIG.limiteProductos + ' productos.' };
    return { estado: 'propuesta', productos: u.ids, regla: u.regla.nombre,
             mensaje: 'Regla aplicada: ' + u.regla.nombre + '.' };
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
    if (R.length === 2 && ids(R).indexOf('O2') >= 0 && clases(R).indexOf('hidrocarburo') >= 0 && ids(P).indexOf('CO2') >= 0) {
      return { nombre: 'Combustión',
        texto: 'Una sustancia reacciona con el oxígeno y libera energía. Con un hidrocarburo y oxígeno suficiente se forman CO\u2082 y H\u2082O.',
        nota: 'También es redox: el carbono se oxida y el oxígeno se reduce.' };
    }
    if (R.length === 1 && P.length >= 2) {
      return { nombre: 'Descomposición',
        texto: 'Un solo reactivo se rompe en dos o más sustancias más simples.', nota: esRedox ? 'Además es redox.' : '' };
    }
    if (R.length >= 2 && P.length === 1) {
      return { nombre: 'Síntesis (combinación)',
        texto: 'Dos o más sustancias se unen para formar una sola, más compleja.', nota: esRedox ? 'Además es redox.' : '' };
    }
    var elR = R.filter(function (s) { return s.clasificacion === 'elemento'; }).length;
    var elP = P.filter(function (s) { return s.clasificacion === 'elemento'; }).length;
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
    origen: null,        // 'regla' | 'usuario'
    nombreRegla: '',
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
    estado.balanceo = null; estado.redox = null; estado.tipo = null;
    estado.medio = null; estado.estequio = null;
  }

  function reactivosActuales() {
    return estado.entrada.reactivos.filter(function (t) { return t.sustancia; })
      .map(function (t) { return t.sustancia; });
  }
  function productosActuales() { return estado.productos.map(obtenerSustancia); }

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

  function construirVista(contenedor) {
    var raiz = el('div', { class: 'rxn-root' });

    /* --- Encabezado: solo título + icono verde de la pestaña --- */
    raiz.appendChild(el('header', { class: 'rxn-encabezado' }, [
      el('h2', { class: 'rxn-titulo', text: 'Reacciones y estequiometría' }),
      iconoMatraz()
    ]));

    /* --- 1. Reactivos --- */
    $.contadorR = el('span', { class: 'rxn-contador' });
    $.input = el('input', {
      type: 'text', id: 'rxn-entrada', class: 'rxn-input', autocomplete: 'off', autocapitalize: 'off',
      autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'go',
      placeholder: 'Ej.: KMnO4 + KI + H2SO4', 'aria-controls': 'rxn-sugerencias',
      oninput: alEscribir, onkeydown: alTecla, onfocus: alEscribir,
      onscroll: sincronizarEspejo, onkeyup: sincronizarEspejo, onclick: sincronizarEspejo
    });
    $.espejo = el('div', { class: 'rxn-espejo', 'aria-hidden': 'true' });
    $.campo = el('div', { class: 'rxn-campo' }, [$.espejo, $.input]);
    $.sugerencias = el('ul', { class: 'rxn-sugerencias', id: 'rxn-sugerencias', role: 'listbox', hidden: true });
    $.pastillas = construirPastillas();
    $.msgEntrada = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
    $.chips = el('ul', { class: 'rxn-chips', 'aria-label': 'Reactivos agregados' });
    $.vacioR = el('p', { class: 'rxn-vacio', text: 'Aún no hay reactivos. Escribe una fórmula o un nombre (ej. HCl, agua).' });
    $.btnDeterminar = el('button', { type: 'button', class: 'rxn-btn rxn-btn--primario rxn-btn--ancho', onclick: determinarReaccion }, ['Determinar reacción']);

    raiz.appendChild(el('section', { class: 'rxn-card' }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: 'Reactivos' }), $.contadorR]),
      el('label', { class: 'rxn-solo-lector', for: 'rxn-entrada', text: 'Escribe los reactivos separados por +' }),
      el('div', { class: 'rxn-entrada-wrap' }, [$.campo, $.sugerencias]),
      $.pastillas, $.msgEntrada, $.chips, $.vacioR, $.btnDeterminar
    ]));

    /* --- 2. Reacción completa (fondo negro) --- */
    $.contadorP = el('span', { class: 'rxn-contador rxn-contador--oscuro' });
    $.msgProductos = el('div', { class: 'rxn-msg', role: 'status', hidden: true });
    $.reaccion = el('div', { class: 'rxn-reaccion rxn-reaccion--vacia', text: 'Pulsa \u201cDeterminar reacción\u201d y aquí aparecerá la reacción completa.' });
    $.leyenda = el('div', { class: 'rxn-leyenda', hidden: true });
    $.btnBalancear = el('button', { type: 'button', class: 'rxn-btn rxn-btn--balancear rxn-btn--ancho', onclick: balancear }, ['\u2696\ufe0f Balancear ecuación']);
    $.cardReaccion = el('section', { class: 'rxn-card rxn-card--oscura', id: 'rxn-reaccion' }, [
      el('div', { class: 'rxn-card-cab' }, [el('h3', { class: 'rxn-card-titulo', text: 'Reacción completa' }), $.contadorP]),
      $.msgProductos, $.reaccion, $.leyenda, $.btnBalancear
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
      tarjetaNumerada(2, 'Estados de oxidación', 'El número de oxidación de cada átomo', 'cuerpo-oxidacion', 'Agrega reactivos para ver sus números de oxidación.'),
      tarjetaNumerada(3, 'Masas molares', 'Cuánto pesa un mol de cada sustancia', 'cuerpo-masas', 'Agrega reactivos para ver sus masas molares.'),
      tarjetaNumerada(4, 'Cálculos estequiométricos', 'Reactivo limitante, exceso y producción teórica', 'cuerpo-estequio', 'Primero balancea la ecuación.')
    ]));

    contenedor.appendChild(raiz);

    document.addEventListener('click', function (ev) {
      if (!ev.target.closest || !ev.target.closest('#' + CONFIG.idContenedor + ' .rxn-entrada-wrap')) ocultarSugerencias();
    });
  }

  function construirPastillas() {
    function pastilla(texto, etiqueta, clase, accion) {
      return el('button', {
        type: 'button', class: 'rxn-pastilla ' + clase, 'aria-label': etiqueta,
        onmousedown: function (ev) { ev.preventDefault(); },
        onclick: accion
      }, [texto]);
    }
    return el('div', { class: 'rxn-pastillas', role: 'group', 'aria-label': 'Entrada rápida' }, [
      pastilla('+', 'Insertar signo más', 'rxn-pastilla--mas', function () { insertarEnCursor(' + ', 0); }),
      pastilla('\u2192', 'Insertar flecha', 'rxn-pastilla--flecha', function () { insertarEnCursor(' \u2192 ', 0); }),
      pastilla('Borrar', 'Borrar todo', 'rxn-pastilla--borrar', function () { $.input.value = ''; alEscribir(); $.input.focus(); })
    ]);
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
  }

  function lineaNombres(titulo, lista) {
    return el('p', {}, [el('b', { text: titulo + ': ' }), lista.map(function (s) { return s.nombre; }).join(' \u00b7 ')]);
  }

  /* Reacción completa SIN balancear: todos los reactivos \u2192 todos los productos. */
  function renderReaccion() {
    var R = reactivosActuales(), P = productosActuales();
    limpiar($.reaccion); limpiar($.leyenda);
    if (P.length) {
      $.reaccion.className = 'rxn-reaccion';
      $.reaccion.appendChild(nodoEcuacion(R, null, P, null));
      $.leyenda.appendChild(lineaNombres('Reactivos', R));
      $.leyenda.appendChild(lineaNombres('Productos', P));
      $.leyenda.hidden = false;
    } else {
      $.reaccion.className = 'rxn-reaccion rxn-reaccion--vacia';
      $.reaccion.textContent = 'Pulsa \u201cDeterminar reacción\u201d y aquí aparecerá la reacción completa.';
      $.leyenda.hidden = true;
    }
    $.contadorP.textContent = 'Productos ' + P.length + ' / ' + CONFIG.limiteProductos;
    $.btnBalancear.disabled = P.length === 0;
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

  function renderEcuacion() {
    limpiar($.ecuacion);
    var b = estado.balanceo;
    if (b && b.estado === 'ok' && b.conservacion && b.conservacion.atomos && b.conservacion.carga) {
      var R = reactivosActuales(), P = productosActuales();
      $.ecuacion.className = 'rxn-ecuacion';
      $.ecuacion.appendChild(nodoEcuacion(R, b.coeficientesReactivos, P, b.coeficientesProductos));
      $.medio.textContent = '\u270f\ufe0f Medio: ' + estado.medio;
      $.medio.hidden = false;
      var hayCarga = R.concat(P).some(function (s) { return s.carga; });
      mostrarMensajes($.msgEcuacion, 'exito', ['\u2713 Conservación verificada: los átomos' + (hayCarga ? ' y las cargas' : '') + ' son iguales a ambos lados.']);
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
      if (estado.origen === 'regla') t.appendChild(parrafo('Productos propuestos por la regla: ' + estado.nombreRegla + '.', 'rxn-dato-sub'));
      if (estado.origen === 'usuario') t.appendChild(parrafo('Los productos los escribiste tú; la app no los verificó contra una regla.', 'rxn-dato-sub'));
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

  function renderTodo() {
    renderChips(); renderReaccion(); renderEcuacion(); renderAnalisis();
  }

  /* ---------- Entrada, validación y sugerencias ---------- */
  function ocultarSugerencias() { if ($.sugerencias) { $.sugerencias.hidden = true; limpiar($.sugerencias); } }

  function tokenActual(valor) {
    var m = /([^+\u2192]*)$/.exec(limpiarEntrada(valor));
    return { texto: m[1].trim(), inicio: limpiarEntrada(valor).length - m[1].length };
  }

  function mostrarSugerencias() {
    var valor = $.input.value, tk = tokenActual(valor);
    limpiar($.sugerencias);
    if (!tk.texto || document.activeElement !== $.input) { $.sugerencias.hidden = true; return; }
    var lista = buscarSustancias(tk.texto).slice(0, CONFIG.maxSugerencias);
    /* Sin lista si no hay coincidencias o si lo escrito ya es, exactamente, la única opción:
       así el desplegable no tapa la barra de entrada rápida sin necesidad. */
    if (!lista.length || (lista.length === 1 && lista[0].id === limpiarEntrada(tk.texto))) {
      $.sugerencias.hidden = true; return;
    }
    lista.forEach(function (s) {
      $.sugerencias.appendChild(el('li', { role: 'option' }, [
        el('button', { type: 'button', class: 'rxn-sug',
          onmousedown: function (ev) { ev.preventDefault(); },
          onclick: function () { elegirSugerencia(s, tk.inicio); } }, [
          el('span', { class: 'rxn-sug-formula' }, [formulaNodos(s)]),
          el('span', { class: 'rxn-sug-nombre', text: s.nombre }),
          el('span', { class: 'rxn-sug-tipo', text: s.tipo })
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

  function alEscribir(sinSugerencias) {
    actualizarEspejo();
    estado.entrada = parsearEntrada($.input.value);
    invalidarResultados();
    var e = estado.entrada;
    $.campo.className = 'rxn-campo' + (e.estado === 'ok' ? ' rxn-campo--ok' : (e.estado === 'error' ? ' rxn-campo--error' : ''));
    var tipoMsg = e.estado === 'error' ? 'error' : 'info';
    mostrarMensajes($.msgEntrada, tipoMsg, e.errores.concat(e.errores.length ? [] : e.avisos));
    mostrarMensajes($.msgProductos, 'info', []);
    renderTodo();
    if (sinSugerencias === true) ocultarSugerencias(); else mostrarSugerencias();
  }

  function alTecla(ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); ocultarSugerencias(); if (!$.btnDeterminar.disabled) determinarReaccion(); }
    else if (ev.key === 'Escape') ocultarSugerencias();
  }

  function insertarEnCursor(texto, retroceder) {
    var inp = $.input, ini = inp.selectionStart, fin = inp.selectionEnd, v = inp.value;
    if (ini === null || ini === undefined) { ini = fin = v.length; }
    inp.value = v.slice(0, ini) + texto + v.slice(fin);
    var pos = ini + texto.length - (retroceder || 0);
    inp.focus();
    try { inp.setSelectionRange(pos, pos); } catch (e) { /* no crítico */ }
    alEscribir();
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
  function determinarReaccion() {
    var e = estado.entrada;
    if (e.estado !== 'ok') {
      mostrarMensajes($.msgEntrada, 'error', e.errores.length ? e.errores : ['Escribe al menos un reactivo.']);
      $.campo.className = 'rxn-campo rxn-campo--error';
      return;
    }
    var R = reactivosActuales();
    invalidarResultados();

    if (e.flecha) {
      estado.productos = e.productos.map(function (t) { return t.sustancia.id; });
      estado.origen = 'usuario';
      mostrarMensajes($.msgProductos, 'info', ['Usaste los productos que escribiste después de la flecha \u2192.']);
    } else {
      var r = proponerProductos(R);
      if (r.estado === 'propuesta') {
        estado.productos = r.productos.slice(); estado.origen = 'regla'; estado.nombreRegla = r.regla;
        mostrarMensajes($.msgProductos, 'info', [r.mensaje]);
      } else {
        mostrarMensajes($.msgProductos, r.estado === 'error' ? 'error' : 'aviso', [r.mensaje]);
      }
    }
    recalcularAnalisis();
    renderTodo();
    desplazarA($.cardReaccion);
  }

  function balancear() {
    mostrarMensajes($.msgEcuacion, 'exito', []);
    if (!estado.productos.length) {
      estado.balanceo = { estado: 'invalida', mensaje: 'Primero determina los productos: no hay nada que balancear.' };
      renderEcuacion(); desplazarA($.cardResultado); return;
    }
    var R = reactivosActuales(), P = productosActuales();
    var res = balancearEcuacion(R, P);
    if (res.estado === 'ok') res.conservacion = verificarConservacion(R, P, res.coeficientesReactivos, res.coeficientesProductos);
    estado.balanceo = res; estado.estequio = null;
    recalcularAnalisis();
    renderTodo();
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
    try {
      construirIndice();
      var problemas = verificarCatalogo();
      if (problemas.length) console.warn('[Reacciones] Problemas en el catálogo:\n' + problemas.join('\n'));
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
    proponerProductos: proponerProductos, reglas: REGLAS_PREDICCION,
    balancearEcuacion: balancearEcuacion, verificarConservacion: verificarConservacion,
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
