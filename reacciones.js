/* =============================================================================
   reacciones.js — Lógica e interfaz de la pestaña Reacciones · Fase 1
   Química UPDS

   Depende únicamente de formulas.js (window.FORMULAS_REACCIONES).
   No usa servicios externos, API ni Internet. No modifica otras pestañas.

   SECCIONES
    1. Configuración
    2. Utilidades generales
    3. Catálogo (lectura de formulas.js)
    4. Fórmulas (análisis sintáctico y validación)
    5. Análisis químico (masas molares, estados de oxidación)
    6. Predicción de productos (reglas deterministas)
    7. Balanceo (independiente de la predicción)
    8. Estado de la pestaña
    9. Vista (construcción y actualización del DOM)
   10. Acciones del usuario
   11. Inicio

   La predicción (sección 6) y el balanceo (sección 7) son independientes:
   el balanceo solo recibe especies ya definidas y no decide qué productos
   se forman.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ===========================================================================
     1. CONFIGURACIÓN
     Se puede sobrescribir antes de cargar este archivo definiendo
     window.REACCIONES_CONFIG = { limiteReactivos: 4, ... }
     ======================================================================== */
  var CONFIG = {
    limiteReactivos: 5,
    limiteProductos: 5,
    maxResultadosBusqueda: 8,
    idContenedor: 'reacciones'
  };
  if (global.REACCIONES_CONFIG) {
    Object.keys(global.REACCIONES_CONFIG).forEach(function (k) {
      CONFIG[k] = global.REACCIONES_CONFIG[k];
    });
  }

  /* ===========================================================================
     2. UTILIDADES GENERALES
     ======================================================================== */
  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function mcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = b; b = a % b; a = t; }
    return a;
  }

  function mcm(a, b) {
    return (a / mcd(a, b)) * b;
  }

  function formatoSigno(n) {
    if (n > 0) return '+' + n;
    if (n < 0) return '\u2212' + Math.abs(n);
    return '0';
  }

  function formatoMasa(n) {
    try {
      return n.toLocaleString('es', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    } catch (e) {
      return n.toFixed(3);
    }
  }

  /* ===========================================================================
     3. CATÁLOGO
     Convierte formulas.js en un índice uniforme { id: sustancia }.
     Forma de una sustancia del índice:
       { id, tipo: 'elemento'|'compuesto'|'ion', formula, nombre, composicion,
         carga, clasificacion, datoDePrueba, numeroAtomico?, masaAtomica?,
         estadosGenerales?: [..], estadosAsignados?: {sym: n} }
     ======================================================================== */
  var CATALOGO = global.FORMULAS_REACCIONES || null;
  var INDICE = {};
  var ORDEN = [];

  function construirIndice() {
    INDICE = {};
    ORDEN = [];
    if (!CATALOGO) return;

    Object.keys(CATALOGO.elementos || {}).forEach(function (sim) {
      var e = CATALOGO.elementos[sim];
      var comp = {}; comp[e.simbolo] = 1;
      registrar({
        id: sim, tipo: 'elemento', formula: e.simbolo, nombre: e.nombre,
        composicion: comp, carga: 0, clasificacion: e.clasificacion,
        numeroAtomico: e.numeroAtomico, masaAtomica: e.masaAtomica,
        estadosGenerales: e.estadosOxidacionGenerales || [],
        estadosAsignados: null, datoDePrueba: !!e.datoDePrueba
      });
    });

    Object.keys(CATALOGO.compuestos || {}).forEach(function (f) {
      var c = CATALOGO.compuestos[f];
      registrar({
        id: f, tipo: 'compuesto', formula: c.formula, nombre: c.nombre,
        composicion: c.composicion, carga: 0, clasificacion: c.clasificacion,
        estadosAsignados: c.oxidacionEnCompuesto || null,
        datoDePrueba: !!c.datoDePrueba
      });
    });

    Object.keys(CATALOGO.iones || {}).forEach(function (f) {
      var i = CATALOGO.iones[f];
      registrar({
        id: f, tipo: 'ion', formula: i.formula, nombre: i.nombre,
        composicion: i.composicion, carga: i.carga, clasificacion: i.clasificacion,
        estadosAsignados: i.oxidacionEnIon || null,
        datoDePrueba: !!i.datoDePrueba
      });
    });
  }

  function registrar(sustancia) {
    if (INDICE[sustancia.id]) {
      console.warn('[Reacciones] Identificador duplicado en el catálogo: ' + sustancia.id);
      return;
    }
    INDICE[sustancia.id] = sustancia;
    ORDEN.push(sustancia.id);
  }

  function obtenerSustancia(id) {
    return INDICE[id] || null;
  }

  /* Busca por fórmula, símbolo o nombre (sin distinguir mayúsculas ni tildes). */
  function buscarSustancias(texto, excluirIds) {
    var q = normalizar(texto);
    if (!q) return [];
    var excl = excluirIds || [];
    var resultados = [];
    ORDEN.forEach(function (id) {
      if (excl.indexOf(id) >= 0) return;
      var s = INDICE[id];
      var campos = [normalizar(s.id), normalizar(s.nombre)];
      var mejor = null;
      campos.forEach(function (c) {
        var puntaje = c === q ? 0 : (c.indexOf(q) === 0 ? 1 : (c.indexOf(q) > 0 ? 2 : null));
        if (puntaje !== null && (mejor === null || puntaje < mejor)) mejor = puntaje;
      });
      if (mejor !== null) resultados.push({ sustancia: s, puntaje: mejor });
    });
    resultados.sort(function (a, b) { return a.puntaje - b.puntaje; });
    return resultados.map(function (r) { return r.sustancia; });
  }

  /* Comprueba la coherencia interna del catálogo. Devuelve lista de problemas. */
  function verificarCatalogo() {
    var problemas = [];
    if (!CATALOGO) return ['formulas.js no está cargado.'];
    ORDEN.forEach(function (id) {
      var s = INDICE[id];
      Object.keys(s.composicion).forEach(function (sim) {
        if (!CATALOGO.elementos[sim]) problemas.push(id + ': el elemento "' + sim + '" no existe en el catálogo.');
        if (!(s.composicion[sim] >= 1) || s.composicion[sim] % 1 !== 0) problemas.push(id + ': cantidad no válida para "' + sim + '".');
      });
      if (s.estadosAsignados) {
        var suma = 0;
        Object.keys(s.composicion).forEach(function (sim) {
          if (s.estadosAsignados[sim] === undefined) {
            problemas.push(id + ': falta el estado de oxidación asignado de "' + sim + '".');
          } else {
            suma += s.estadosAsignados[sim] * s.composicion[sim];
          }
        });
        if (suma !== s.carga) problemas.push(id + ': los estados de oxidación suman ' + suma + ' y la carga es ' + s.carga + '.');
      }
    });
    return problemas;
  }

  /* ===========================================================================
     4. FÓRMULAS
     ======================================================================== */

  /* Convierte una fórmula (p. ej. "Ca(OH)2") en { Ca: 1, O: 2, H: 2 }.
     No valida contra el catálogo: solo la sintaxis. */
  function parsearFormula(texto) {
    var s = String(texto || '').replace(/\s+/g, '');
    if (!s) return { ok: false, error: 'La fórmula está vacía.' };

    var pila = [{}];
    var i = 0;

    function leerNumero() {
      var m = /^\d+/.exec(s.slice(i));
      if (!m) return 1;
      i += m[0].length;
      return parseInt(m[0], 10);
    }

    while (i < s.length) {
      var c = s.charAt(i);
      var tope = pila[pila.length - 1];
      if (c === '(') {
        pila.push({});
        i++;
      } else if (c === ')') {
        if (pila.length < 2) return { ok: false, error: 'Hay un paréntesis de cierre sin apertura.' };
        i++;
        var mult = leerNumero();
        if (mult < 1) return { ok: false, error: 'El subíndice después de un paréntesis debe ser 1 o mayor.' };
        var grupo = pila.pop();
        var destino = pila[pila.length - 1];
        Object.keys(grupo).forEach(function (k) {
          destino[k] = (destino[k] || 0) + grupo[k] * mult;
        });
      } else if (/[A-Z]/.test(c)) {
        var m = /^[A-Z][a-z]?/.exec(s.slice(i));
        var sim = m[0];
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

  /* Valida una fórmula escrita por la persona: sintaxis + elementos del catálogo. */
  function validarFormula(texto) {
    var p = parsearFormula(texto);
    if (!p.ok) return p;
    var desconocidos = Object.keys(p.composicion).filter(function (sim) {
      return !(CATALOGO && CATALOGO.elementos && CATALOGO.elementos[sim]);
    });
    if (desconocidos.length) {
      return { ok: false, composicion: p.composicion, desconocidos: desconocidos,
               error: 'Elemento(s) fuera del catálogo actual: ' + desconocidos.join(', ') + '.' };
    }
    return { ok: true, composicion: p.composicion };
  }

  /* ===========================================================================
     5. ANÁLISIS QUÍMICO
     ======================================================================== */

  /* Masa molar (g/mol) calculada desde la composición. null si falta algún dato. */
  function calcularMasaMolar(composicion) {
    if (!CATALOGO) return null;
    var total = 0;
    var claves = Object.keys(composicion);
    for (var k = 0; k < claves.length; k++) {
      var e = CATALOGO.elementos[claves[k]];
      if (!e || typeof e.masaAtomica !== 'number') return null;
      total += e.masaAtomica * composicion[claves[k]];
    }
    return total;
  }

  /* Devuelve, por separado, los dos tipos de información de oxidación:
     - generales: estados posibles del elemento (no son los de este compuesto).
     - asignados: estados dentro de esta sustancia concreta (o null si no hay dato). */
  function describirOxidacion(sustancia) {
    var elementos = Object.keys(sustancia.composicion).map(function (sim) {
      var e = CATALOGO.elementos[sim];
      return {
        simbolo: sim,
        generales: e ? (e.estadosOxidacionGenerales || []) : [],
        asignado: sustancia.estadosAsignados && sustancia.estadosAsignados[sim] !== undefined
          ? sustancia.estadosAsignados[sim] : null
      };
    });
    return { sustancia: sustancia, elementos: elementos, hayAsignados: !!sustancia.estadosAsignados };
  }

  /* ===========================================================================
     6. PREDICCIÓN DE PRODUCTOS (reglas deterministas)

     REGLAS_PREDICCION está vacío a propósito en la fase 1: no se proponen
     productos que no estén respaldados por una regla verificada.

     Forma de una regla:
       {
         id: 'identificador-unico',
         nombre: 'Nombre legible',
         aplica:    function (reactivos) { return true | false; },
         productos: function (reactivos) { return ['idDelCatalogo', ...]; }
       }
     Los productos devueltos deben existir en formulas.js.
     ======================================================================== */
  var REGLAS_PREDICCION = [];

  function proponerProductos(reactivos) {
    if (!reactivos.length) {
      return { estado: 'sin-reactivos', productos: [],
               mensaje: 'Agrega al menos un reactivo para determinar la reacción.' };
    }
    if (!REGLAS_PREDICCION.length) {
      return { estado: 'sin-reglas', productos: [],
               mensaje: 'Todavía no hay reglas de predicción cargadas, por eso no se propone ningún producto. Esto es esperado en la fase 1.' };
    }

    var aplicables = REGLAS_PREDICCION.filter(function (r) {
      try { return !!r.aplica(reactivos); } catch (e) { return false; }
    });
    if (!aplicables.length) {
      return { estado: 'no-reconocida', productos: [],
               mensaje: 'Reacción no reconocida: ninguna regla disponible aplica a estos reactivos. No se inventan productos.' };
    }

    var conjuntos = {};
    aplicables.forEach(function (r) {
      var ids = r.productos(reactivos) || [];
      conjuntos[ids.slice().sort().join('|')] = { regla: r, ids: ids };
    });
    var claves = Object.keys(conjuntos);
    if (claves.length > 1) {
      return { estado: 'ambigua', productos: [],
               alternativas: claves.map(function (k) { return conjuntos[k].regla.nombre; }),
               mensaje: 'Caso ambiguo: más de una regla aplica y producen resultados distintos (' +
                        claves.map(function (k) { return conjuntos[k].regla.nombre; }).join('; ') +
                        '). Se necesita más información.' };
    }

    var unica = conjuntos[claves[0]];
    var faltantes = unica.ids.filter(function (id) { return !obtenerSustancia(id); });
    if (faltantes.length) {
      return { estado: 'error', productos: [],
               mensaje: 'La regla "' + unica.regla.nombre + '" produce sustancias que no están en el catálogo: ' + faltantes.join(', ') + '.' };
    }
    if (unica.ids.length > CONFIG.limiteProductos) {
      return { estado: 'error', productos: [],
               mensaje: 'La regla produce ' + unica.ids.length + ' productos y el límite configurado es ' + CONFIG.limiteProductos + '.' };
    }
    return { estado: 'propuesta', productos: unica.ids, regla: unica.regla.nombre,
             mensaje: 'Productos propuestos por la regla: ' + unica.regla.nombre + '.' };
  }

  /* ===========================================================================
     7. BALANCEO
     Función independiente. Recibe especies ya definidas:
       reactivos / productos: [{ composicion: {sym: n}, carga: n }]
     Resuelve el sistema lineal de conservación de átomos (y de carga si
     alguna especie tiene carga) con aritmética exacta de fracciones.
     Devuelve:
       { estado: 'ok', coeficientesReactivos: [...], coeficientesProductos: [...] }
       { estado: 'imposible' | 'ambigua' | 'invalida', mensaje }
     ======================================================================== */
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = mcd(n, d) || 1;
    return [n / g, d / g];
  }
  function frSuma(a, b) { return fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
  function frMul(a, b)  { return fr(a[0] * b[0], a[1] * b[1]); }
  function frDiv(a, b)  { return fr(a[0] * b[1], a[1] * b[0]); }

  function balancearEcuacion(reactivos, productos) {
    if (!reactivos.length || !productos.length) {
      return { estado: 'invalida', mensaje: 'Se necesita al menos un reactivo y un producto.' };
    }
    var especies = reactivos.concat(productos);
    var nR = reactivos.length;
    var n = especies.length;

    var elementos = [];
    especies.forEach(function (s) {
      Object.keys(s.composicion).forEach(function (e) {
        if (elementos.indexOf(e) < 0) elementos.push(e);
      });
    });
    var hayCarga = especies.some(function (s) { return !!s.carga; });

    var filas = elementos.map(function (e) {
      return especies.map(function (s, j) {
        return fr((s.composicion[e] || 0) * (j < nR ? 1 : -1));
      });
    });
    if (hayCarga) {
      filas.push(especies.map(function (s, j) {
        return fr((s.carga || 0) * (j < nR ? 1 : -1));
      }));
    }

    /* Reducción de Gauss-Jordan con fracciones exactas. */
    var m = filas.length;
    var pivotes = [];
    var fila = 0;
    for (var col = 0; col < n && fila < m; col++) {
      var p = -1;
      for (var r = fila; r < m; r++) {
        if (filas[r][col][0] !== 0) { p = r; break; }
      }
      if (p < 0) continue;
      var tmp = filas[fila]; filas[fila] = filas[p]; filas[p] = tmp;
      var piv = filas[fila][col];
      filas[fila] = filas[fila].map(function (x) { return frDiv(x, piv); });
      for (var r2 = 0; r2 < m; r2++) {
        if (r2 !== fila && filas[r2][col][0] !== 0) {
          var f = fr(-filas[r2][col][0], filas[r2][col][1]);
          var base = filas[fila];
          filas[r2] = filas[r2].map(function (x, k) { return frSuma(x, frMul(f, base[k])); });
        }
      }
      pivotes.push(col);
      fila++;
    }

    var libres = [];
    for (var c = 0; c < n; c++) { if (pivotes.indexOf(c) < 0) libres.push(c); }

    if (libres.length === 0) {
      return { estado: 'imposible',
               mensaje: 'La ecuación no se puede balancear con estas especies: no existe una combinación de coeficientes que conserve átomos' + (hayCarga ? ' y cargas' : '') + '.' };
    }
    if (libres.length > 1) {
      return { estado: 'ambigua',
               mensaje: 'Hay más de una forma independiente de balancear estas especies (' + libres.length + ' grados de libertad). Se necesita más información sobre la reacción.' };
    }

    var libre = libres[0];
    var x = [];
    for (var k = 0; k < n; k++) x.push(fr(0));
    x[libre] = fr(1);
    pivotes.forEach(function (colPiv, idx) {
      x[colPiv] = frMul(fr(-1), filas[idx][libre]);
    });

    var den = 1;
    x.forEach(function (v) { den = mcm(den, v[1]); });
    var enteros = x.map(function (v) { return v[0] * (den / v[1]); });
    var g = enteros.reduce(function (acc, v) { return mcd(acc, v); }, 0) || 1;
    enteros = enteros.map(function (v) { return v / g; });

    if (enteros.every(function (v) { return v <= 0; })) {
      enteros = enteros.map(function (v) { return -v; });
    }
    if (enteros.some(function (v) { return v <= 0; })) {
      return { estado: 'imposible',
               mensaje: 'La solución matemática requiere coeficientes cero o negativos: estas especies no forman una reacción balanceable tal como se plantea.' };
    }

    return { estado: 'ok',
             coeficientesReactivos: enteros.slice(0, nR),
             coeficientesProductos: enteros.slice(nR) };
  }

  /* Verificación independiente: recalcula átomos y cargas a ambos lados. */
  function verificarConservacion(reactivos, productos, coefR, coefP) {
    function totales(lista, coefs) {
      var at = {}; var carga = 0;
      lista.forEach(function (s, i) {
        Object.keys(s.composicion).forEach(function (e) {
          at[e] = (at[e] || 0) + s.composicion[e] * coefs[i];
        });
        carga += (s.carga || 0) * coefs[i];
      });
      return { atomos: at, carga: carga };
    }
    var a = totales(reactivos, coefR);
    var b = totales(productos, coefP);
    var elementos = Object.keys(a.atomos).concat(Object.keys(b.atomos));
    var atomosOk = elementos.every(function (e) { return (a.atomos[e] || 0) === (b.atomos[e] || 0); });
    return { atomos: atomosOk, carga: a.carga === b.carga, izquierda: a, derecha: b };
  }

  /* ===========================================================================
     8. ESTADO DE LA PESTAÑA
     ======================================================================== */
  var estado = {
    reactivos: [],       // ids del catálogo
    productos: [],       // ids propuestos por reglas
    balanceo: null       // resultado de balancearEcuacion + verificación
  };

  function invalidarResultados() {
    estado.productos = [];
    estado.balanceo = null;
  }

  /* ===========================================================================
     9. VISTA
     ======================================================================== */
  var $ = {};   // referencias a nodos

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

  function limpiar(nodo) {
    while (nodo.firstChild) nodo.removeChild(nodo.firstChild);
  }

  /* Fórmula con subíndices y, para iones, carga en superíndice. */
  function formulaNodos(sustancia) {
    var frag = document.createDocumentFragment();
    var texto = sustancia.formula;
    var carga = '';
    if (sustancia.tipo === 'ion') {
      var m = /^(.*?)(\d*[+-])$/.exec(texto);
      if (m) { texto = m[1]; carga = m[2]; }
    }
    for (var i = 0; i < texto.length; i++) {
      var ch = texto.charAt(i);
      if (/\d/.test(ch)) frag.appendChild(el('sub', { text: ch }));
      else frag.appendChild(document.createTextNode(ch));
    }
    if (carga) {
      var signo = carga.slice(-1) === '-' ? '\u2212' : '+';
      var cifra = carga.slice(0, -1);
      frag.appendChild(el('sup', { text: (cifra === '1' ? '' : cifra) + signo }));
    }
    return frag;
  }

  function resumenFicha(s) {
    var masa = calcularMasaMolar(s.composicion);
    var txtMasa = masa === null ? 'masa sin datos' : formatoMasa(masa) + ' g/mol';
    if (s.tipo === 'elemento') return 'Z ' + s.numeroAtomico + ' \u00b7 ' + txtMasa;
    if (s.tipo === 'ion') return 'carga ' + formatoSigno(s.carga) + ' \u00b7 ' + txtMasa;
    return txtMasa;
  }

  function crearFicha(s, onQuitar) {
    var ficha = el('article', { class: 'rxn-ficha rxn-ficha--' + s.tipo, 'data-id': s.id,
                                title: s.nombre + (s.datoDePrueba ? ' (dato de prueba)' : '') });
    if (onQuitar) {
      ficha.appendChild(el('button', {
        type: 'button', class: 'rxn-ficha-quitar',
        'aria-label': 'Quitar ' + s.nombre, onclick: function () { onQuitar(s.id); }
      }, ['\u00d7']));
    }
    ficha.appendChild(el('div', { class: 'rxn-ficha-formula' }, [formulaNodos(s)]));
    ficha.appendChild(el('div', { class: 'rxn-ficha-nombre', text: s.nombre }));
    ficha.appendChild(el('div', { class: 'rxn-ficha-info', text: resumenFicha(s) }));
    if (s.datoDePrueba) ficha.appendChild(el('span', { class: 'rxn-ficha-prueba', text: 'prueba' }));
    return ficha;
  }

  function mostrarMensaje(nodo, tipo, texto) {
    if (!texto) { nodo.hidden = true; nodo.textContent = ''; return; }
    nodo.className = 'rxn-msg rxn-msg--' + tipo;
    nodo.textContent = texto;
    nodo.hidden = false;
  }

  function tarjeta(titulo, idCuerpo, textoPendiente) {
    var cuerpo = el('div', { class: 'rxn-tarjeta-cuerpo', id: idCuerpo }, [
      el('p', { class: 'rxn-pendiente', text: textoPendiente })
    ]);
    $[idCuerpo] = cuerpo;
    return el('details', { class: 'rxn-tarjeta' }, [el('summary', { text: titulo }), cuerpo]);
  }

  function construirVista(contenedor) {
    var raiz = el('div', { class: 'rxn-root' });

    raiz.appendChild(el('header', { class: 'rxn-encabezado' }, [
      el('h2', { class: 'rxn-titulo', text: 'Reacciones químicas' }),
      el('p', { class: 'rxn-aviso',
                text: 'Fase 1: estructura provisional. El catálogo contiene solo registros de prueba y todavía no hay reglas de predicción.' })
    ]));

    /* --- Reactivos de entrada --- */
    $.contadorReactivos = el('span', { class: 'rxn-contador' });
    $.buscador = el('input', {
      type: 'search', id: 'rxn-buscar', class: 'rxn-input', autocomplete: 'off',
      placeholder: 'Buscar elemento o compuesto', 'aria-controls': 'rxn-resultados',
      oninput: onBuscarInput, onkeydown: onBuscarTecla
    });
    $.btnAgregar = el('button', { type: 'button', class: 'rxn-btn rxn-btn--secundario',
                                  onclick: function () { agregarDesdeTexto($.buscador.value); } }, ['Agregar']);
    $.resultados = el('ul', { class: 'rxn-resultados', id: 'rxn-resultados', role: 'listbox', hidden: true });
    $.msgBuscador = el('p', { class: 'rxn-msg', role: 'status', hidden: true });
    $.fichasReactivos = el('div', { class: 'rxn-fichas' });
    $.vacioReactivos = el('p', { class: 'rxn-vacio',
                                 text: 'Aún no hay reactivos. Busca una sustancia y agrégala.' });
    $.btnDeterminar = el('button', { type: 'button', class: 'rxn-btn rxn-btn--primario rxn-btn--ancho',
                                     onclick: determinarReaccion }, ['Determinar reacción']);

    raiz.appendChild(el('section', { class: 'rxn-seccion' }, [
      el('div', { class: 'rxn-seccion-cabecera' }, [
        el('h3', { class: 'rxn-seccion-titulo', text: 'Reactivos de entrada' }), $.contadorReactivos
      ]),
      el('label', { class: 'rxn-solo-lector', for: 'rxn-buscar', text: 'Buscar elemento o compuesto' }),
      el('div', { class: 'rxn-buscador' }, [$.buscador, $.btnAgregar, $.resultados]),
      $.msgBuscador, $.fichasReactivos, $.vacioReactivos, $.btnDeterminar
    ]));

    /* --- Productos propuestos --- */
    $.contadorProductos = el('span', { class: 'rxn-contador' });
    $.msgProductos = el('p', { class: 'rxn-msg', role: 'status', hidden: true });
    $.fichasProductos = el('div', { class: 'rxn-fichas' });
    $.vacioProductos = el('p', { class: 'rxn-vacio',
                                 text: 'Los productos aparecerán aquí cuando exista una regla que los respalde.' });
    $.btnBalancear = el('button', { type: 'button', class: 'rxn-btn rxn-btn--secundario rxn-btn--ancho',
                                    onclick: balancear }, ['Balancear ecuación']);

    raiz.appendChild(el('section', { class: 'rxn-seccion' }, [
      el('div', { class: 'rxn-seccion-cabecera' }, [
        el('h3', { class: 'rxn-seccion-titulo', text: 'Productos propuestos' }), $.contadorProductos
      ]),
      $.msgProductos, $.fichasProductos, $.vacioProductos, $.btnBalancear
    ]));

    /* --- Ecuación balanceada --- */
    $.ecuacion = el('div', { class: 'rxn-ecuacion rxn-ecuacion-vacia' });
    $.msgEcuacion = el('p', { class: 'rxn-msg', role: 'status', hidden: true });
    raiz.appendChild(el('section', { class: 'rxn-seccion' }, [
      el('div', { class: 'rxn-seccion-cabecera' }, [
        el('h3', { class: 'rxn-seccion-titulo', text: 'Ecuación balanceada' })
      ]),
      $.ecuacion, $.msgEcuacion
    ]));

    /* --- Análisis (tarjetas desplegables) --- */
    raiz.appendChild(el('section', { class: 'rxn-seccion' }, [
      el('div', { class: 'rxn-seccion-cabecera' }, [
        el('h3', { class: 'rxn-seccion-titulo', text: 'Análisis de la reacción' })
      ]),
      tarjeta('Tipo de reacción', 'rxn-cuerpo-tipo',
              'Pendiente: se mostrará cuando exista una reacción determinada.'),
      tarjeta('Estados de oxidación', 'rxn-cuerpo-oxidacion',
              'Agrega reactivos para ver sus estados de oxidación.'),
      tarjeta('Oxidación-reducción', 'rxn-cuerpo-redox',
              'Pendiente: requiere una reacción determinada y balanceada.'),
      tarjeta('Masas molares', 'rxn-cuerpo-masas',
              'Agrega reactivos para ver sus masas molares.'),
      tarjeta('Relaciones estequiométricas', 'rxn-cuerpo-estequiometria',
              'Pendiente: requiere una ecuación balanceada.')
    ]));

    contenedor.appendChild(raiz);
    document.addEventListener('click', function (ev) {
      if (!ev.target.closest || !ev.target.closest('#' + CONFIG.idContenedor + ' .rxn-buscador')) {
        ocultarResultados();
      }
    });
  }

  /* ----- Actualización de cada zona ----- */

  function renderReactivos() {
    limpiar($.fichasReactivos);
    estado.reactivos.forEach(function (id) {
      $.fichasReactivos.appendChild(crearFicha(obtenerSustancia(id), quitarReactivo));
    });
    $.vacioReactivos.hidden = estado.reactivos.length > 0;
    $.contadorReactivos.textContent = estado.reactivos.length + ' / ' + CONFIG.limiteReactivos;
    $.btnDeterminar.disabled = estado.reactivos.length === 0;
    $.btnAgregar.disabled = estado.reactivos.length >= CONFIG.limiteReactivos;
  }

  function renderProductos() {
    limpiar($.fichasProductos);
    estado.productos.forEach(function (id) {
      $.fichasProductos.appendChild(crearFicha(obtenerSustancia(id), null));
    });
    $.vacioProductos.hidden = estado.productos.length > 0;
    $.contadorProductos.textContent = estado.productos.length + ' / ' + CONFIG.limiteProductos;
    $.btnBalancear.disabled = estado.productos.length === 0;
  }

  function nodoEcuacion(reactivos, coefR, productos, coefP) {
    var frag = document.createDocumentFragment();
    function lado(lista, coefs) {
      lista.forEach(function (s, i) {
        if (i > 0) frag.appendChild(el('span', { class: 'rxn-ecuacion-signo', text: '+' }));
        if (coefs[i] !== 1) frag.appendChild(el('span', { class: 'rxn-ecuacion-coef', text: String(coefs[i]) }));
        frag.appendChild(el('span', {}, [formulaNodos(s)]));
      });
    }
    lado(reactivos, coefR);
    frag.appendChild(el('span', { class: 'rxn-ecuacion-flecha', text: '\u2192' }));
    lado(productos, coefP);
    return frag;
  }

  function renderEcuacion() {
    limpiar($.ecuacion);
    var b = estado.balanceo;
    if (b && b.estado === 'ok' && b.conservacion && b.conservacion.atomos && b.conservacion.carga) {
      $.ecuacion.className = 'rxn-ecuacion';
      var R = estado.reactivos.map(obtenerSustancia);
      var P = estado.productos.map(obtenerSustancia);
      $.ecuacion.appendChild(nodoEcuacion(R, b.coeficientesReactivos, P, b.coeficientesProductos));
      mostrarMensaje($.msgEcuacion, 'info',
        'Conservación verificada: átomos' + (R.concat(P).some(function (s) { return s.carga; }) ? ' y carga' : '') + '.');
    } else {
      $.ecuacion.className = 'rxn-ecuacion rxn-ecuacion-vacia';
      $.ecuacion.textContent = 'Todavía no hay una ecuación balanceada.';
      if (b && b.estado !== 'ok') mostrarMensaje($.msgEcuacion, 'error', b.mensaje);
      else if (b && b.estado === 'ok') mostrarMensaje($.msgEcuacion, 'error', 'El balanceo no superó la verificación de conservación; no se muestra.');
      else mostrarMensaje($.msgEcuacion, '', '');
    }
  }

  function parrafo(texto, clase) {
    return el('p', { class: clase || null, text: texto });
  }

  function renderAnalisis() {
    var reactivos = estado.reactivos.map(obtenerSustancia);

    /* Estados de oxidación: generales y asignados se presentan por separado. */
    var ox = $['rxn-cuerpo-oxidacion'];
    limpiar(ox);
    if (!reactivos.length) {
      ox.appendChild(parrafo('Agrega reactivos para ver sus estados de oxidación.', 'rxn-pendiente'));
    } else {
      reactivos.forEach(function (s) {
        var d = describirOxidacion(s);
        ox.appendChild(el('p', {}, [el('strong', {}, [formulaNodos(s)]), ' \u2014 ' + s.nombre]));
        var generales = d.elementos.map(function (e) {
          return e.simbolo + ': ' + (e.generales.length ? e.generales.map(formatoSigno).join(', ') : 'sin datos');
        }).join(' \u00b7 ');
        ox.appendChild(parrafo('Estados generales posibles del elemento (no necesariamente los de esta sustancia): ' + generales, 'rxn-dato-sub'));
        if (d.hayAsignados) {
          ox.appendChild(parrafo('Asignados en esta sustancia: ' + d.elementos.map(function (e) {
            return e.simbolo + ' ' + (e.asignado === null ? 'sin dato' : formatoSigno(e.asignado));
          }).join(', '), 'rxn-dato-sub'));
        } else {
          ox.appendChild(parrafo('Asignados en esta sustancia: sin datos cargados.', 'rxn-dato-sub'));
        }
      });
    }

    /* Masas molares */
    var mm = $['rxn-cuerpo-masas'];
    limpiar(mm);
    if (!reactivos.length) {
      mm.appendChild(parrafo('Agrega reactivos para ver sus masas molares.', 'rxn-pendiente'));
    } else {
      reactivos.forEach(function (s) {
        var masa = calcularMasaMolar(s.composicion);
        mm.appendChild(el('p', {}, [
          el('strong', {}, [formulaNodos(s)]),
          ' \u2014 ' + (masa === null ? 'sin datos suficientes' : formatoMasa(masa) + ' g/mol')
        ]));
      });
    }
  }

  function renderTodo() {
    renderReactivos();
    renderProductos();
    renderEcuacion();
    renderAnalisis();
  }

  /* ----- Resultados de búsqueda ----- */

  function ocultarResultados() {
    if ($.resultados) { $.resultados.hidden = true; limpiar($.resultados); }
  }

  function onBuscarInput() {
    mostrarMensaje($.msgBuscador, '', '');
    var texto = $.buscador.value;
    if (!normalizar(texto)) { ocultarResultados(); return; }
    var lista = buscarSustancias(texto, estado.reactivos).slice(0, CONFIG.maxResultadosBusqueda);
    limpiar($.resultados);
    if (!lista.length) {
      $.resultados.appendChild(el('li', { class: 'rxn-resultado-vacio',
                                          text: 'Sin coincidencias en el catálogo actual.' }));
    } else {
      lista.forEach(function (s) {
        $.resultados.appendChild(el('li', { role: 'option' }, [
          el('button', { type: 'button', class: 'rxn-resultado', onclick: function () { agregarReactivo(s.id); } }, [
            el('span', { class: 'rxn-resultado-formula' }, [formulaNodos(s)]),
            el('span', { class: 'rxn-resultado-nombre', text: s.nombre }),
            el('span', { class: 'rxn-resultado-tipo', text: s.tipo })
          ])
        ]));
      });
    }
    $.resultados.hidden = false;
  }

  function onBuscarTecla(ev) {
    if (ev.key === 'Enter') { ev.preventDefault(); agregarDesdeTexto($.buscador.value); }
    else if (ev.key === 'Escape') { ocultarResultados(); }
  }

  /* ===========================================================================
     10. ACCIONES DEL USUARIO
     ======================================================================== */

  function agregarReactivo(id) {
    var s = obtenerSustancia(id);
    if (!s) { mostrarMensaje($.msgBuscador, 'error', 'La sustancia "' + id + '" no existe en el catálogo.'); return false; }
    if (estado.reactivos.indexOf(id) >= 0) {
      mostrarMensaje($.msgBuscador, 'aviso', s.nombre + ' ya está en la lista de reactivos.');
      return false;
    }
    if (estado.reactivos.length >= CONFIG.limiteReactivos) {
      mostrarMensaje($.msgBuscador, 'error', 'Se alcanzó el límite de ' + CONFIG.limiteReactivos + ' reactivos. Quita uno para agregar otro.');
      return false;
    }
    estado.reactivos.push(id);
    invalidarResultados();
    mostrarMensaje($.msgProductos, '', '');
    $.buscador.value = '';
    ocultarResultados();
    mostrarMensaje($.msgBuscador, '', '');
    renderTodo();
    return true;
  }

  function quitarReactivo(id) {
    var i = estado.reactivos.indexOf(id);
    if (i < 0) return;
    estado.reactivos.splice(i, 1);
    invalidarResultados();
    mostrarMensaje($.msgProductos, '', '');
    mostrarMensaje($.msgBuscador, '', '');
    renderTodo();
  }

  function agregarDesdeTexto(texto) {
    var q = normalizar(texto);
    if (!q) {
      mostrarMensaje($.msgBuscador, 'error', 'Escribe un símbolo, una fórmula o un nombre.');
      return;
    }
    var lista = buscarSustancias(texto, []);
    var exacta = lista.filter(function (s) {
      return normalizar(s.id) === q || normalizar(s.nombre) === q;
    });
    if (exacta.length === 1) { agregarReactivo(exacta[0].id); return; }
    if (lista.length === 1)  { agregarReactivo(lista[0].id); return; }
    if (lista.length > 1) {
      mostrarMensaje($.msgBuscador, 'aviso', 'Hay varias coincidencias. Elige una de la lista.');
      onBuscarInput();
      return;
    }
    ocultarResultados();
    var v = validarFormula(texto);
    if (!v.ok) {
      mostrarMensaje($.msgBuscador, 'error', '"' + texto.trim() + '" no se puede agregar. ' + v.error);
    } else {
      mostrarMensaje($.msgBuscador, 'aviso',
        '"' + texto.trim() + '" es una fórmula válida, pero no está en el catálogo actual (solo hay registros de prueba).');
    }
  }

  function determinarReaccion() {
    var reactivos = estado.reactivos.map(obtenerSustancia);
    var r = proponerProductos(reactivos);
    estado.balanceo = null;
    estado.productos = r.estado === 'propuesta' ? r.productos.slice() : [];
    var tipo = r.estado === 'propuesta' ? 'info' : (r.estado === 'sin-reglas' ? 'aviso' : 'error');
    if (r.estado === 'sin-reactivos' || r.estado === 'ambigua' || r.estado === 'no-reconocida') tipo = 'aviso';
    mostrarMensaje($.msgProductos, tipo, r.mensaje);
    renderProductos();
    renderEcuacion();
  }

  function balancear() {
    mostrarMensaje($.msgEcuacion, '', '');
    if (!estado.productos.length) {
      estado.balanceo = { estado: 'invalida', mensaje: 'Primero determina los productos: no hay productos que balancear.' };
      renderEcuacion();
      return;
    }
    var R = estado.reactivos.map(obtenerSustancia);
    var P = estado.productos.map(obtenerSustancia);
    var res = balancearEcuacion(R, P);
    if (res.estado === 'ok') {
      res.conservacion = verificarConservacion(R, P, res.coeficientesReactivos, res.coeficientesProductos);
    }
    estado.balanceo = res;
    renderEcuacion();
  }

  /* ===========================================================================
     11. INICIO
     ======================================================================== */
  function iniciar() {
    var contenedor = document.getElementById(CONFIG.idContenedor);
    if (!contenedor) {
      console.warn('[Reacciones] No se encontró #' + CONFIG.idContenedor + '. No se inicializa la pestaña.');
      return;
    }
    if (!CATALOGO) {
      console.error('[Reacciones] formulas.js no está cargado; se conserva el contenido original de la pestaña.');
      return;
    }
    try {
      construirIndice();
      var problemas = verificarCatalogo();
      if (problemas.length) console.warn('[Reacciones] Problemas en el catálogo:\n' + problemas.join('\n'));

      /* Se construye aparte y solo se reemplaza el contenido si todo salió bien. */
      var temporal = document.createElement('div');
      construirVista(temporal);
      limpiar(contenedor);
      while (temporal.firstChild) contenedor.appendChild(temporal.firstChild);
      renderTodo();
    } catch (err) {
      console.error('[Reacciones] Error al construir la pestaña:', err);
    }
  }

  /* API pública mínima (útil para pruebas desde la consola). */
  var API = {
    config: CONFIG,
    parsearFormula: parsearFormula,
    validarFormula: validarFormula,
    calcularMasaMolar: calcularMasaMolar,
    balancearEcuacion: balancearEcuacion,
    verificarConservacion: verificarConservacion,
    proponerProductos: proponerProductos,
    reglas: REGLAS_PREDICCION,
    verificarCatalogo: verificarCatalogo,
    buscarSustancias: buscarSustancias,
    obtenerSustancia: obtenerSustancia,
    _construirIndice: construirIndice
  };
  global.ReaccionesUPDS = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
    else iniciar();
  }
})(typeof window !== 'undefined' ? window : globalThis);
