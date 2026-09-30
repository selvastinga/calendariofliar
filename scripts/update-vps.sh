#!/usr/bin/env bash
# Actualiza el bot en el VPS: trae los últimos cambios y reinicia el proceso pm2.
# Correr desde la carpeta ~/calendario-familiar
set -e

git pull
npm install --production
pm2 restart calendario-familiar
