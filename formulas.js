/* =============================================================================
   formulas.js — Banco de información química de la pestaña Reacciones
   QuímicApp (Química UPDS) · Catálogo v0.2

   Este archivo SOLO contiene datos. No tiene lógica de interfaz ni de cálculo.

   ESTRUCTURA
   - meta:       versión y avisos del catálogo.
   - elementos:  un registro por elemento. Clave = símbolo.
   - compuestos: sustancias neutras (incluye sustancias simples como H2, O2).
                 Clave = fórmula.
   - iones:      especies con carga. Clave = fórmula con carga.
                 Formato de la clave: "Na+", "Cl-", "SO4^2-", "Fe^3+".
                 (la carga múltiple lleva "^" para no confundirla con subíndices)

   CAMPOS CLAVE
   - composicion: { símbolo: átomos por unidad fórmula }. De aquí reacciones.js
     calcula las masas molares (NO se guardan masas molares, para evitar
     inconsistencias).
   - elementos[x].estadosOxidacionGenerales: estados posibles del elemento en
     general. No son los de una sustancia concreta.
   - compuestos[f].oxidacionEnCompuesto / iones[f].oxidacionEnIon: estado de
     cada elemento DENTRO de esa sustancia. La suma (estado × átomos) debe ser
     igual a la carga (0 en compuestos). reacciones.js lo verifica al iniciar.
     Para especies donde el número es un promedio ambiguo, el campo se omite.

   CLASIFICACIONES DE COMPUESTOS
   'elemento' (sustancia simple), 'acido', 'base', 'sal', 'oxido', 'agua',
   'peroxido', 'hidrocarburo'.

   DATOS DE PRUEBA
   Todos los registros llevan datoDePrueba: true hasta que los verifiques.
   Al verificar uno, cámbialo a false (o elimina el campo).

   CÓMO AMPLIAR
   Copia un registro existente, cambia sus datos y comprueba la consola:
   reacciones.js avisa si algo es inconsistente.
   ========================================================================== */

(function (global) {
  'use strict';

  var CATALOGO = {

    meta: {
      version: '0.2',
      datosDePrueba: true,
      nota: 'Catálogo de trabajo para prácticas y exámenes introductorios. ' +
            'Masas atómicas estándar redondeadas (g/mol). Verificar antes de usar como referencia oficial.'
    },

    /* ================================================================ ELEMENTOS
       masaAtomica en u (equivale a g/mol). */
    elementos: {
      H:  { simbolo: 'H',  nombre: 'Hidrógeno',  numeroAtomico: 1,  masaAtomica: 1.008,   clasificacion: 'no metal',
            estadosOxidacionGenerales: [-1, 1],                 datoDePrueba: true },
      C:  { simbolo: 'C',  nombre: 'Carbono',    numeroAtomico: 6,  masaAtomica: 12.011,  clasificacion: 'no metal',
            estadosOxidacionGenerales: [-4, 2, 4],              datoDePrueba: true },
      N:  { simbolo: 'N',  nombre: 'Nitrógeno',  numeroAtomico: 7,  masaAtomica: 14.007,  clasificacion: 'no metal',
            estadosOxidacionGenerales: [-3, 3, 5],              datoDePrueba: true },
      O:  { simbolo: 'O',  nombre: 'Oxígeno',    numeroAtomico: 8,  masaAtomica: 15.999,  clasificacion: 'no metal',
            estadosOxidacionGenerales: [-2, -1],                datoDePrueba: true },
      Na: { simbolo: 'Na', nombre: 'Sodio',      numeroAtomico: 11, masaAtomica: 22.990,  clasificacion: 'metal alcalino',
            estadosOxidacionGenerales: [1],                     datoDePrueba: true },
      Mg: { simbolo: 'Mg', nombre: 'Magnesio',   numeroAtomico: 12, masaAtomica: 24.305,  clasificacion: 'metal alcalinotérreo',
            estadosOxidacionGenerales: [2],                     datoDePrueba: true },
      Al: { simbolo: 'Al', nombre: 'Aluminio',   numeroAtomico: 13, masaAtomica: 26.982,  clasificacion: 'metal post-transición',
            estadosOxidacionGenerales: [3],                     datoDePrueba: true },
      P:  { simbolo: 'P',  nombre: 'Fósforo',    numeroAtomico: 15, masaAtomica: 30.974,  clasificacion: 'no metal',
            estadosOxidacionGenerales: [-3, 3, 5],              datoDePrueba: true },
      S:  { simbolo: 'S',  nombre: 'Azufre',     numeroAtomico: 16, masaAtomica: 32.06,   clasificacion: 'no metal',
            estadosOxidacionGenerales: [-2, 4, 6],              datoDePrueba: true },
      Cl: { simbolo: 'Cl', nombre: 'Cloro',      numeroAtomico: 17, masaAtomica: 35.45,   clasificacion: 'halógeno',
            estadosOxidacionGenerales: [-1, 1, 3, 5, 7],        datoDePrueba: true },
      K:  { simbolo: 'K',  nombre: 'Potasio',    numeroAtomico: 19, masaAtomica: 39.098,  clasificacion: 'metal alcalino',
            estadosOxidacionGenerales: [1],                     datoDePrueba: true },
      Ca: { simbolo: 'Ca', nombre: 'Calcio',     numeroAtomico: 20, masaAtomica: 40.078,  clasificacion: 'metal alcalinotérreo',
            estadosOxidacionGenerales: [2],                     datoDePrueba: true },
      Mn: { simbolo: 'Mn', nombre: 'Manganeso',  numeroAtomico: 25, masaAtomica: 54.938,  clasificacion: 'metal de transición',
            estadosOxidacionGenerales: [2, 3, 4, 6, 7],         datoDePrueba: true },
      Fe: { simbolo: 'Fe', nombre: 'Hierro',     numeroAtomico: 26, masaAtomica: 55.845,  clasificacion: 'metal de transición',
            estadosOxidacionGenerales: [2, 3],                  datoDePrueba: true },
      Cu: { simbolo: 'Cu', nombre: 'Cobre',      numeroAtomico: 29, masaAtomica: 63.546,  clasificacion: 'metal de transición',
            estadosOxidacionGenerales: [1, 2],                  datoDePrueba: true },
      Zn: { simbolo: 'Zn', nombre: 'Zinc',       numeroAtomico: 30, masaAtomica: 65.38,   clasificacion: 'metal de transición',
            estadosOxidacionGenerales: [2],                     datoDePrueba: true },
      Br: { simbolo: 'Br', nombre: 'Bromo',      numeroAtomico: 35, masaAtomica: 79.904,  clasificacion: 'halógeno',
            estadosOxidacionGenerales: [-1, 1, 3, 5, 7],        datoDePrueba: true },
      Ag: { simbolo: 'Ag', nombre: 'Plata',      numeroAtomico: 47, masaAtomica: 107.868, clasificacion: 'metal de transición',
            estadosOxidacionGenerales: [1],                     datoDePrueba: true },
      I:  { simbolo: 'I',  nombre: 'Yodo',       numeroAtomico: 53, masaAtomica: 126.904, clasificacion: 'halógeno',
            estadosOxidacionGenerales: [-1, 1, 3, 5, 7],        datoDePrueba: true }
    },

    /* =============================================================== COMPUESTOS
       Cada registro: formula, nombre, clasificacion, composicion,
       oxidacionEnCompuesto, datoDePrueba. */
    compuestos: {

      /* ---- Sustancias simples ---- */
      H2:  { formula: 'H2',  nombre: 'Hidrógeno molecular', clasificacion: 'elemento',
             composicion: { H: 2 },  oxidacionEnCompuesto: { H: 0 },  datoDePrueba: true },
      O2:  { formula: 'O2',  nombre: 'Oxígeno molecular',   clasificacion: 'elemento',
             composicion: { O: 2 },  oxidacionEnCompuesto: { O: 0 },  datoDePrueba: true },
      N2:  { formula: 'N2',  nombre: 'Nitrógeno molecular', clasificacion: 'elemento',
             composicion: { N: 2 },  oxidacionEnCompuesto: { N: 0 },  datoDePrueba: true },
      Cl2: { formula: 'Cl2', nombre: 'Cloro molecular',     clasificacion: 'elemento',
             composicion: { Cl: 2 }, oxidacionEnCompuesto: { Cl: 0 }, datoDePrueba: true },
      Br2: { formula: 'Br2', nombre: 'Bromo molecular',     clasificacion: 'elemento',
             composicion: { Br: 2 }, oxidacionEnCompuesto: { Br: 0 }, datoDePrueba: true },
      I2:  { formula: 'I2',  nombre: 'Yodo molecular',      clasificacion: 'elemento',
             composicion: { I: 2 },  oxidacionEnCompuesto: { I: 0 },  datoDePrueba: true },

      /* ---- Agua y peróxido ---- */
      H2O:  { formula: 'H2O',  nombre: 'Agua',                  clasificacion: 'agua',
              composicion: { H: 2, O: 1 }, oxidacionEnCompuesto: { H: 1, O: -2 }, datoDePrueba: true },
      H2O2: { formula: 'H2O2', nombre: 'Peróxido de hidrógeno', clasificacion: 'peroxido',
              composicion: { H: 2, O: 2 }, oxidacionEnCompuesto: { H: 1, O: -1 }, datoDePrueba: true },

      /* ---- Ácidos ---- */
      H2SO4: { formula: 'H2SO4', nombre: 'Ácido sulfúrico',      clasificacion: 'acido',
               composicion: { H: 2, S: 1, O: 4 }, oxidacionEnCompuesto: { H: 1, S: 6, O: -2 }, datoDePrueba: true },
      HCl:   { formula: 'HCl',   nombre: 'Ácido clorhídrico',    clasificacion: 'acido',
               composicion: { H: 1, Cl: 1 },      oxidacionEnCompuesto: { H: 1, Cl: -1 },      datoDePrueba: true },
      HNO3:  { formula: 'HNO3',  nombre: 'Ácido nítrico',        clasificacion: 'acido',
               composicion: { H: 1, N: 1, O: 3 }, oxidacionEnCompuesto: { H: 1, N: 5, O: -2 }, datoDePrueba: true },
      HBr:   { formula: 'HBr',   nombre: 'Ácido bromhídrico',    clasificacion: 'acido',
               composicion: { H: 1, Br: 1 },      oxidacionEnCompuesto: { H: 1, Br: -1 },      datoDePrueba: true },
      H3PO4: { formula: 'H3PO4', nombre: 'Ácido fosfórico',      clasificacion: 'acido',
               composicion: { H: 3, P: 1, O: 4 }, oxidacionEnCompuesto: { H: 1, P: 5, O: -2 }, datoDePrueba: true },

      /* ---- Bases ---- */
      NaOH:    { formula: 'NaOH',    nombre: 'Hidróxido de sodio',   clasificacion: 'base',
                 composicion: { Na: 1, O: 1, H: 1 }, oxidacionEnCompuesto: { Na: 1, O: -2, H: 1 },  datoDePrueba: true },
      KOH:     { formula: 'KOH',     nombre: 'Hidróxido de potasio', clasificacion: 'base',
                 composicion: { K: 1, O: 1, H: 1 },  oxidacionEnCompuesto: { K: 1, O: -2, H: 1 },   datoDePrueba: true },
      'Ca(OH)2': { formula: 'Ca(OH)2', nombre: 'Hidróxido de calcio', clasificacion: 'base',
                 composicion: { Ca: 1, O: 2, H: 2 }, oxidacionEnCompuesto: { Ca: 2, O: -2, H: 1 },  datoDePrueba: true },
      NH3:     { formula: 'NH3',     nombre: 'Amoníaco',             clasificacion: 'base',
                 composicion: { N: 1, H: 3 },        oxidacionEnCompuesto: { N: -3, H: 1 },         datoDePrueba: true },

      /* ---- Sales ---- */
      NaCl:  { formula: 'NaCl',  nombre: 'Cloruro de sodio',      clasificacion: 'sal',
               composicion: { Na: 1, Cl: 1 },        oxidacionEnCompuesto: { Na: 1, Cl: -1 },         datoDePrueba: true },
      KCl:   { formula: 'KCl',   nombre: 'Cloruro de potasio',    clasificacion: 'sal',
               composicion: { K: 1, Cl: 1 },         oxidacionEnCompuesto: { K: 1, Cl: -1 },          datoDePrueba: true },
      KI:    { formula: 'KI',    nombre: 'Yoduro de potasio',     clasificacion: 'sal',
               composicion: { K: 1, I: 1 },          oxidacionEnCompuesto: { K: 1, I: -1 },           datoDePrueba: true },
      KBr:   { formula: 'KBr',   nombre: 'Bromuro de potasio',    clasificacion: 'sal',
               composicion: { K: 1, Br: 1 },         oxidacionEnCompuesto: { K: 1, Br: -1 },          datoDePrueba: true },
      KMnO4: { formula: 'KMnO4', nombre: 'Permanganato de potasio', clasificacion: 'sal',
               composicion: { K: 1, Mn: 1, O: 4 },   oxidacionEnCompuesto: { K: 1, Mn: 7, O: -2 },    datoDePrueba: true },
      K2SO4: { formula: 'K2SO4', nombre: 'Sulfato de potasio',    clasificacion: 'sal',
               composicion: { K: 2, S: 1, O: 4 },    oxidacionEnCompuesto: { K: 1, S: 6, O: -2 },     datoDePrueba: true },
      Na2SO4:{ formula: 'Na2SO4', nombre: 'Sulfato de sodio',     clasificacion: 'sal',
               composicion: { Na: 2, S: 1, O: 4 },   oxidacionEnCompuesto: { Na: 1, S: 6, O: -2 },    datoDePrueba: true },
      MnSO4: { formula: 'MnSO4', nombre: 'Sulfato de manganeso(II)', clasificacion: 'sal',
               composicion: { Mn: 1, S: 1, O: 4 },   oxidacionEnCompuesto: { Mn: 2, S: 6, O: -2 },    datoDePrueba: true },
      CuSO4: { formula: 'CuSO4', nombre: 'Sulfato de cobre(II)',  clasificacion: 'sal',
               composicion: { Cu: 1, S: 1, O: 4 },   oxidacionEnCompuesto: { Cu: 2, S: 6, O: -2 },    datoDePrueba: true },
      NaNO3: { formula: 'NaNO3', nombre: 'Nitrato de sodio',      clasificacion: 'sal',
               composicion: { Na: 1, N: 1, O: 3 },   oxidacionEnCompuesto: { Na: 1, N: 5, O: -2 },    datoDePrueba: true },
      KNO3:  { formula: 'KNO3',  nombre: 'Nitrato de potasio',    clasificacion: 'sal',
               composicion: { K: 1, N: 1, O: 3 },    oxidacionEnCompuesto: { K: 1, N: 5, O: -2 },     datoDePrueba: true },
      AgNO3: { formula: 'AgNO3', nombre: 'Nitrato de plata',      clasificacion: 'sal',
               composicion: { Ag: 1, N: 1, O: 3 },   oxidacionEnCompuesto: { Ag: 1, N: 5, O: -2 },    datoDePrueba: true },
      CaCO3: { formula: 'CaCO3', nombre: 'Carbonato de calcio',   clasificacion: 'sal',
               composicion: { Ca: 1, C: 1, O: 3 },   oxidacionEnCompuesto: { Ca: 2, C: 4, O: -2 },    datoDePrueba: true },
      FeCl3: { formula: 'FeCl3', nombre: 'Cloruro de hierro(III)', clasificacion: 'sal',
               composicion: { Fe: 1, Cl: 3 },        oxidacionEnCompuesto: { Fe: 3, Cl: -1 },         datoDePrueba: true },

      /* ---- Óxidos ---- */
      CO2:   { formula: 'CO2',   nombre: 'Dióxido de carbono',    clasificacion: 'oxido',
               composicion: { C: 1, O: 2 },          oxidacionEnCompuesto: { C: 4, O: -2 },           datoDePrueba: true },
      MnO2:  { formula: 'MnO2',  nombre: 'Dióxido de manganeso',  clasificacion: 'oxido',
               composicion: { Mn: 1, O: 2 },         oxidacionEnCompuesto: { Mn: 4, O: -2 },          datoDePrueba: true },
      CaO:   { formula: 'CaO',   nombre: 'Óxido de calcio',       clasificacion: 'oxido',
               composicion: { Ca: 1, O: 1 },         oxidacionEnCompuesto: { Ca: 2, O: -2 },          datoDePrueba: true },
      Fe2O3: { formula: 'Fe2O3', nombre: 'Óxido de hierro(III)',  clasificacion: 'oxido',
               composicion: { Fe: 2, O: 3 },         oxidacionEnCompuesto: { Fe: 3, O: -2 },          datoDePrueba: true },

      /* ---- Hidrocarburos ---- */
      CH4:   { formula: 'CH4',   nombre: 'Metano',                clasificacion: 'hidrocarburo',
               composicion: { C: 1, H: 4 },          oxidacionEnCompuesto: { C: -4, H: 1 },           datoDePrueba: true }
    },

    /* ===================================================================== IONES
       carga: entero con signo. Clave con "^" cuando la carga es mayor que 1. */
    iones: {
      'H+':      { formula: 'H+',      nombre: 'Ion hidrógeno (protón)', carga: 1,  clasificacion: 'cation',
                   composicion: { H: 1 },          oxidacionEnIon: { H: 1 },           datoDePrueba: true },
      'Na+':     { formula: 'Na+',     nombre: 'Ion sodio',              carga: 1,  clasificacion: 'cation',
                   composicion: { Na: 1 },         oxidacionEnIon: { Na: 1 },          datoDePrueba: true },
      'K+':      { formula: 'K+',      nombre: 'Ion potasio',            carga: 1,  clasificacion: 'cation',
                   composicion: { K: 1 },          oxidacionEnIon: { K: 1 },           datoDePrueba: true },
      'NH4+':    { formula: 'NH4+',    nombre: 'Ion amonio',             carga: 1,  clasificacion: 'cation poliatomico',
                   composicion: { N: 1, H: 4 },    oxidacionEnIon: { N: -3, H: 1 },    datoDePrueba: true },
      'Ca^2+':   { formula: 'Ca^2+',   nombre: 'Ion calcio',             carga: 2,  clasificacion: 'cation',
                   composicion: { Ca: 1 },         oxidacionEnIon: { Ca: 2 },          datoDePrueba: true },
      'Mn^2+':   { formula: 'Mn^2+',   nombre: 'Ion manganeso(II)',      carga: 2,  clasificacion: 'cation',
                   composicion: { Mn: 1 },         oxidacionEnIon: { Mn: 2 },          datoDePrueba: true },
      'Fe^2+':   { formula: 'Fe^2+',   nombre: 'Ion hierro(II)',         carga: 2,  clasificacion: 'cation',
                   composicion: { Fe: 1 },         oxidacionEnIon: { Fe: 2 },          datoDePrueba: true },
      'Fe^3+':   { formula: 'Fe^3+',   nombre: 'Ion hierro(III)',        carga: 3,  clasificacion: 'cation',
                   composicion: { Fe: 1 },         oxidacionEnIon: { Fe: 3 },          datoDePrueba: true },
      'Cu^2+':   { formula: 'Cu^2+',   nombre: 'Ion cobre(II)',          carga: 2,  clasificacion: 'cation',
                   composicion: { Cu: 1 },         oxidacionEnIon: { Cu: 2 },          datoDePrueba: true },
      'Cl-':     { formula: 'Cl-',     nombre: 'Ion cloruro',            carga: -1, clasificacion: 'anion',
                   composicion: { Cl: 1 },         oxidacionEnIon: { Cl: -1 },         datoDePrueba: true },
      'I-':      { formula: 'I-',      nombre: 'Ion yoduro',             carga: -1, clasificacion: 'anion',
                   composicion: { I: 1 },          oxidacionEnIon: { I: -1 },          datoDePrueba: true },
      'OH-':     { formula: 'OH-',     nombre: 'Ion hidróxido',          carga: -1, clasificacion: 'anion poliatomico',
                   composicion: { O: 1, H: 1 },    oxidacionEnIon: { O: -2, H: 1 },    datoDePrueba: true },
      'NO3-':    { formula: 'NO3-',    nombre: 'Ion nitrato',            carga: -1, clasificacion: 'anion poliatomico',
                   composicion: { N: 1, O: 3 },    oxidacionEnIon: { N: 5, O: -2 },    datoDePrueba: true },
      'MnO4-':   { formula: 'MnO4-',   nombre: 'Ion permanganato',       carga: -1, clasificacion: 'anion poliatomico',
                   composicion: { Mn: 1, O: 4 },   oxidacionEnIon: { Mn: 7, O: -2 },   datoDePrueba: true },
      'SO4^2-':  { formula: 'SO4^2-',  nombre: 'Ion sulfato',            carga: -2, clasificacion: 'anion poliatomico',
                   composicion: { S: 1, O: 4 },    oxidacionEnIon: { S: 6, O: -2 },    datoDePrueba: true }
    }
  };

  /* Exportación global.
     - FORMULAS_REACCIONES: nombre que lee reacciones.js.
     - CATALOGO: alias, según el estándar de variables globales del proyecto. */
  global.FORMULAS_REACCIONES = CATALOGO;
  global.CATALOGO = CATALOGO;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CATALOGO;
  }
})(typeof window !== 'undefined' ? window : globalThis);
