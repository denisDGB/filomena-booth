# 10 — Changelog

## 2026-08-23 — Firma de cabina + Excel

- Gera entregó `BOOTH_AUTH_PASSWORD` (poner solo en env / Railway; **no** en el repo). Recrear cortesías tras cargarla.
- Auth confirmado igual al PHP: `sha1(json + password)` → `thefilomenabooth.pe?auth=&j=`
- Admin: **Descargar** → Excel de invitados (creado, vence, abierto, contacto, link, estado)

## 2026-08-22 — Panel en vivo y polling

- Admin: KPIs (creadas / abiertas / pendientes / vencidas) con **poll cada 4 s** + botón actualizar a la derecha (junto al contador de Lista)
- Avisos (crear / editar / eliminar / copiar WA) en toast inferior izquierdo
- Canal de contacto: WhatsApp / email / ambos; máscara de teléfono con espacios (estilo PE)
- Lista: Editar · Abrir · Eliminar; copiar mensaje de WhatsApp al lado del número
- Invitación `/i/{token}` a ancho completo, fade-in, descarga de QR con logo + tagline
- Branding: logo `assets/logo.svg`, login centrado, estilo B/N Filomena
- `PUBLIC_URL` debe incluir `https://` (sin esquema el link Abrir se duplica y da 404 JSON)

## 2026-08-22 — Deploy Railway (prueba)

- Servicio en Railway: `https://filomena-booth-production.up.railway.app` (panel `/admin`)
- Docs: checklist de variables, volumen `/data`, puerto 8080, rutas vs subdominio, retainer USD 40/mes
- Bitácora: Opción A (ellos dan la password), hosting a cargo nuestro sobre cuenta Railway de ellos

## 2026-08-18 — Arranque Filomena

- App Node: alta sin tope, SQLite, página `/i/{token}`, PNG del QR
- `server/booth-url.js`: JSON + sha1 como el PHP de Gera (`thefilomenabooth.pe`)
- Rama dejada **solo** con este producto; código INTEMPO no forma parte de este árbol (sigue en `main` del repo origen)
- Documentación en `docs/`
