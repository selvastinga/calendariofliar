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

## Desplegar en Google Cloud Free Tier (VPS gratis 24/7)

### 1. Crear la VM gratuita

1. Entrá a [console.cloud.google.com](https://console.cloud.google.com/) y creá un proyecto nuevo.
2. Activá la **Compute Engine API** (te lo va a pedir la primera vez que entrás a "VM instances").
3. Creá una instancia nueva con estos valores (son los que entran en la capa "Always Free"):
   - **Región**: `us-west1`, `us-central1` o `us-east1` (solo estas tres son gratis).
   - **Tipo de máquina**: `e2-micro`.
   - **Imagen de arranque**: Ubuntu 22.04 LTS.
   - **Disco**: hasta 30GB estándar (incluido en el free tier).
4. En **Firewall**, marcá "Allow HTTP traffic" (y "Allow HTTPS traffic" si más adelante configurás un dominio).
5. Creá una regla de firewall extra para el puerto 3000 (Menú → VPC network → Firewall → Create firewall rule):
   - Target: todas las instancias (o con tag `http-server`)
   - Rango de IPs origen: `0.0.0.0/0`
   - Protocolos y puertos: TCP `3000`

### 2. Conectarte por SSH

Desde la lista de instancias en la consola, hacé clic en el botón **SSH** al lado de tu VM (abre una
terminal en el navegador, no necesitás configurar claves).

### 3. Subir tu código a GitHub (una sola vez, desde tu PC)

```powershell
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git branch -M main
git push -u origin main
```
(Creá antes el repo vacío en github.com, podés dejarlo **privado**.)

### 4. Instalar todo en el VPS (dentro de la terminal SSH del paso 2)

```bash
chmod +x scripts/setup-vps.sh   # si ya clonaste el repo manualmente, si no, bajá el script primero
curl -o setup-vps.sh https://raw.githubusercontent.com/TU-USUARIO/TU-REPO/main/scripts/setup-vps.sh
chmod +x setup-vps.sh
./setup-vps.sh https://github.com/TU-USUARIO/TU-REPO.git
```

Esto instala Node.js, git, pm2, clona tu repo y deja todo listo.

### 5. Arrancar el bot

```bash
cd calendario-familiar
pm2 start "node --experimental-sqlite src/index.js" --name calendario-familiar
pm2 logs calendario-familiar   # acá ves el QR, escaneálo con WhatsApp
```

Configurá el `GROUP_ID` como se explica más arriba (editá `.env` con `nano .env`, después
`pm2 restart calendario-familiar`).

Para que el bot sobreviva a un reinicio del servidor:
```bash
pm2 save
pm2 startup   # copiá y corré el comando que te sugiere
```

### 6. Ver el calendario

Buscá la **IP externa** de tu VM en la consola de Google Cloud y entrá a:
`http://IP_EXTERNA:3000`

### 7. Actualizar el bot en el futuro

Desde tu PC, hacé los cambios, `git push`. Después en el VPS:
```bash
cd calendario-familiar
./scripts/update-vps.sh
```

### Opcional: dominio propio + HTTPS

Si más adelante querés entrar con un nombre en vez de la IP, instalá `nginx` como proxy reverso hacia
el puerto 3000 y usá `certbot` para un certificado gratis de Let's Encrypt.

## Próximos pasos posibles

- Agregar recordatorios automáticos (ej: el bot avisa un día antes de cada evento).
- Permitir editar un evento (`/editar ID | ...`) en vez de solo borrar y recargar.
- Autenticación simple en la web si la vas a exponer a internet sin restricciones.
