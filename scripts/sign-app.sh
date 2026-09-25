#!/usr/bin/env bash
#
# Firma local (self-signed / ad hoc) del .app generado por electron-builder.
#
# Orden de firma correcto (sin --deep):
#   1. Binarios nativos sueltos (*.node, *.dylib) en app.asar.unpacked
#   2. Apps embebidas: SpeechHelper.app (Resources y asar.unpacked)
#   3. Helpers de Electron (Frameworks/*.app)
#   4. Frameworks (Electron Framework, Squirrel, Mantle, ReactiveObjC)
#      — binarios internos (Libraries/*.dylib, Resources/ShipIt) antes del bundle
#   5. Ejecutable principal + bundle de la app (con entitlements)
#
# Uso:
#   npm run build:local-sign
#   CERT_NAME="Ambient Copilot" npm run build:local-sign
#
set -euo pipefail

APP_PATH="${APP_PATH:-$(find release -type d -name '*.app' -path '*mac*' | head -n 1)}"
if [ -z "${APP_PATH}" ]; then
  echo "No se encontró la app generada en release/ (ejecuta antes: npm run build:internal)" >&2
  exit 1
fi
echo "Firmando: ${APP_PATH}"

CERT_NAME="${CERT_NAME:-Ambient Copilot}"
ENTITLEMENTS="${ENTITLEMENTS:-build/entitlements.mac.plist}"
ENTITLEMENTS_HELPER="${ENTITLEMENTS_HELPER:-build/entitlements.helper.mac.plist}"
ENTITLEMENTS_SPEECH="${ENTITLEMENTS_SPEECH:-build/entitlements.mac.plist}"
KEYCHAIN="${KEYCHAIN:-$HOME/Library/Keychains/login.keychain-db}"

# Resuelve la identidad: certificado self-signed si existe, si no ad hoc (-).
IDENTITY="-"
if security find-identity -v -p codesigning "$KEYCHAIN" 2>/dev/null | grep -q "$CERT_NAME"; then
  IDENTITY="$CERT_NAME"
  echo "Usando identidad local: ${IDENTITY}"
else
  echo "No se encontró '${CERT_NAME}' en el keychain; usando firma ad hoc (-)."
  echo "Para crearlo: npm run build:local-cert"
fi

is_macho() { file -b "$1" 2>/dev/null | grep -q 'Mach-O'; }

# Firma un único binario/bundle. En fallo con identidad real, reintenta ad hoc.
sig() {
  local target="$1"; shift
  local ok=0
  codesign --force --sign "$IDENTITY" --options runtime "$@" "$target" 2>/tmp/ambient-codesign.log || ok=1
  if [ "$ok" -ne 0 ] && [ "$IDENTITY" != "-" ]; then
    echo "  ! Falló con '${IDENTITY}' para ${target}; reintentando ad hoc" >&2
    cat /tmp/ambient-codesign.log >&2 || true
    codesign --force --sign - --options runtime "$@" "$target"
  elif [ "$ok" -ne 0 ]; then
    cat /tmp/ambient-codesign.log >&2
    exit 1
  fi
  echo "  ✓ $(basename "${target}")"
}

# Firma archivos Mach-O dentro de un directorio (más profundo primero).
sign_macho_in() {
  local dir="$1"; shift
  local f
  while IFS= read -r -d '' f; do
    if is_macho "$f"; then sig "$f" "$@"; fi
  done < <(find "$dir" -type f \( -perm -111 -o -name '*.dylib' -o -name '*.node' \) -print0 | sort -z)
}

echo "→ 1/5 Binarios nativos (*.node, *.dylib en app.asar.unpacked)"
sign_macho_in "$APP_PATH/Contents/Resources/app.asar.unpacked"

echo "→ 2/5 SpeechHelper.app (embebidas — binario con entitlements de audio, bundle completo)"
while IFS= read -r -d '' helper; do
  macos_bin="$(find "$helper/Contents/MacOS" -type f -perm -111 2>/dev/null | head -n 1)"
  if [ -n "$macos_bin" ] && is_macho "$macos_bin"; then
    if [ "$IDENTITY" != "-" ] && [ -f "$ENTITLEMENTS_SPEECH" ]; then
      sig "$macos_bin" --entitlements "$ENTITLEMENTS_SPEECH"
    else
      sig "$macos_bin"
    fi
  fi
  sig "$helper"
done < <(find "$APP_PATH" -type d -name 'SpeechHelper.app' -print0)

echo "→ 3/5 Helpers de Electron (con entitlements helper)"
helper_ent=()
if [ "$IDENTITY" != "-" ] && [ -f "$ENTITLEMENTS_HELPER" ]; then
  helper_ent+=(--entitlements "$ENTITLEMENTS_HELPER")
fi
while IFS= read -r -d '' helper; do
  macos_bin="$(find "$helper/Contents/MacOS" -type f -perm -111 2>/dev/null | head -n 1)"
  if [ -n "$macos_bin" ] && is_macho "$macos_bin"; then
    sig "$macos_bin" "${helper_ent[@]}"
  fi
  sig "$helper" "${helper_ent[@]}"
done < <(find "$APP_PATH/Contents/Frameworks" -maxdepth 1 -type d -name '*.app' -print0)

echo "→ 4/5 Frameworks (binarios internos → bundle)"
while IFS= read -r -d '' fw; do
  sign_macho_in "$fw"
  sig "$fw"
done < <(find "$APP_PATH/Contents/Frameworks" -maxdepth 1 -type d -name '*.framework' -print0)

echo "→ 5/5 App principal (ejecutable + bundle, con entitlements)"
ENT_ARGS=()
if [ -f "$ENTITLEMENTS" ]; then
  ENT_ARGS+=(--entitlements "$ENTITLEMENTS")
fi
main_bin="$(find "$APP_PATH/Contents/MacOS" -type f -perm -111 2>/dev/null | head -n 1)"
if [ -n "$main_bin" ] && is_macho "$main_bin"; then
  sig "$main_bin" "${ENT_ARGS[@]}"
fi
sig "$APP_PATH" "${ENT_ARGS[@]}"

echo "→ Verificación"
codesign --verify --deep --strict "$APP_PATH" && echo "  ✓ codesign --verify OK"
codesign -dv --verbose=2 "$APP_PATH" 2>&1 | sed 's/^/  /' || true

echo " Entitlements embebidos:"
if [ -f "$ENTITLEMENTS" ]; then
  codesign -d --entitlements :- "$APP_PATH" 2>/dev/null \
    | plutil -p - 2>/dev/null | sed 's/^/ /' || true
fi

# Quita quarantine SOLO en la copia local (no afecta a los .zip/.dmg distribuidos).
xattr -dr com.apple.quarantine "$APP_PATH" 2>/dev/null || true

echo "Firma local completada: ${APP_PATH}"
