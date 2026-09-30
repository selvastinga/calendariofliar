#!/usr/bin/env bash
# Configura un VPS Ubuntu/Debian nuevo desde cero: Node.js, git, pm2 y clona el repo.
# Uso: ./setup-vps.sh https://github.com/tu-usuario/tu-repo.git
set -e

REPO_URL="$1"
if [ -z "$REPO_URL" ]; then
  echo "Uso: ./setup-vps.sh https://github.com/tu-usuario/tu-repo.git"
  exit 1
fi

sudo apt-get update
sudo apt-get install -y curl git

curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

sudo npm install -g pm2

git clone "$REPO_URL" calendario-familiar
cd calendario-familiar
npm install --production
cp .env.example .env

echo ""
echo "Listo. Ahora:"
echo "  1) Editá .env (nano .env) si necesitás cambiar el PORT."
echo "  2) Arrancá el bot con:"
echo "     pm2 start \"node --experimental-sqlite src/index.js\" --name calendario-familiar"
echo "  3) Mirá el QR con: pm2 logs calendario-familiar"
echo "  4) Guardá el proceso para que sobreviva reinicios:"
echo "     pm2 save && pm2 startup"
