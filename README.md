# Filomena — invitaciones de cortesía (QR cabina)

Genera QRs que la cabina ya sabe leer. El contenido es el de Gera:

`https://thefilomenabooth.pe?auth=<sha1>&j=<json>`

JSON: `c1=profile6`, `autoemail=noreply@filomena.studio`, `expiry` ≈ 7 días.
Firma: `sha1(json + BOOTH_AUTH_PASSWORD)` — igual que el PHP.

Sin tope de invitados. Las fotos las sigue guardando su software en Windows.

## Arranque

Documentación: [docs/](./docs/).

```bash
cp .env.example .env   # ADMIN_SECRET; BOOTH_AUTH_PASSWORD cuando Gera la dé
npm install
npm run check
npm run dev
```

- Admin: http://localhost:3001/admin
- Invitado: el link ` /i/{token} ` que copia el panel

Hasta que no esté `BOOTH_AUTH_PASSWORD`, el QR se firma con secreto vacío: Gera puede ver la forma; **la cabina no activará**. Cuando llegue la clave, ponla en `.env` y **crea de nuevo** al invitado (los QR viejos quedan mal firmados).

## Probar con Gera (sin QR de pago)

1. Crea una cortesía.
2. Ábrela y mándale el PNG **o** la URL cruda: `GET /api/booth/preview` (admin) muestra `json` + `url`.
3. Él acerca ese QR a la cabina.

## Deploy

App aparte (Railway). Detalle: [docs/05-env-y-despliegue.md](./docs/05-env-y-despliegue.md).

- Prueba actual: https://filomena-booth-production.up.railway.app/admin  
- Producción: `PUBLIC_URL=https://invitaciones.photobook.com.mx` (o el subdominio que arme Gera). CNAME → el servicio.  
- No se toca el PHP de photobook.com.mx.

## Qué no hace

Lector de cabina, pagos, galería de fotos, tope de tokens.
