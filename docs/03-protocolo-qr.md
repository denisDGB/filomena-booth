# 03 — Protocolo QR (cabina)

Gera: *lo importante es lo que contiene; el programa lo detecta.*

## Qué va dentro del QR

No es `https://www.photobook.com.mx/`.  
No es el texto tipo `CabinaFilolena[ ActivarCabina => "Si" ]` (eso fue explicación humana; el lector usa URL + JSON).

Es:

```text
https://thefilomenabooth.pe?auth=<sha1>&j=<json_urlencode>
```

### JSON (orden fijo, sin espacios)

Igual que `json_encode` de PHP:

```json
{"c1":"profile6","autoemail":"noreply@filomena.studio","expiry":1710000000}
```

- `c1`: perfil de cabina (`profile6`; Gera, ago 2026)
- `autoemail`: envío automático de fotos (hoy fijo `noreply@filomena.studio`)
- `expiry`: Unix time; ahora + **605000** s (~7 días)

### Firma

```text
auth = sha1( jsonString + BOOTH_AUTH_PASSWORD )
```

Si cambia un espacio, el orden de claves o la clave, el `auth` no coincide y **la cabina ignora el QR**.

Código: `server/booth-url.js`. Check: `npm run check`.

El nombre y el teléfono del invitado **no** van en el JSON (el PHP de Gera no los trae). Solo viven en nuestro SQLite y en la página `/i/`.

## Página vs cabina

| URL | Rol |
|-----|-----|
| `{PUBLIC_URL}/i/{token}` | Lo abre el invitado (bonito). **No** es lo que lee la cabina |
| `thefilomenabooth.pe?auth=&j=` | Eso está **dibujado** en el QR |

## Generación

`qrcode` en el servidor → `GET /api/invites/:token/qr` (PNG). El QR de INTEMPO (versiones 1–4) no alcanzaba para esta URL.
