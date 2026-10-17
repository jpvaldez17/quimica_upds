/* =========================================
   QUÍMICA UPDS
   MODO SIN INTERNET (Service Worker)
   Developed by J. Poma · 2026

   Qué hace:
   - La primera vez que se abre con internet, guarda en el
     dispositivo todos los archivos de la app (HTML, CSS, JS,
     logos), los íconos de Font Awesome y la tipografía.
   - Después funciona sin conexión. Si hay internet, se
     actualiza solo en segundo plano.

   Para forzar una actualización completa: cambia VERSION.
   ========================================= */

"use strict";

var VERSION = "v4";
var CACHE = "quimica-upds-" + VERSION;

/* Hojas de estilo externas. Se guardan junto con sus fuentes (.woff2) */
var EXTERNOS_CSS = [
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
];

/* Archivos propios que no aparecen en index.html pero la app necesita */
var EXTRA_LOCAL = [
    "./",
    "index.html",
    "manifest.webmanifest",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-512.png",
    "apple-touch-icon.png",
    "favicon.ico",
    "logo-quimica.svg",
    "logo-upds.svg"
];

var INDEX = new URL("index.html", self.registration.scope).href;


/* ---------- UTILIDADES ---------- */

/* Guarda una respuesta y borra versiones viejas del mismo archivo
   (style.css?v=10 se reemplaza por style.css?v=11) */

function guardar(cache, url, respuesta) {

    return cache.put(url, respuesta).then(function () {

        var u = new URL(url);

        if (u.origin !== self.location.origin) { return; }

        return cache.keys().then(function (claves) {

            return Promise.all(claves.filter(function (k) {

                var x = new URL(k.url);

                return x.origin === u.origin &&
                       x.pathname === u.pathname &&
                       x.search !== u.search;

            }).map(function (k) {

                return cache.delete(k);

            }));

        });

    });

}

/* Busca url(...) en un CSS y devuelve las direcciones absolutas */

function urlsDeCss(texto, base, soloWoff2) {

    var lista = [];

    texto.replace(/url\(([^)]+)\)/g, function (m, u) {

        u = u.replace(/['"]/g, "").trim();

        if (!u || /^data:/i.test(u) || u.charAt(0) === "#") { return; }

        var abs = new URL(u, base).href;

        if (soloWoff2 && !/\.woff2(\?|$)/i.test(abs)) { return; }

        lista.push(abs);

    });

    return lista;

}

function guardarDescarga(cache, url) {

    return fetch(url, { cache: "reload" }).then(function (r) {

        if (r && r.ok) { return guardar(cache, url, r.clone()).then(function () { return r; }); }

        return null;

    }).catch(function () { return null; });

}


/* ---------- INSTALACIÓN: guardar todo ---------- */

function precargar() {

    return caches.open(CACHE).then(function (cache) {

        return fetch(INDEX, { cache: "reload" }).then(function (r) {

            if (!r.ok) { throw new Error("index"); }

            return r.text();

        }).then(function (html) {

            /* Archivos locales con su ?v= exacto, leídos de index.html */

            var porRuta = {};

            html.replace(/(?:href|src)\s*=\s*"([^"]+)"/g, function (m, ref) {

                if (/^(https?:|data:|mailto:|tel:|javascript:|#)/i.test(ref)) { return; }

                var u = new URL(ref, INDEX);

                porRuta[u.pathname] = u.href;

            });

            /* compuestos.js carga compuestosinformacion.js con su mismo ?v= */

            var cmp = html.match(/compuestos\.js\?v=([^"&]+)/);

            EXTRA_LOCAL.concat(["compuestosinformacion.js" + (cmp ? "?v=" + cmp[1] : "")])
                .forEach(function (ref) {

                    var u = new URL(ref, INDEX);

                    if (!porRuta[u.pathname]) { porRuta[u.pathname] = u.href; }

                });

            var locales = Object.keys(porRuta).map(function (k) { return porRuta[k]; });

            return Promise.all(locales.map(function (url) {

                return guardarDescarga(cache, url).then(function (resp) {

                    /* Si es un CSS propio, guardar también lo que cargue con url() */

                    if (resp && /\.css(\?|$)/i.test(url)) {

                        return resp.clone().text().then(function (txt) {

                            return Promise.all(urlsDeCss(txt, url, false).map(function (u2) {

                                return new URL(u2).origin === self.location.origin
                                    ? guardarDescarga(cache, u2)
                                    : null;

                            }));

                        });

                    }

                });

            }));

        }).then(function () {

            /* Font Awesome y tipografías: CSS + archivos .woff2 */

            return Promise.all(EXTERNOS_CSS.map(function (cssUrl) {

                return fetch(cssUrl).then(function (r) {

                    if (!r.ok) { return; }

                    var copia = r.clone();

                    return r.text().then(function (txt) {

                        return cache.put(cssUrl, copia).then(function () {

                            return Promise.all(urlsDeCss(txt, cssUrl, true).map(function (f) {

                                return fetch(f).then(function (rf) {

                                    if (rf && rf.ok) { return cache.put(f, rf); }

                                }).catch(function () {});

                            }));

                        });

                    });

                }).catch(function () {});

            }));

        });

    });

}

self.addEventListener("install", function (e) {

    e.waitUntil(precargar().catch(function () {}).then(function () {

        return self.skipWaiting();

    }));

});


/* ---------- ACTIVACIÓN: borrar cachés viejas ---------- */

self.addEventListener("activate", function (e) {

    e.waitUntil(

        caches.keys().then(function (nombres) {

            return Promise.all(nombres.filter(function (n) {

                return n.indexOf("quimica-upds-") === 0 && n !== CACHE;

            }).map(function (n) { return caches.delete(n); }));

        }).then(function () {

            return self.clients.claim();

        })

    );

});


/* ---------- PETICIONES ---------- */

/* Archivos propios: sale del dispositivo al instante y se
   actualiza en segundo plano si hay internet */

function propio(e) {

    var req = e.request;

    return caches.open(CACHE).then(function (cache) {

        return cache.match(req).then(function (guardado) {

            var red = fetch(req).then(function (resp) {

                if (resp && resp.ok) { guardar(cache, req.url, resp.clone()); }

                return resp;

            });

            if (guardado) {

                e.waitUntil(red.catch(function () {}));

                return guardado;

            }

            return red.catch(function () {

                /* Sin internet y sin esa versión exacta: usar la que haya */

                return cache.match(req, { ignoreSearch: true }).then(function (r) {

                    if (r) { return r; }

                    if (req.mode === "navigate") { return cache.match(INDEX); }

                    return Response.error();

                });

            });

        });

    });

}

/* Recursos externos (íconos, tipografías): primero el dispositivo */

function externo(req) {

    return caches.open(CACHE).then(function (cache) {

        return cache.match(req, { ignoreVary: true }).then(function (guardado) {

            if (guardado) { return guardado; }

            return fetch(req).then(function (resp) {

                if (resp && (resp.ok || resp.type === "opaque")) {

                    cache.put(req, resp.clone());

                }

                return resp;

            });

        });

    });

}

self.addEventListener("fetch", function (e) {

    var req = e.request;

    if (req.method !== "GET") { return; }

    var url = new URL(req.url);

    if (url.protocol !== "http:" && url.protocol !== "https:") { return; }

    e.respondWith(url.origin === self.location.origin ? propio(e) : externo(req));

});
