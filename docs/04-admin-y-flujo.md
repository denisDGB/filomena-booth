# 04 — Admin y flujo

## Crear cortesía

1. `/admin` + `ADMIN_SECRET`
2. Nombre (obligatorio). Email / WhatsApp opcionales (solo contacto nuestro)
3. **Crear y generar QR** → se firma la URL de cabina y se guarda

## Lista

- **Abrir:** página del invitado
- **Copiar:** link `/i/{token}` para WhatsApp
- **Eliminar:** borra el registro; deja de mostrarse el QR (la cabina no tiene lista nuestra)

Sin RSVP, sin aforo, sin pantalla `/door`.

## Invitado

`/i/{token}`: saludo + QR grande + “acerca a la cabina”. Brillo del celular si no enfoca.

## Cabina (ellos)

Pantalla: *Acerca tu celular con el QR que recibiste*. Lector integrado. Fotos a carpeta Windows por fecha.
