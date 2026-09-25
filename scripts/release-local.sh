#!/usr/bin/env bash
#
# Pipeline de release self-signed:
#   1. Limpia release/ (evita subir artefactos viejos por wildcard)
#   2. Empaqueta con electron-builder (sign: false) SOLO la app (--dir)
#   3. Firma la app con entitlements (scripts/sign-app.sh)
#   4. Genera DMG + ZIP y latest-mac.yml DESPUÉS de firmar
#
# Uso: npm run release:local
#
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ 1/4 Limpiando release/"
rm -rf release
mkdir -p release

echo "→ 2/4 Empaquetando app (sin archivos)..."
vite build
electron-builder --mac --dir --config electron-builder.internal.yml

APP_PATH="$(find release -maxdepth 2 -type d -name '*.app' | head -n 1)"
if [ -z "${APP_PATH}" ]; then
  echo "No se encontró la app empaquetada en release/" >&2
  exit 1
fi
echo "App empaquetada: ${APP_PATH}"

echo "→ 3/4 Firmando app..."
APP_PATH="$APP_PATH" bash scripts/sign-app.sh

echo "→ 4/4 Generando DMG/ZIP y metadatos de actualización..."
# --prepackaged: parte de la app YA firmada; solo genera los artefactos finales.
electron-builder --mac dmg zip --config electron-builder.internal.yml \
  --prepackaged "$(pwd)/${APP_PATH}"

echo
echo "Artefactos firmados en ./release:"
ls -1 release/*.dmg release/*.zip 2>/dev/null || true
ls -1 release/latest-mac.yml 2>/dev/null || true
