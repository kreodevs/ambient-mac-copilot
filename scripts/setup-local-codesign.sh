#!/usr/bin/env bash
set -euo pipefail

CERT_NAME="${CERT_NAME:-Ambient Copilot}"
CERT_DIR="${CERT_DIR:-$HOME/selfSignedCerts}"
CERT_KEY="$CERT_DIR/selfsigned.key"
CERT_CRT="$CERT_DIR/selfsigned.crt"
CERT_P12="$CERT_DIR/selfsigned.p12"
CERT_PASSWORD="${CERT_PASSWORD:-changeit}"
KEYCHAIN_PATH="${KEYCHAIN_PATH:-$HOME/Library/Keychains/login.keychain-db}"

mkdir -p "$CERT_DIR"

if ! security find-identity -v -p codesigning "$KEYCHAIN_PATH" 2>/dev/null | grep -q "$CERT_NAME"; then
  echo "Creando certificado local '$CERT_NAME'..."

  openssl req -x509 -newkey rsa:2048 -sha256 -days 365 -nodes \
    -keyout "$CERT_KEY" \
    -out "$CERT_CRT" \
    -subj "/CN=$CERT_NAME" \
    -addext "basicConstraints=critical,CA:FALSE" \
    -addext "keyUsage=critical,digitalSignature,keyEncipherment" \
    -addext "extendedKeyUsage=codeSigning"

  openssl pkcs12 -export \
    -inkey "$CERT_KEY" \
    -in "$CERT_CRT" \
    -out "$CERT_P12" \
    -password "pass:$CERT_PASSWORD"

  security unlock-keychain "$KEYCHAIN_PATH"
  security import "$CERT_P12" \
    -k "$KEYCHAIN_PATH" \
    -P "$CERT_PASSWORD" \
    -T /usr/bin/codesign
fi

echo "Identidades disponibles para code signing:"
security find-identity -v -p codesigning "$KEYCHAIN_PATH"
