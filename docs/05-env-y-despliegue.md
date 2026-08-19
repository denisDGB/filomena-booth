# 05 — Entorno y despliegue

## Variables (`.env.example`)

| Variable | Uso |
|----------|-----|
| `PORT` | Default 3001 (no chocar con otros proyectos en local) |
| `ADMIN_SECRET` | Panel `/admin` |
| `PUBLIC_URL` | Base de links `/i/…` |
| `BOOTH_AUTH_PASSWORD` | Secreto de Gera para `sha1`. Vacío = firma `""` |
| `DATA_DIR` | Carpeta SQLite (Railway: `/data`) |

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

## Producción (vía fácil)

1. Servicio Node (Railway u otro) + volumen SQLite  
2. Gera: CNAME del subdominio → ese servicio  
3. `PUBLIC_URL=https://<subdominio>`  
4. No instalar esto dentro de `photobook.com.mx`

Prueba con Gera: crear cortesía → mandar PNG o URL cruda (`GET /api/booth/preview` con header admin) → acercar a la cabina.
