# 05 — Entorno y despliegue

## Variables (`.env.example`)

| Variable | Uso |
|----------|-----|
| `PORT` | Local: 3001. En Railway lo asigna la plataforma (target del dominio: **8080**) |
| `ADMIN_SECRET` | Clave del panel `/admin` |
| `PUBLIC_URL` | Base absoluta de links `/i/…` — **con** `https://`, sin `/` final |
| `BOOTH_AUTH_PASSWORD` | Secreto de Gera para `sha1`. Vacío = firma `""` (cabina no activa) |
| `DATA_DIR` | Carpeta SQLite. Railway: `/data` + volumen montado ahí |

Nunca commitear `.env`.

## Local

```bash
cp .env.example .env
# ADMIN_SECRET obligatorio
npm install
npm run check
npm run dev
```

Cuando llegue la password: escribirla, reiniciar, **crear otra vez** al invitado (QR viejos quedan con la firma anterior).

## Railway (estado actual)

Servicio de prueba ya levantado:

- URL: `https://filomena-booth-production.up.railway.app`
- Panel: `https://filomena-booth-production.up.railway.app/admin`
- Root Directory: **vacío** (`package.json` está en la raíz del repo)
- Start: `npm start`
- Generate Domain → puerto **8080** (la app usa `process.env.PORT`)

### Checklist del servicio

1. **Variables**

   | Variable | Valor |
   |----------|--------|
   | `ADMIN_SECRET` | Clave fuerte (la del login del panel) |
   | `PUBLIC_URL` | `https://filomena-booth-production.up.railway.app` (**obligatorio** el `https://`; sin esquema Abrir duplica el host y responde `{"error":"not found"}`) |
   | `BOOTH_AUTH_PASSWORD` | Vacío hasta que Gera la dé |
   | `DATA_DIR` | `/data` |

2. **Volumen** — confirmado: `filomena-booth-volume` (5 GB) enlazado al servicio `filomena-booth`. Mount path debe ser **`/data`** y variable `DATA_DIR=/data`.

3. **Custom domain** (cuando lo den): CNAME del subdominio → host que indique Railway; actualizar `PUBLIC_URL=https://<subdominio>`.

### Rutas vs subdominio

| Concepto | Ejemplo |
|----------|---------|
| Subdominio (DNS) | `invitaciones.photobook.com.mx` (o el que arme Gera) |
| Panel | `https://<host>/admin` |
| Invitado | `https://<host>/i/{token}` |

`/admin` es **ruta**, no el nombre del subdominio.

## Producción (pendiente de ellos)

1. `BOOTH_AUTH_PASSWORD` de Gera → ponerla en Railway → **recrear** cortesías  
2. CNAME del subdominio → servicio Railway  
3. `PUBLIC_URL=https://<subdominio>`  
4. No instalar esto dentro del PHP de `photobook.com.mx`

Prueba con Gera: crear cortesía → mandar PNG o URL cruda (`GET /api/booth/preview` con header admin) → acercar a la cabina.

## Operación / mantenimiento

- Infra Railway: la pagan ellos (cuenta suya; acceso para deploy).
- Retainer acordado: **USD 40 / mes** — uptime, soporte puntual, ajustes menores (~1–2 h). Features nuevas aparte.
