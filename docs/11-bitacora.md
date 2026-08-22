# 11 — Bitácora de decisiones

Registro cronológico del proyecto Filomena (y de dónde salió). Fechas aprox. según chats.

## Origen (ago 2026)

Se cotizó reutilizar el sistema de invitaciones + QR de **INTEMPO** (concierto Tavo / Lima): extraer, desmarcar, subdominio, cupo de tokens. Precio orientativo USD 900–1 500; vía fácil = app Node aparte + CNAME, no meterse en su hosting PHP.

## Producto (Angelica)

- Photobook / cabina física con aro de luz y pantalla.
- Quería tokens con tope → pidió **QRs libres, sin tope**. Aceptado.
- El QR **no** es “entrar a una sesión web de fotos”: **activa la cabina y empieza a tomar**.
- Ella **no interviene** (no hay “conceder acceso” desde admin en el momento).
- Cortesía hoy: mandan QR sin integración bonita; el de **pago** ya sale del flujo de cobro y sí lo lee la máquina.
- Invitado acerca el **celular** al lector integrado (*“Acerca tu celular con el QR que recibiste”*).
- Varias cabinas a futuro. Fotos en disco Windows, carpeta por fecha; su app ya guarda.
- Gera crea el **subdominio**. Sitio público: `photobook.com.mx`.

## QRs de ejemplo (ruido)

Se recibieron QR que decodifican a `https://www.photobook.com.mx/` y a un StackBlitz. **No activan la cabina**; son web. Un texto tipo `CabinaFilolena[ActivarCabina=>…]` se tomó como descripción, no como payload real.

## Protocolo real (Gera, 18 ago 2026)

Fragmento PHP:

- `$json['c1'] = "activarPhotobooth"`
- `$json['autoemail'] = "noreply@filomena.studio"`
- `$json['expiry'] = time() + 605000`
- `$auth = sha1($jsonStr . "<auth_password>")`
- URL: `https://thefilomenabooth.pe?auth=$auth&j=` + urlencode del JSON

“Este json me funciona para activar la cabina. El `$url` va al generador de QR.”

Contraseña: se deja **para el final**. QR de pago de muestra: **no lo dan**; prueba en cabina con el nuestro.

## Implementación (esta rama)

- Repo/árbol **nuevo** en la rama de trabajo: solo Filomena.
- No copiar landing, RSVP, aforo, `/door` ni emails de INTEMPO.
- Firma en servidor; secret en `.env`.
- Página `/i/` muestra el QR; la cabina lee `thefilomenabooth.pe?…`.

## Firma y hosting (22 ago 2026)

- Gera: no ve problema en compartir el secreto de firma (Opción A: nosotros firmamos; la clave va solo en el servidor).
- Ellos tienen dominio, **sin** hosting: se pide que nosotros levantemos la app.
- Acordado: Railway lo pagan ellos; retainer de mantenimiento **USD 40 / mes** (uptime, soporte puntual, ajustes menores; features nuevas aparte).
- `/admin` es la **ruta** del panel; el subdominio es otro (ej. `invitaciones.…`).

## Railway de prueba (22 ago 2026)

- Servicio vivo: `https://filomena-booth-production.up.railway.app` → panel `/admin`.
- Root Directory vacío; dominio público en puerto **8080**.
- Volumen: `filomena-booth-volume` (5 GB) enlazado al servicio. Mount `/data` + `DATA_DIR=/data`.
- Checklist env: ver [05-env-y-despliegue.md](./05-env-y-despliegue.md).
- UI panel (mismo día): branding Filomena, canales WA/email, toast, poll de KPIs, invitación full-bleed + QR descargable con marca.

## Pendiente

1. `BOOTH_AUTH_PASSWORD` de Gera → ponerla en Railway → regenerar cortesías  
2. CNAME del subdominio → servicio Railway + `PUBLIC_URL=https://<subdominio>` (siempre con esquema)  
3. Prueba física en cabina  
4. Si hace falta distinguir cabinas o email del invitado en el JSON: coordinar con Gera (hoy el JSON es el de su snippet, sin campos extra)
