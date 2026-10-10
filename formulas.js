/* =============================================================================
   formulas.js — Banco de información química de la pestaña Reacciones
   Química UPDS · Fase 1

   Este archivo SOLO contiene datos. No tiene lógica de interfaz ni de cálculo.
   Es independiente de datos.js, tabla.js y de los módulos de Compuestos.

   ESTRUCTURA
   - meta:       versión y avisos del catálogo.
   - elementos:  un registro por elemento. Clave = símbolo.
   - compuestos: sustancias moleculares o iónicas neutras (incluye sustancias
                 simples como H2 y O2). Clave = fórmula.
   - iones:      especies con carga. Clave = fórmula con carga (p. ej. "Na+").

   DISTINCIÓN IMPORTANTE ENTRE ESTADOS DE OXIDACIÓN
   - elementos[x].estadosOxidacionGenerales
       Lista de estados que el elemento puede presentar en general. NO significa
       que los tenga en una sustancia concreta, ni que sea el único posible.
   - compuestos[f].oxidacionEnCompuesto  /  iones[f].oxidacionEnIon
       Estado asignado a cada elemento DENTRO de esa sustancia concreta.
       Si falta este campo, el dato no está cargado (no se asume).

   CAMPOS DERIVADOS
   Las masas molares NO se guardan: se calculan en reacciones.js a partir de
   `composicion` y `masaAtomica`, para que no puedan quedar inconsistentes.

   DATOS DE PRUEBA
   Todos los registros actuales llevan `datoDePrueba: true`. Sirven únicamente
   para comprobar la estructura en la fase 1; no son un catálogo completo.
   Al verificar y ampliar un registro, cambia ese campo a false (o elimínalo).

   CÓMO AMPLIAR
   Agrega nuevos registros siguiendo exactamente la forma de los existentes.
   reacciones.js ejecuta una verificación de integridad al iniciar y avisa por
   consola si un registro es inconsistente.
   ========================================================================== */

(function (global) {
  'use strict';

  var CATALOGO = {

    meta: {
      version: '0.1-fase1',
      datosDePrueba: true,
      nota: 'Catálogo reducido de prueba. No representa todas las sustancias.'
    },

    /* ---------------------------------------------------------------- ELEMENTOS
       masaAtomica en u (g/mol). Valores estándar redondeados. */
    elementos: {
      H:  { simbolo: 'H',  nombre: 'Hidrógeno', numeroAtomico: 1,  masaAtomica: 1.008,  clasificacion: 'no metal',
            estadosOxidacionGenerales: [-1, 1],        datoDePrueba: true },
      O:  { simbolo: 'O',  nombre: 'Oxígeno',   numeroAtomico: 8,  masaAtomica: 15.999, clasificacion: 'no metal',
            estadosOxidacionGenerales: [-2, -1, 2],    datoDePrueba: true },
      Na: { simbolo: 'Na', nombre: 'Sodio',     numeroAtomico: 11, masaAtomica: 22.990, clasificacion: 'metal alcalino',
            estadosOxidacionGenerales: [1],            datoDePrueba: true },
      Cl: { simbolo: 'Cl', nombre: 'Cloro',     numeroAtomico: 17, masaAtomica: 35.45,  clasificacion: 'halógeno',
            estadosOxidacionGenerales: [-1, 1, 3, 5, 7], datoDePrueba: true },
      Fe: { simbolo: 'Fe', nombre: 'Hierro',    numeroAtomico: 26, masaAtomica: 55.845, clasificacion: 'metal de transición',
            estadosOxidacionGenerales: [2, 3],         datoDePrueba: true }
    },

    /* --------------------------------------------------------------- COMPUESTOS
       composicion: { símbolo: cantidad de átomos por unidad fórmula }.
       oxidacionEnCompuesto: { símbolo: estado asignado en esta sustancia }. */
    compuestos: {
      H2:   { formula: 'H2',   nombre: 'Hidrógeno molecular', composicion: { H: 2 },
              clasificacion: 'sustancia simple',
              oxidacionEnCompuesto: { H: 0 }, datoDePrueba: true },
      O2:   { formula: 'O2',   nombre: 'Oxígeno molecular',   composicion: { O: 2 },
              clasificacion: 'sustancia simple',
              oxidacionEnCompuesto: { O: 0 }, datoDePrueba: true },
      H2O:  { formula: 'H2O',  nombre: 'Agua',                composicion: { H: 2, O: 1 },
              clasificacion: 'compuesto binario',
              oxidacionEnCompuesto: { H: 1, O: -2 }, datoDePrueba: true },
      NaCl: { formula: 'NaCl', nombre: 'Cloruro de sodio',    composicion: { Na: 1, Cl: 1 },
              clasificacion: 'sal binaria',
              oxidacionEnCompuesto: { Na: 1, Cl: -1 }, datoDePrueba: true },
      HCl:  { formula: 'HCl',  nombre: 'Cloruro de hidrógeno', composicion: { H: 1, Cl: 1 },
              clasificacion: 'hidrácido',
              oxidacionEnCompuesto: { H: 1, Cl: -1 }, datoDePrueba: true },
      NaOH: { formula: 'NaOH', nombre: 'Hidróxido de sodio',  composicion: { Na: 1, O: 1, H: 1 },
              clasificacion: 'hidróxido',
              oxidacionEnCompuesto: { Na: 1, O: -2, H: 1 }, datoDePrueba: true }
    },

    /* -------------------------------------------------------------------- IONES
       carga: entero con signo. */
    iones: {
      'Na+': { formula: 'Na+', nombre: 'Ion sodio',     carga: 1,  composicion: { Na: 1 },
               clasificacion: 'catión',
               oxidacionEnIon: { Na: 1 }, datoDePrueba: true },
      'Cl-': { formula: 'Cl-', nombre: 'Ion cloruro',   carga: -1, composicion: { Cl: 1 },
               clasificacion: 'anión',
               oxidacionEnIon: { Cl: -1 }, datoDePrueba: true },
      'OH-': { formula: 'OH-', nombre: 'Ion hidróxido', carga: -1, composicion: { O: 1, H: 1 },
               clasificacion: 'anión poliatómico',
               oxidacionEnIon: { O: -2, H: 1 }, datoDePrueba: true }
    }
  };

  global.FORMULAS_REACCIONES = CATALOGO;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CATALOGO;
  }
})(typeof window !== 'undefined' ? window : globalThis);
