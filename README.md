# Calendario Familiar por WhatsApp

Bot de WhatsApp (no oficial, vía [Baileys](https://github.com/WhiskeySockets/Baileys)) que escucha un grupo
familiar y carga eventos en una base de datos local. Los eventos se ven en una página web con calendario
visual (FullCalendar).

## ⚠️ Importante antes de empezar

- Esto usa una librería **no oficial** que se conecta como si fuera WhatsApp Web. No hay forma 100% gratis
  y oficial de hacer esto para uso personal/familiar (la API oficial de Meta es para empresas y tiene costo).
- Usalo con moderación (un grupo familiar chico, pocos mensajes) para minimizar el riesgo de que WhatsApp
  banee el número. Si te preocupa, usá un número de repuesto/secundario para el bot, no tu número principal.
- El teléfono vinculado no necesita estar encendido todo el tiempo (queda vinculado como un "dispositivo
  vinculado" en la nube de WhatsApp), pero el proceso de Node sí tiene que estar corriendo 24/7.

## Requisitos

- Node.js 20+ (probado con Node 24)
- Un celular con WhatsApp para escanear el QR una sola vez
- Un grupo de WhatsApp familiar ya creado

## Instalación

```bash
npm install
cp .env.example .env
npm start
```

La primera vez va a aparecer un código QR en la terminal. Abrí WhatsApp en tu celular →
**Configuración → Dispositivos vinculados → Vincular un dispositivo** y escaneá el código.

## Configurar el grupo autorizado

1. Con el bot corriendo y ya vinculado, escribí cualquier mensaje con `/` (ej: `/ayuda`) en el grupo familiar.
2. En la terminal vas a ver algo como:
   ```
   📌 Mensaje recibido en grupo sin configurar. GROUP_ID = 120363012345678901@g.us
   ```
3. Copiá ese valor en el archivo `.env`:
   ```
   GROUP_ID=120363012345678901@g.us
   ```
4. Reiniciá el bot (`npm start`). A partir de ahora solo responde en ese grupo.

## Comandos disponibles en el grupo

```
/evento Título | DD/MM/AAAA HH:MM | Lugar | Descripción
```
`Lugar` y `Descripción` son opcionales. Si no ponés hora, asume 09:00.

Ejemplos:
```
/evento Cumple de Juan | 15/10/2026 18:00 | Casa de la abuela
/evento Reunión de padres | 03/11/2026 19:30
```

Otros comandos:
- `/eventos` — lista los próximos eventos cargados
- `/borrar ID` — borra un evento por su número (el ID lo muestra `/eventos`)
- `/ayuda` — muestra la ayuda

## Ver el calendario

Con el servidor corriendo, abrí `http://localhost:3000` (o la IP/dominio del servidor donde lo despliegues).

## Estructura del proyecto

```
src/
  index.js        -> arranca Express + el bot de WhatsApp
  whatsapp.js      -> conexión a WhatsApp y manejo de comandos
  eventParser.js   -> interpreta el texto de /evento y /borrar
  db.js            -> acceso a la base SQLite (data/calendario.db)
  routes/events.js -> API REST (GET /api/events, DELETE /api/events/:id)
public/
  index.html, app.js, style.css -> calendario visual (FullCalendar)
data/
  calendario.db    -> base de datos (se crea sola, no se versiona en git)
auth_info_baileys/
  credenciales de la sesión de WhatsApp (no se versiona en git)
```

## Desplegar en un VPS (recomendado para que quede 24/7)

1. Contratá un VPS chico (alcanza con el más básico de DigitalOcean, Hetzner, Railway, etc.).
2. Instalá Node.js en el servidor.
3. Subí el proyecto (por ejemplo con `git`, excluyendo `node_modules`, `data/` y `auth_info_baileys/`).
4. `npm install --production`
5. Usá [pm2](https://pmdocs.com/) para mantenerlo corriendo y que reinicie solo si se cae:
   ```bash
   npm install -g pm2
   pm2 start "node --experimental-sqlite src/index.js" --name calendario-familiar
   pm2 save
   pm2 startup   # sigue las instrucciones para que arranque solo al reiniciar el VPS
   ```
6. La primera vez tenés que ver el QR: corré `pm2 logs calendario-familiar` para verlo y escanearlo.
7. Para ver el calendario desde afuera, abrí el puerto 3000 en el firewall del VPS, o mejor, poné un
   proxy reverso (nginx/Caddy) con HTTPS delante del puerto 3000.

## Próximos pasos posibles

- Agregar recordatorios automáticos (ej: el bot avisa un día antes de cada evento).
- Permitir editar un evento (`/editar ID | ...`) en vez de solo borrar y recargar.
- Autenticación simple en la web si la vas a exponer a internet sin restricciones.
