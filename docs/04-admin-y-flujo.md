# 04 — Admin y flujo

## Crear cortesía

1. `/admin` + `ADMIN_SECRET`
2. Nombre (obligatorio)
3. Canal: **WhatsApp** / **Email** / **Ambos** (campos visibles y obligatorios según la opción)
4. WhatsApp: prefijo de país + número con espacios automáticos (ej. `999 888 777` en PE)
5. **Crear y generar QR** → se firma la URL de cabina y se guarda

## KPIs

Creadas · Abiertas · Pendientes · Vencidas. Se recalculan:

- al crear / editar / eliminar
- con el botón actualizar a la derecha de Lista (junto al contador)
- en poll silencioso ~cada 4 s (pausa si la pestaña está oculta)

“Abiertas” = el invitado cargó `/i/{token}` (`opened_at`).

## Lista

- **Contacto:** email y/o WhatsApp. Junto al número: icono **copiar** (mensaje listo para WhatsApp con el link `/i/{token}`); el número abre `wa.me` con el mismo texto
- **Editar:** carga el formulario (PATCH; no regenera el QR de cabina)
- **Abrir:** página del invitado
- **Eliminar:** borra el registro; deja de mostrarse el QR (la cabina no tiene lista nuestra)

Avisos de éxito/error: toast abajo a la izquierda (no banner).

Sin RSVP, sin aforo, sin pantalla `/door`.

## Invitado

`/i/{token}`: layout a ancho completo (texto + QR), fade-in, saludo, **Descargar QR** (PNG con logo Filomena + *Analog look. Filomena feel.*). Brillo del celular si no enfoca.

## Cabina (ellos)

Pantalla: *Acerca tu celular con el QR que recibiste*. Lector integrado. Fotos a carpeta Windows por fecha.
