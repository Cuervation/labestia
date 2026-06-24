# Assets — La Bestia

Esta carpeta documenta como usar assets del juego sin romper el proyecto mientras el arte final todavia no exista.

## Regla

- Los archivos finales pueden vivir en `public/assets/...`.
- Phaser debe referenciar keys desde `src/game/config/assets.ts`.
- Si un sprite no carga, la escena debe dibujar fallback simple con formas basicas.

## Placeholders actuales

Los placeholders viven en `public/assets/placeholders/` y sirven para:

- probar preload
- evitar errores durante desarrollo
- desacoplar gameplay del arte final

## Flujo recomendado

1. Agregar o reemplazar archivo real en `public/assets/...`
2. Mantener misma asset key en `src/game/config/assets.ts`
3. No hardcodear rutas dentro de escenas fuera del manifest
