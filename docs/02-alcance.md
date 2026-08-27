# 02 — Alcance acordado

Cliente: **Angelica** · Filomena Studio / Photobook (`photobook.com.mx`).  
Contacto técnico cabina: **Gera** (+51).

## Incluido

- Alta de invitados sin límite de QRs
- QR **privado** por persona (URL firmada, no un link genérico a la home)
- Página de invitación con marca simple para acercar el celular a la cabina
- Panel admin con clave
- Deploy en app propia + **subdominio** (CNAME); no se mete Node en su PHP
- Una ronda de textos/colores cuando pasen logo

## Fuera (fase 2 o ellos)

- Lector / programa de la cabina
- Pagos
- Photobook online / storage de fotos
- WhatsApp o email automáticos masivos (sí: copiar link)
- Offline
- Varias marcas/eventos en un solo panel (sí: el JSON puede apuntar a una cabina; hoy el comando es el de Gera, fijo)

## Acuerdos de producto (chat)

| Tema | Decisión |
|------|----------|
| Tope de tokens | **Sin tope** |
| Quién lee el QR | **Solo la máquina** (el invitado acerca el celular) |
| Intervención de Angelica en cabina | **Ninguna**; el QR dispara solo |
| Cortesía vs pago | El de pago ya funciona; cortesía se mandaba fea (a veces un QR a `photobook.com.mx`). Ahora cortesía = mismo protocolo que Gera + página linda |
| Varias cabinas | Previsto a futuro; hoy `c1` fijo `profile6` para esta cabina |
| Fotos | Carpeta Windows por fecha; su app las guarda |
| Subdominio | Gera lo crea; app aparte |
| Contraseña de firma | **Último**; `BOOTH_AUTH_PASSWORD` en `.env`. Sin ella el QR se firma con `""` y la cabina no activará |
| QR de pago de muestra | No lo dan; Gera valida el nuestro en la máquina |
