# Architecture — La Bestia

Separación clara: React muestra UI, Phaser ejecuta juego, Firebase persiste, Zustand comparte estado simple.

## Carpetas

| Carpeta | Responsabilidad |
|---|---|
| `src/app` | Bootstrap React. |
| `src/pages` | Pantallas. |
| `src/components` | UI reusable. |
| `src/firebase` | Auth, Firestore, Hosting helpers. |
| `src/store` | Zustand. |
| `src/game` | Phaser. |
| `src/styles` | Estilos globales. |

## Phaser

| Carpeta | Uso |
|---|---|
| `config` | Configuración y constantes. |
| `scenes` | Escenas. |
| `entities` | Camioneta, autos, objetos. |
| `systems` | Score, combo, timer, spawns, colisiones. |
| `types` | Tipos de juego. |

## Reglas

- React no contiene lógica de gameplay.
- Phaser no importa Firebase.
- Firebase no se usa directo desde escenas.
- Balance configurable, no escondido en escenas.