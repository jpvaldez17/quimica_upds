/* =========================================
   QUÍMICA UPDS
   SISTEMA DE NAVEGACIÓN
   Developed by J. Poma · 2026
   ========================================= */


/* =========================================
   FUNCIÓN PRINCIPAL DE NAVEGACIÓN
   ========================================= */

function mostrarPagina(pagina) {

    /* Ocultar todas las páginas */

    const paginas = document.querySelectorAll(".app-page");

    paginas.forEach(function(elemento) {

        elemento.style.display = "none";

    });


    /* Mostrar la página seleccionada */

    const paginaSeleccionada = document.getElementById(pagina);

    if (paginaSeleccionada) {

        paginaSeleccionada.style.display = "block";

    }


    /* Quitar estado activo de todos los botones */

    const botones = document.querySelectorAll(".nav-item");

    botones.forEach(function(boton) {

        boton.classList.remove("active");

    });


    /* Activar el botón correspondiente */

    const botonActivo = document.querySelector(
        '.nav-item[data-page="' + pagina + '"]'
    );


    if (botonActivo) {

        botonActivo.classList.add("active");

    }


    /* Volver arriba */

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   INICIAR APLICACIÓN
   ========================================= */

document.addEventListener("DOMContentLoaded", function() {

    mostrarPagina("inicio");

});
