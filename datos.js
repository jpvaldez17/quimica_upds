/* =========================================
QUÍMICA UPDS
DATOS ADICIONALES POR ELEMENTO
Developed by J. Poma · 2026

Cada elemento: [
  0 presencia/obtención, 1 aspecto, 2 conductividad, 3 estructura,
  4 fusión, 5 ebullición, 6 densidad,
  7 reactividad, 8 resistencia a ácidos, 9 compuestos comunes
]
- «null» = usa el valor por defecto de su grupo.
- Temperaturas en °C y densidad en g/cm³ (se agregan solas las unidades).
- Para editar un dato, cambia el texto entre comillas.
========================================= */

window.QUIMICA_DATOS = (function () {

    var CLAVES = ["p", "a", "c", "e", "f", "b", "d", "r", "s", "k"];

    var LANTANIDO = {
        p: "Monacita y bastnasita (tierras raras)",
        c: "Conductor",
        s: "Se disuelve en ácidos"
    };

    var SUPERPESADO = {
        p: "Sintético; se produce en aceleradores de partículas",
        a: "Sin datos experimentales",
        c: "—",
        e: "—",
        f: "—",
        b: "—",
        d: "—",
        r: "Su química es predicha o se estudia con muy pocos átomos",
        s: "—",
        k: "—"
    };

    var D = {
        1:  ["Abundante en agua e hidrocarburos; se obtiene del gas natural y por electrólisis del agua", "Gas incoloro e inodoro", "No conduce (gas)", "Moléculas diatómicas H₂", "-259", "-253", "0.0899 g/L", "Arde con O₂ formando agua; reacciona con halógenos y metales", "No aplica (gas)", "H₂O, NH₃, HCl, hidrocarburos"],
        2:  ["Se extrae del gas natural", "Gas incoloro e inodoro", "No conduce", "Monoatómico; solo solidifica a alta presión", "—", "-269", "0.1786 g/L", "No reacciona", "No reacciona", "Prácticamente ninguno"],
        3:  ["Salmueras y minerales como la espodumena; Bolivia, Chile y Argentina tienen grandes reservas en salares", "Metal blando plateado que se oscurece al aire", "Buen conductor", "Cúbica centrada en el cuerpo (BCC)", "180.5", "1342", "0.534", "Reacciona con agua, O₂ y N₂ del aire", "Reacciona con ácidos liberando H₂", "Li₂CO₃, LiOH, LiCl"],
        4:  ["Minerales berilo y bertrandita", "Metal gris acero, duro y ligero", "Buen conductor", "Hexagonal compacta (HCP)", "1287", "2469", "1.85", "Una capa de óxido lo protege al aire", "Se disuelve en ácidos y en bases", "BeO, BeCl₂ (muy tóxicos)"],
        5:  ["Bórax y kernita", "Sólido negro-pardo, duro", "Semiconductor", "Unidades icosaédricas B₁₂", "2076", "3927", "2.34", "Estable a temperatura ambiente; arde a alta temperatura", "Resiste ácidos no oxidantes", "B₂O₃, H₃BO₃, bórax"],
        6:  ["Carbón, petróleo, gas, carbonatos y toda la materia orgánica", "Grafito negro y blando; diamante transparente y duro", "El grafito conduce; el diamante no", "Grafito hexagonal en capas; diamante cúbico", "sublima ≈3640", "—", "2.27 g/cm³ (grafito)", "Inerte a temperatura ambiente; arde en O₂", "Resiste ácidos", "CO₂, CO, CaCO₃, hidrocarburos"],
        7:  ["78 % del aire; se obtiene por destilación del aire líquido", "Gas incoloro e inodoro", "No conduce", "Moléculas N₂", "-210", "-196", "1.251 g/L", "Poco reactivo; reacciona con H₂ (amoníaco) y con metales a alta temperatura", "No reacciona", "NH₃, HNO₃, nitratos, NO₂"],
        8:  ["21 % del aire y casi la mitad de la corteza terrestre (óxidos y silicatos)", "Gas incoloro e inodoro; líquido azul pálido", "No conduce", "Moléculas O₂", "-219", "-183", "1.429 g/L", "Comburente: oxida a la mayoría de los elementos", "No aplica", "H₂O, CO₂, óxidos, silicatos"],
        9:  ["Fluorita (CaF₂) y criolita", "Gas amarillo pálido", "No conduce", "Moléculas F₂", "-220", "-188", "1.696 g/L", "Es el elemento más reactivo; ataca casi todo, incluso vidrio", "No aplica", "HF, PTFE, UF₆, fluoruros"],
        10: ["Se obtiene del aire (0.0018 %)", "Gas incoloro; brilla naranja-rojo en tubos de descarga", "No conduce", "Monoatómico", "-249", "-246", "0.900 g/L", "No reacciona", "No reacciona", "Ninguno estable"],
        11: ["Sal común (NaCl) en mares y salares", "Metal blando plateado", "Buen conductor", "BCC", "97.8", "883", "0.971", "Reacciona violentamente con agua; se oxida rápido al aire", "Reacciona con ácidos", "NaCl, NaOH, Na₂CO₃, NaHCO₃"],
        12: ["Agua de mar y minerales como magnesita y dolomita", "Metal ligero blanco plateado", "Buen conductor", "HCP", "650", "1090", "1.74", "Arde con llama blanca brillante; reacciona lento con agua", "Se disuelve en ácidos", "MgO, Mg(OH)₂, MgSO₄"],
        13: ["Se obtiene de la bauxita (proceso Bayer y electrólisis)", "Metal blanco plateado, ligero", "Muy buen conductor", "Cúbica centrada en las caras (FCC)", "660.3", "2470", "2.70", "Una capa de Al₂O₃ lo protege; es anfótero", "Se disuelve en ácidos y bases fuertes", "Al₂O₃, AlCl₃, sulfato de aluminio"],
        14: ["Segundo elemento de la corteza; arena (SiO₂) y silicatos", "Sólido gris azulado brillante", "Semiconductor", "Cúbica tipo diamante", "1414", "3265", "2.33", "Estable; forma una capa de SiO₂", "Resiste ácidos; lo atacan el HF y las bases", "SiO₂, silicatos, SiC, siliconas"],
        15: ["Rocas fosfáticas (apatito)", "Blanco céreo, rojo o negro según el alótropo", "El blanco y el rojo no conducen; el negro es semiconductor", "Moléculas P₄ (fósforo blanco)", "44.2 °C (blanco)", "280", "1.82", "El blanco se inflama al aire; el rojo es estable", "Lo oxida el ácido nítrico", "H₃PO₄, fosfatos, P₄O₁₀"],
        16: ["Yacimientos volcánicos, petróleo y gas; sulfuros y sulfatos", "Sólido amarillo", "Aislante", "Anillos S₈ (ortorrómbica)", "115.2", "444.6", "2.07", "Arde con llama azul formando SO₂", "Resiste ácidos no oxidantes", "H₂SO₄, SO₂, H₂S, sulfatos"],
        17: ["Sal común (NaCl) y agua de mar; se obtiene por electrólisis de salmuera", "Gas amarillo-verdoso", "No conduce", "Moléculas Cl₂", "-101.5", "-34", "3.214 g/L", "Oxidante muy fuerte; reacciona con casi todos los elementos", "No aplica", "HCl, NaCl, NaClO, PVC"],
        18: ["0.93 % del aire; se obtiene por destilación", "Gas incoloro e inodoro", "No conduce", "Monoatómico", "-189", "-186", "1.784 g/L", "No reacciona", "No reacciona", "Prácticamente ninguno"],
        19: ["Sales de potasa (silvita, carnalita)", "Metal blando plateado", "Buen conductor", "BCC", "63.5", "759", "0.862", "Reacciona violentamente con agua; se oxida al aire", "Reacciona con ácidos", "KCl, KOH, KNO₃"],
        20: ["Caliza, yeso y fluorita", "Metal blando gris plateado", "Buen conductor", "FCC", "842", "1484", "1.55", "Reacciona con agua; se empaña al aire", "Reacciona con ácidos", "CaCO₃, CaO, Ca(OH)₂, CaSO₄"],
        21: ["Muy disperso; subproducto de otros minerales", "Metal blando plateado", "Conductor", "HCP", "1541", "2836", "2.99", "Se oxida lentamente al aire", "Se disuelve en ácidos", "Sc₂O₃"],
        22: ["Rutilo e ilmenita", "Metal plateado, fuerte y ligero", "Conductor moderado", "HCP", "1668", "3287", "4.51", "Pasivado por TiO₂; muy resistente a la corrosión", "Resiste la mayoría de ácidos; lo ataca el HF", "TiO₂, TiCl₄"],
        23: ["Vanadinita y patronita; subproducto de la siderurgia", "Metal gris plateado", "Conductor", "BCC", "1910", "3407", "6.0", "Una capa de óxido lo protege", "Resiste ácidos no oxidantes", "V₂O₅, vanadatos"],
        24: ["Cromita", "Metal gris azulado, brillante y duro", "Conductor", "BCC", "1907", "2671", "7.19", "Pasivado por Cr₂O₃", "Resiste muchos ácidos", "Cr₂O₃, cromatos, dicromatos"],
        25: ["Pirolusita (MnO₂)", "Metal gris plateado, duro y quebradizo", "Conductor", "Cúbica compleja", "1246", "2061", "7.21", "Se oxida al aire; reacciona con agua caliente", "Se disuelve en ácidos", "MnO₂, KMnO₄, MnSO₄"],
        26: ["Hematita y magnetita; se reduce en el alto horno", "Metal gris plateado", "Buen conductor; ferromagnético", "BCC (FCC a alta temperatura)", "1538", "2861", "7.87", "Se oxida con humedad (herrumbre)", "Se disuelve en ácidos diluidos", "Fe₂O₃, Fe₃O₄, FeCl₃, FeSO₄"],
        27: ["Subproducto del cobre y del níquel; el Congo es el mayor productor", "Metal gris azulado", "Conductor; ferromagnético", "HCP", "1495", "2927", "8.90", "Estable al aire a temperatura ambiente", "Se disuelve lentamente en ácidos diluidos", "CoO, CoCl₂, LiCoO₂"],
        28: ["Lateritas y sulfuros (pentlandita)", "Metal blanco plateado", "Conductor; ferromagnético", "FCC", "1455", "2913", "8.91", "Resistente a la corrosión", "Lo ataca el HNO₃ diluido; resiste las bases", "NiO, NiSO₄, Ni(OH)₂"],
        29: ["Calcopirita; Chile y Perú lideran la producción", "Metal rojizo brillante", "Excelente conductor", "FCC", "1085", "2562", "8.96", "Se cubre de pátina verde con el tiempo", "Lo atacan el HNO₃ y el H₂SO₄ caliente", "CuO, Cu₂O, CuSO₄"],
        30: ["Esfalerita (ZnS)", "Metal gris azulado", "Conductor", "HCP", "419.5", "907", "7.14", "Una capa de óxido o carbonato lo protege", "Se disuelve en ácidos y bases", "ZnO, ZnCl₂, ZnS"],
        31: ["Subproducto de la bauxita y del zinc", "Metal plateado blando", "Conductor", "Ortorrómbica", "29.8", "2204", "5.91", "Estable al aire seco; funde en la mano", "Se disuelve en ácidos y bases", "GaAs, GaN, Ga₂O₃"],
        32: ["Subproducto del zinc y del carbón", "Sólido gris blanquecino brillante, duro y quebradizo", "Semiconductor", "Cúbica tipo diamante", "938", "2833", "5.32", "Estable al aire; a alta temperatura forma GeO₂", "Resiste ácidos diluidos; lo ataca el agua regia", "GeO₂, GeCl₄"],
        33: ["Arsenopirita; subproducto de la minería", "Sólido gris metálico, quebradizo", "Semiconductor", "Romboédrica en capas", "sublima a 614", "—", "5.73", "Se oxida lentamente al aire", "Lo ataca el ácido nítrico", "As₂O₃, GaAs, arseniatos"],
        34: ["Subproducto del refinado del cobre", "Sólido gris metálico o rojo", "Semiconductor (fotoconductor)", "Cadenas helicoidales (gris)", "221", "685", "4.81", "Estable al aire; arde con llama azul", "Lo ataca el HNO₃", "SeO₂, seleniuros"],
        35: ["Salmueras y agua de mar", "Líquido rojo-pardo, muy volátil", "No conduce", "Moléculas Br₂", "-7.2", "58.8", "3.12", "Oxidante fuerte; menos reactivo que el Cl₂", "No aplica", "HBr, NaBr, bromuros"],
        36: ["Se obtiene del aire (trazas)", "Gas incoloro e inodoro", "No conduce", "Monoatómico", "-157", "-153", "3.749 g/L", "Casi inerte; forma KrF₂", "No reacciona", "KrF₂"],
        37: ["Lepidolita y salmueras (trazas)", "Metal blando plateado", "Buen conductor", "BCC", "39.3", "688", "1.53", "Se inflama al aire; reacciona violentamente con agua", "Reacciona con ácidos", "RbCl, Rb₂CO₃"],
        38: ["Celestina y estroncianita", "Metal blando amarillento", "Conductor", "FCC", "777", "1377", "2.64", "Reacciona con agua; se oxida al aire", "Reacciona con ácidos", "SrCO₃, Sr(NO₃)₂"],
        39: ["Tierras raras (xenotima y monacita)", "Metal plateado", "Conductor", "HCP", "1526", "3336", "4.47", "Estable al aire por una capa de óxido", "Se disuelve en ácidos", "Y₂O₃, YAG"],
        40: ["Circón (ZrSiO₄)", "Metal gris plateado", "Conductor", "HCP", "1855", "4409", "6.51", "Pasivado por ZrO₂; muy resistente a la corrosión", "Resiste ácidos; lo ataca el HF", "ZrO₂, ZrCl₄"],
        41: ["Columbita-tantalita; Brasil es el mayor productor", "Metal gris brillante", "Conductor; superconductor a muy baja temperatura", "BCC", "2477", "4744", "8.57", "Pasivado por óxido", "Resiste ácidos; lo ataca el HF", "Nb₂O₅"],
        42: ["Molibdenita (MoS₂)", "Metal gris plateado", "Conductor", "BCC", "2623", "4639", "10.28", "Estable al aire; se oxida a alta temperatura", "Resiste ácidos no oxidantes", "MoS₂, MoO₃"],
        43: ["Sintético; se obtiene del combustible nuclear usado", "Metal gris plateado", "Conductor", "HCP", "2157", "4265", "11", "Se oxida lentamente al aire húmedo", "Lo ataca el HNO₃", "TcO₄⁻, TcO₂"],
        44: ["Minas de platino", "Metal blanco plateado, duro", "Conductor", "HCP", "2334", "4150", "12.37", "Muy estable", "Resiste ácidos, incluso el agua regia", "RuO₂, RuCl₃"],
        45: ["Minas de platino", "Metal blanco plateado brillante", "Conductor", "FCC", "1964", "3695", "12.41", "Muy estable", "Resiste ácidos, incluso el agua regia", "RhCl₃, Rh₂O₃"],
        46: ["Minas de platino y níquel", "Metal blanco plateado", "Conductor", "FCC", "1555", "2963", "12.02", "Absorbe grandes cantidades de H₂", "Lo atacan el HNO₃ y el agua regia", "PdCl₂, PdO"],
        47: ["Argentita; subproducto del cobre y del plomo", "Metal blanco brillante", "El mejor conductor eléctrico", "FCC", "961.8", "2162", "10.49", "Se empaña con azufre (Ag₂S)", "Lo ataca el HNO₃", "AgNO₃, AgCl, Ag₂S"],
        48: ["Subproducto del zinc", "Metal blando azulado", "Conductor", "HCP", "321", "767", "8.65", "Se oxida lentamente al aire", "Se disuelve en ácidos", "CdS, CdO, CdCl₂"],
        49: ["Subproducto del zinc", "Metal muy blando, plateado", "Conductor", "Tetragonal", "156.6", "2072", "7.31", "Estable al aire", "Se disuelve en ácidos", "In₂O₃, ITO (óxido de indio y estaño)"],
        50: ["Casiterita (SnO₂)", "Metal blando plateado", "Conductor", "Tetragonal (estaño blanco)", "231.9", "2602", "7.31", "Estable al aire y al agua", "Lo atacan ácidos fuertes y bases", "SnO₂, SnCl₂"],
        51: ["Estibina (Sb₂S₃)", "Sólido gris plateado, quebradizo", "Mal conductor", "Romboédrica", "630.6", "1587", "6.70", "Estable al aire", "Lo atacan el HNO₃ y el agua regia", "Sb₂O₃, Sb₂S₃"],
        52: ["Subproducto del refinado del cobre", "Sólido gris plateado, quebradizo", "Semiconductor", "Cadenas hexagonales", "449.5", "988", "6.24", "Arde con llama verdeazulada", "Lo ataca el HNO₃", "TeO₂, CdTe"],
        53: ["Salmueras y caliche (yodatos) de Chile", "Sólido gris violáceo brillante", "Aislante", "Moléculas I₂", "113.7", "184.3", "4.93", "Sublima formando vapor violeta; oxidante moderado", "No aplica", "KI, HI, yodatos"],
        54: ["Se obtiene del aire (trazas)", "Gas incoloro e inodoro", "No conduce", "Monoatómico", "-112", "-108", "5.894 g/L", "Casi inerte; forma XeF₂ y XeF₄", "No reacciona", "XeF₂, XeF₄"],
        55: ["Polucita", "Metal blando dorado", "Buen conductor", "BCC", "28.4", "671", "1.93", "Reacciona de forma explosiva con agua; se inflama al aire", "Reacciona con ácidos", "CsCl, CsNO₃"],
        56: ["Baritina (BaSO₄)", "Metal blando plateado", "Conductor", "BCC", "727", "1897", "3.51", "Reacciona con agua y con el aire", "Reacciona con ácidos", "BaSO₄, BaCO₃"],
        57: [null, "Metal blando plateado", null, "Hexagonal doble", "920", "3464", "6.15", "Se oxida con rapidez al aire", null, "La₂O₃, LaCl₃"],
        58: [null, "Metal gris plateado", null, "FCC", "795", "3443", "6.77", "Se oxida al aire; las virutas pueden inflamarse", null, "CeO₂, Ce₂O₃"],
        59: [null, "Metal blando plateado-amarillento", null, "Hexagonal doble", "935", "3520", "6.77", "Se oxida al aire", null, "Pr₆O₁₁"],
        60: [null, "Metal plateado", null, "Hexagonal doble", "1024", "3074", "7.01", "Se oxida con rapidez al aire", null, "Nd₂O₃, imanes Nd-Fe-B"],
        61: ["Sintético; casi no existe en la naturaleza", "Metal; sus sales brillan con tono azul-verdoso", null, "Hexagonal doble", "1042", "≈3000", "7.26", "Se oxida al aire", null, "Pm₂O₃"],
        62: [null, "Metal plateado", null, "Romboédrica", "1072", "1794", "7.52", "Se oxida lentamente al aire", null, "Sm₂O₃, imanes Sm-Co"],
        63: [null, "Metal blando plateado", null, "BCC", "826", "1529", "5.24", "Es la tierra rara más reactiva; se oxida con rapidez", null, "Eu₂O₃ (fósforos rojos)"],
        64: [null, "Metal plateado", "Conductor; ferromagnético por debajo de 20 °C", "HCP", "1312", "3273", "7.90", "Estable al aire seco; se oxida con humedad", null, "Gd₂O₃, contrastes para resonancia magnética"],
        65: [null, "Metal plateado, maleable", null, "HCP", "1356", "3230", "8.23", "Se oxida lentamente al aire", null, "Tb₄O₇ (fósforos verdes)"],
        66: [null, "Metal plateado brillante", null, "HCP", "1407", "2567", "8.55", "Se oxida lentamente al aire", null, "Dy₂O₃, imanes Nd-Fe-B"],
        67: [null, "Metal plateado blando", null, "HCP", "1461", "2720", "8.79", "Estable al aire seco", null, "Ho₂O₃"],
        68: [null, "Metal plateado", null, "HCP", "1529", "2868", "9.07", "Se oxida lentamente al aire", null, "Er₂O₃ (fibra óptica)"],
        69: [null, "Metal plateado, maleable", null, "HCP", "1545", "1950", "9.32", "Se oxida lentamente al aire", null, "Tm₂O₃"],
        70: [null, "Metal blando plateado", null, "FCC", "824", "1196", "6.90", "Se oxida lentamente al aire", null, "Yb₂O₃"],
        71: [null, "Metal plateado; el más duro y denso de los lantánidos", null, "HCP", "1652", "3402", "9.84", "Estable al aire seco", null, "Lu₂O₃"],
        72: ["Circón (junto con el circonio)", "Metal gris plateado", "Conductor", "HCP", "2233", "4603", "13.31", "Pasivado por HfO₂", "Resiste ácidos; lo ataca el HF", "HfO₂"],
        73: ["Columbita-tantalita", "Metal gris azulado", "Conductor", "BCC", "3017", "5458", "16.65", "Muy estable; pasivado por Ta₂O₅", "Resiste casi todos los ácidos; lo ataca el HF", "Ta₂O₅"],
        74: ["Wolframita y scheelita", "Metal gris acero", "Conductor", "BCC", "3422", "5555", "19.25", "Estable al aire; se oxida a alta temperatura", "Resiste casi todos los ácidos", "WO₃, WC"],
        75: ["Subproducto del molibdeno", "Metal gris plateado", "Conductor", "HCP", "3186", "5596", "21.02", "Estable; se oxida a alta temperatura", "Lo ataca el HNO₃", "Re₂O₇, ReO₃"],
        76: ["Minas de platino", "Metal azul-grisáceo, muy duro", "Conductor", "HCP", "3033", "5012", "22.59", "Al calentarlo en aire forma OsO₄ tóxico", "Resiste ácidos; lo ataca el agua regia", "OsO₄"],
        77: ["Minas de platino; meteoritos", "Metal blanco plateado, muy duro", "Conductor", "FCC", "2446", "4428", "22.56", "Muy resistente a la corrosión", "Resiste todos los ácidos, incluso el agua regia", "IrO₂, IrCl₃"],
        78: ["Minas de Sudáfrica y Rusia", "Metal blanco plateado", "Conductor", "FCC", "1768", "3825", "21.45", "No se oxida al aire", "Se disuelve en agua regia", "PtCl₄, H₂PtCl₆"],
        79: ["Se halla nativo y en vetas de cuarzo", "Metal amarillo brillante", "Excelente conductor", "FCC", "1064", "2856", "19.30", "No se oxida", "Solo lo disuelve el agua regia", "AuCl₃, [Au(CN)₂]⁻"],
        80: ["Cinabrio (HgS)", "Líquido plateado brillante", "Conductor", "Romboédrica (sólido)", "-38.8", "356.7", "13.53", "Estable al aire; forma amalgamas", "Lo atacan el HNO₃ y el H₂SO₄ caliente", "HgS, HgCl₂, HgO"],
        81: ["Subproducto de sulfuros de zinc y de plomo", "Metal blando gris azulado", "Conductor", "HCP", "304", "1473", "11.85", "Se oxida al aire", "Se disuelve en ácidos", "Tl₂SO₄, Tl₂O"],
        82: ["Galena (PbS)", "Metal blando gris azulado", "Conductor moderado", "FCC", "327.5", "1749", "11.34", "Se cubre de una capa protectora de óxido o carbonato", "Resiste el H₂SO₄; lo ataca el HNO₃", "PbO, PbS, PbSO₄"],
        83: ["Subproducto del plomo y del cobre", "Metal frágil, plateado con tono rosado", "Mal conductor (para un metal)", "Romboédrica", "271.4", "1564", "9.78", "Estable al aire seco; arde con llama azul", "Lo ataca el HNO₃", "Bi₂O₃, subsalicilato de bismuto"],
        84: ["Trazas en minerales de uranio; se produce en reactores", "Metal plateado", "Conductor", "Cúbica simple", "254", "962", "9.2", "Se oxida al aire; muy radiactivo", "Se disuelve en ácidos diluidos", "PoO₂, PoCl₄"],
        85: ["Sintético; trazas en minerales de uranio", "Sin datos visibles (solo trazas)", "—", "—", "≈302", "—", "—", "Se comporta como un halógeno pesado", "—", "HAt, astaturos"],
        86: ["Gas que se forma por la desintegración del radio; se acumula en sótanos", "Gas incoloro", "No conduce", "Monoatómico", "-71", "-62", "9.73 g/L", "Casi inerte; forma fluoruros", "No reacciona", "RnF₂"],
        87: ["Sintético; trazas en minerales de uranio", "Se desconoce (solo trazas)", "—", "—", "≈27 °C (estimado)", "≈677 °C (estimado)", "—", "Se espera extremadamente reactivo (metal alcalino)", "—", "FrCl (en trazas)"],
        88: ["Trazas en minerales de uranio", "Metal blanco plateado que se oscurece", "Conductor", "BCC", "700", "1737", "5.5", "Reacciona con agua y con el aire", "Se disuelve en ácidos", "RaCl₂, RaBr₂"],
        89: ["Trazas en minerales de uranio; se produce en reactores", "Metal plateado que brilla azul en la oscuridad", "Conductor", "FCC", "1050", "3198", "10.07", "Se oxida con rapidez al aire", "Se disuelve en ácidos", "Ac₂O₃"],
        90: ["Monacita; más abundante que el uranio", "Metal plateado que se oscurece al aire", "Conductor", "FCC", "1750", "4788", "11.72", "Se oxida lentamente; el polvo fino es pirofórico", "Resiste la mayoría de ácidos diluidos", "ThO₂"],
        91: ["Trazas en minerales de uranio", "Metal plateado brillante", "Conductor", "Tetragonal", "1568", "—", "15.37", "Se oxida al aire", "Se disuelve en ácidos concentrados", "Pa₂O₅"],
        92: ["Uraninita (pechblenda)", "Metal plateado, muy denso", "Conductor", "Ortorrómbica", "1135", "4131", "19.1", "Se oxida al aire; el polvo fino es pirofórico", "Se disuelve en ácidos", "UO₂, U₃O₈, UF₆"],
        93: ["Sintético; se forma en reactores nucleares", "Metal plateado", "Conductor", "Ortorrómbica", "644", "3902", "20.45", "Se oxida al aire", "Se disuelve en ácidos", "NpO₂"],
        94: ["Sintético; se produce en reactores a partir de uranio", "Metal plateado que se oscurece al aire", "Mal conductor (para un metal)", "Monoclínica (tiene seis fases)", "640", "3228", "19.8", "Se oxida al aire; puede inflamarse", "Se disuelve en ácidos", "PuO₂"],
        95: ["Sintético; se obtiene en reactores", "Metal blanco plateado", "Conductor", "Hexagonal doble", "1176", "2011", "≈12", "Se empaña lentamente al aire", "Se disuelve en ácidos", "AmO₂ (detectores de humo)"],
        96: ["Sintético; se obtiene en reactores", "Metal plateado", "Conductor", "Hexagonal doble", "1345", "3110", "13.5", "Se oxida con rapidez", "Se disuelve en ácidos", "Cm₂O₃"],
        97: ["Sintético; en reactores de alto flujo", "Metal plateado", "Conductor", "Hexagonal doble", "986", "—", "14.8", "Se oxida al aire", "Se disuelve en ácidos", "BkO₂"],
        98: ["Sintético", "Metal plateado", "Conductor", "Hexagonal doble", "900", "—", "15.1", "Se oxida al aire", "Se disuelve en ácidos", "Cf₂O₃"],
        99: ["Sintético; se detectó en restos de pruebas nucleares", "Metal plateado (solo en cantidades muy pequeñas)", "Se espera conductor", "FCC (predicha)", "860", "—", "8.8", "Muy radiactivo; se oxida", "Se disuelve en ácidos", "Es₂O₃"],
        100: ["Sintético", "Sin datos experimentales", "—", "—", "≈1527 °C (estimado)", "—", "—", "Se comporta como un actínido trivalente", "—", "Fm³⁺ en disolución"],
        101: ["Sintético", "Sin datos experimentales", "—", "—", "≈827 °C (estimado)", "—", "—", "Presenta estados +2 y +3 en disolución", "—", "Md²⁺, Md³⁺ en disolución"],
        102: ["Sintético", "Sin datos experimentales", "—", "—", "≈827 °C (estimado)", "—", "—", "El estado +2 es el más estable en disolución", "—", "No²⁺ en disolución"],
        103: ["Sintético", "Sin datos experimentales", "—", "—", "≈1627 °C (estimado)", "—", "—", "Se comporta como un elemento trivalente", "—", "Lr³⁺ en disolución"],
        104: [null, null, null, null, null, null, null, "Se comporta como un metal del grupo 4 (similar al hafnio)", null, null],
        105: [null, null, null, null, null, null, null, "Se comporta como un metal del grupo 5", null, null],
        106: [null, null, null, null, null, null, null, "Se comporta como un metal del grupo 6", null, null],
        107: [null, null, null, null, null, null, null, "Se comporta como un metal del grupo 7", null, null],
        108: [null, null, null, null, null, null, null, "Se comporta como un metal del grupo 8; forma HsO₄ volátil", null, null],
        112: [null, null, null, null, null, null, null, "Muy volátil; se predice líquido o gas a temperatura ambiente", null, null],
        118: [null, null, null, null, null, null, null, "Se predice sólido y más reactivo que otros gases nobles", null, null]
    };

    function obtener(z) {
        var fila = D[z] || [];
        var base = (z >= 104) ? SUPERPESADO : ((z >= 57 && z <= 71) ? LANTANIDO : {});
        var salida = {};

        for (var i = 0; i < CLAVES.length; i++) {
            var k = CLAVES[i];
            var v = fila[i];
            if (v === undefined || v === null) {
                v = (base[k] !== undefined) ? base[k] : "—";
            }
            salida[k] = v;
        }
        return salida;
    }

    return { obtener: obtener };

})();
