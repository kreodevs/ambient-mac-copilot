# Opciones de build para macOS

Este proyecto tiene dos caminos de distribución:

## 1) Build interno (default)

Se usa por defecto con:

```bash
npm run build
```

O también:

```bash
npm run build:internal
```

Qué hace:
- genera el artefacto para macOS con `electron-builder`
- usa `electron-builder.internal.yml`
- desactiva la firma (`sign: false`)
- no intenta notarizar con Apple
- es útil para pruebas internas y distribución cerrada

Caveat:
- macOS puede bloquear la app con “Está dañado” o “No se puede abrir”
- el usuario debe permitirla desde Ajustes > Privacidad y seguridad

## 2) Build profesional Apple

Se usa solo cuando tengas certificado Apple Developer:

```bash
npm run build:apple
```

O para publicar:

```bash
npm run release:mac
```

Qué hace:
- usa `electron-builder.yml`
- firma con el certificado Apple
- ejecuta la notarización en `build/notarize.js`
- es la opción válida para distribuir a usuarios finales

## Recomendación

- Mantén la opción interna como default mientras no tengas certificado Apple
- usa la opción Apple cuando quieras hacer release público o distribución amplia
