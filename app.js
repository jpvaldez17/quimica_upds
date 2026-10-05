/* =========================================
   QUÍMICA UPDS
   Diseño principal
   Developed by J. Poma · 2026
   ========================================= */


/* =========================================
   CONFIGURACIÓN GENERAL
   ========================================= */

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: Arial, Helvetica, sans-serif;
    background: #dfe2e5;
    color: #171717;
    padding-bottom: 82px;
}


/* =========================================
   ENCABEZADO
   ========================================= */

.header {
    width: 100%;
    height: 92px !important;
    min-height: 92px !important;

    background: #e7e8e9;

    position: relative;

    display: flex;
    align-items: center;
    justify-content: center;

    padding: 0 16px;
}


/* =========================================
   MATRÁZ - EXTREMO IZQUIERDO
   ========================================= */

.header .brand-icon {
    position: absolute !important;

    left: 16px !important;
    right: auto !important;

    top: 50% !important;

    transform: translateY(-50%) !important;

    width: 42px;
    height: 42px;

    display: flex;

    align-items: center;
    justify-content: center;

    color: #1686e8;

    font-size: 29px;

    z-index: 10;
}


/* =========================================
   TEXTO - CENTRO ABSOLUTO
   ========================================= */

.header .brand-text {
    position: absolute !important;

    left: 50% !important;
    right: auto !important;

    top: 50% !important;

    transform: translate(-50%, -50%) !important;

    text-align: center;

    white-space: nowrap;

    z-index: 5;
}


.header .brand-text h1 {
    font-size: 25px;

    line-height: 1.1;

    font-weight: 800;

    color: #111111;
}


.header .brand-text h1 span {
    color: #145da0;
}


.header .brand-text p {
    margin-top: 5px;

    font-size: 13px;

    color: #444444;
}


/* =========================================
   USUARIO - EXTREMO DERECHO
   ========================================= */

.header .profile-button {
    position: absolute !important;

    left: auto !important;
    right: 16px !important;

    top: 50% !important;

    transform: translateY(-50%) !important;

    width: 42px;
    height: 42px;

    border: 2px solid #333333;

    border-radius: 50%;

    display: flex;

    align-items: center;
    justify-content: center;

    color: #333333;

    font-size: 17px;

    flex-shrink: 0;

    z-index: 10;
}


/* =========================================
   LÍNEA AZUL
   ========================================= */

.blue-line {
    width: 92%;

    height: 4px;

    background: #1686e8;

    border-radius: 5px;

    margin: 0 auto 12px;
}


/* =========================================
   CONTENIDO
   ========================================= */

.main-content {
    width: 100%;

    max-width: 900px;

    margin: 0 auto;

    padding: 0 12px;
}


/* =========================================
   BUSCADOR
   ========================================= */

.search-box {
    width: 100%;

    min-height: 57px;

    background: #ffffff;

    border: 2px solid #222222;

    border-radius: 32px;

    display: flex;

    align-items: center;

    padding: 0 14px;

    margin-bottom: 18px;

    box-shadow:
        0 2px 7px rgba(0, 0, 0, 0.06);
}


.search-icon {
    font-size: 21px;

    color: #555555;

    margin-right: 13px;
}


.search-box input {
    flex: 1;

    min-width: 0;

    border: none;

    outline: none;

    background: transparent;

    font-size: 15px;

    color: #222222;
}


.search-box input::placeholder {
    color: #777777;
}


.search-settings {
    border: none;

    background: transparent;

    color: #333333;

    font-size: 20px;

    cursor: pointer;

    padding: 5px;
}


/* =========================================
   TARJETAS
   ========================================= */

.card {
    width: 100%;

    background: #ffffff;

    border-radius: 16px;

    padding: 16px;

    margin-bottom: 18px;

    box-shadow:
        0 3px 10px rgba(0, 0, 0, 0.08);
}


/* =========================================
   ENCABEZADO DE TARJETAS
   ========================================= */

.card-header {
    display: flex;

    align-items: center;

    gap: 12px;

    margin-bottom: 12px;
}


.card-header h2 {
    font-size: 17px;

    font-weight: 800;

    color: #222222;
}


/* =========================================
   ICONOS DE TARJETAS
   ========================================= */

.card-icon {
    width: 43px;
    height: 43px;

    min-width: 43px;

    border-radius: 50%;

    display: flex;

    align-items: center;
    justify-content: center;

    color: #ffffff;

    font-size: 19px;
}


.red-icon {
    background: #d4144e;
}


.blue-icon {
    background: #1686d9;
}


/* =========================================
   DATO DEL DÍA
   ========================================= */

.daily-card {
    border-left: 6px solid #d4144e;
}


.daily-card .card-content {
    padding-left: 1px;
}


.daily-card h3 {
    font-size: 19px;

    color: #151515;

    margin-bottom: 9px;
}


.daily-card p {
    font-size: 15px;

    line-height: 1.45;

    color: #444444;

    margin-bottom: 14px;
}


.outline-red {
    display: inline-flex;

    align-items: center;

    gap: 10px;

    padding: 9px 17px;

    border-radius: 22px;

    border: 2px solid #b51e3d;

    background: #ffffff;

    color: #a51d35;

    font-size: 14px;

    font-weight: 700;

    cursor: pointer;
}


.outline-red:hover {
    background: #b51e3d;

    color: #ffffff;
}


/* =========================================
   DESAFÍO
   ========================================= */

.challenge-card {
    background: #e9f6ff;

    border-left: 6px solid #1686e8;
}


.challenge-card .question {
    font-size: 18px;

    line-height: 1.35;

    margin-bottom: 17px;

    color: #151515;
}


.answer-buttons {
    display: grid;

    grid-template-columns: 1fr;

    gap: 9px;
}


.answer-buttons button {
    min-height: 44px;

    border-radius: 24px;

    border: 2px solid #245775;

    background: #ffffff;

    color: #222222;

    font-size: 14px;

    font-weight: 600;

    cursor: pointer;
}


.answer-buttons button:first-child {
    border-color: #1686e8;
}


.answer-buttons button:hover {
    background: #f0f8ff;
}


/* =========================================
   ACCESOS DIRECTOS
   ========================================= */

.shortcuts {
    width: 100%;

    margin-top: 5px;

    margin-bottom: 10px;
}


.section-title {
    display: flex;

    align-items: center;

    gap: 10px;

    padding: 0 4px 7px;

    margin-bottom: 12px;

    border-bottom: 1px solid #ffffff;
}


.section-title h2 {
    font-size: 18px;

    font-weight: 800;

    color: #222222;
}


.grid-icon {
    width: 30px;

    color: #1686c9;

    font-size: 22px;

    display: flex;

    justify-content: center;
}


/* =========================================
   CUADRÍCULA
   ========================================= */

.shortcut-grid {
    display: grid;

    grid-template-columns: repeat(2, minmax(0, 1fr));

    gap: 10px;
}


/* =========================================
   TARJETAS DE ACCESO
   ========================================= */

.shortcut-card {
    min-height: 112px;

    background: #ffffff;

    border-radius: 15px;

    border: 1px solid #d4d7da;

    box-shadow:
        0 3px 9px rgba(0, 0, 0, 0.08);

    display: flex;

    align-items: center;

    padding: 12px;

    gap: 9px;

    position: relative;

    transition:
        transform 0.2s ease,
        box-shadow 0.2s ease;
}


.shortcut-card:hover {
    transform: translateY(-2px);

    box-shadow:
        0 5px 13px rgba(0, 0, 0, 0.12);
}


/* =========================================
   ICONOS DE ACCESO
   ========================================= */

.shortcut-icon {
    width: 48px;
    height: 48px;

    min-width: 48px;

    flex-shrink: 0;

    border-radius: 50%;

    display: flex !important;

    align-items: center;
    justify-content: center;

    font-size: 20px;

    color: #ffffff;

    opacity: 1;

    visibility: visible;
}


.shortcut-icon.orange {
    background: #e67e00 !important;
}


.shortcut-icon.cyan {
    background: #1686c9 !important;
}


.shortcut-icon.green {
    background: #15965a !important;
}


.shortcut-icon.brown {
    background: #8b5e3c !important;
}


/* =========================================
   TEXTO DE ACCESOS
   ========================================= */

.shortcut-text {
    min-width: 0;

    padding-right: 20px;
}


.shortcut-text h3 {
    font-size: 14px;

    color: #171717;

    margin-bottom: 5px;

    line-height: 1.2;

    font-weight: 800;
}


.shortcut-text p {
    font-size: 11px;

    color: #444444;

    line-height: 1.25;
}


.arrow {
    position: absolute;

    right: 9px;

    color: #555555;

    font-size: 14px;
}


/* =========================================
   CRÉDITO
   ========================================= */

.developer {
    text-align: center;

    color: #666666;

    font-size: 12px;

    padding: 20px 0 12px;
}


/* =========================================
   BARRA INFERIOR
   ========================================= */

.bottom-nav {
    position: fixed;

    left: 0;
    bottom: 0;

    width: 100%;

    height: 74px;

    background: #dfe2e5;

    border-top: 1px solid #c9cdd0;

    box-shadow:
        0 -3px 12px rgba(0, 0, 0, 0.10);

    display: flex;

    justify-content: space-around;

    align-items: stretch;

    z-index: 100;
}


.nav-item {
    flex: 1;

    display: flex;

    flex-direction: column;

    align-items: center;

    justify-content: flex-start;

    padding-top: 11px;

    gap: 5px;

    color: #333333;

    font-size: 11px;

    position: relative;
}


.nav-item i {
    font-size: 25px;

    line-height: 1;

    display: block;

    margin-bottom: 2px;
}


.nav-item span {
    font-size: 10px;

    line-height: 1.1;
}


/* =========================================
   COLORES BARRA INFERIOR
   ========================================= */

.nav-red i {
    color: #d4144e;
}


.nav-blue i {
    color: #1686c9;
}


.nav-orange i {
    color: #e67e00;
}


.nav-green i {
    color: #15965a;
}


.nav-brown i {
    color: #8b5e3c;
}


.nav-item.active {
    font-weight: 700;
}


.nav-red.active::after {
    content: "";

    position: absolute;

    bottom: 0;

    left: 20%;

    width: 60%;

    height: 4px;

    background: #d4144e;

    border-radius: 5px 5px 0 0;
}


/* =========================================
   SEGURIDAD EXTRA PARA CELULARES
   ========================================= */

@media (max-width: 600px) {

    .header {
        height: 92px !important;
        min-height: 92px !important;

        padding: 0 16px !important;
    }


    /* MATRÁZ */

    .header .brand-icon {
        position: absolute !important;

        left: 16px !important;
        right: auto !important;

        top: 50% !important;

        transform: translateY(-50%) !important;
    }


    /* TÍTULO */

    .header .brand-text {
        position: absolute !important;

        left: 50% !important;
        right: auto !important;

        top: 50% !important;

        transform: translate(-50%, -50%) !important;
    }


    /* USUARIO */

    .header .profile-button {
        position: absolute !important;

        left: auto !important;
        right: 16px !important;

        top: 50% !important;

        transform: translateY(-50%) !important;
    }


    /* LÍNEA */

    .blue-line {
        width: 92% !important;

        height: 4px;

        margin-top: 0 !important;

        margin-bottom: 12px !important;
    }


    /* CONTENIDO */

    .main-content {
        padding: 0 12px;
    }

}
