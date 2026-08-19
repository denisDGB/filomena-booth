# 01 — Resumen

## Qué es

Panel para que **Angelica (Filomena Studio)** registre invitados de cortesía **sin tope**. Cada persona recibe un link a una página con un **QR**. El invitado acerca el celular a la cabina; el lector integrado lee el QR y **activa la sesión de fotos** (`activarPhotobooth`). Angelica no interviene en la cabina.

Este repo **no** es el concierto INTEMPO. INTEMPO quedó en la rama `main` del repo original; aquí solo vive Filomena.

## Qué no es

- El sitio `photobook.com.mx` (web de ellos; no se toca)
- El software de la cabina ni el lector (ya lo tienen)
- El flujo de **pago** (ya genera QR)
- Galería / subida de fotos (siguen en Windows, carpeta por fecha, app de ellos)

## Stack

| Pieza | Tecnología |
|--------|------------|
| Front | HTML / CSS / JS |
| Backend | Node ≥ 22, `node:http`, sin framework |
| DB | SQLite (`node:sqlite`) |
| QR | paquete `qrcode` (la URL de cabina es larga) |

## Comandos

```bash
npm install
npm run check    # firma JSON + sha1 como el PHP
npm run dev      # local, lee .env
npm start        # producción
```

- Admin: `{PUBLIC_URL}/admin`
- Invitado: `{PUBLIC_URL}/i/{token}`
