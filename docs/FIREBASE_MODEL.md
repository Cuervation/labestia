# Firebase Model — La Bestia

Firebase será usado para Auth, Firestore y Hosting.

## Colecciones previstas

### `users/{uid}`

- `uid`
- `displayName`
- `photoURL`
- `createdAt`
- `lastLoginAt`

### `scores/{scoreId}`

- `uid`
- `displayName`
- `score`
- `maxCombo`
- `durationSeconds`
- `createdAt`

### `leaderboard/{entryId}`

- `uid`
- `displayName`
- `bestScore`
- `maxCombo`
- `updatedAt`

Cada partida guarda una entrada nueva, así un mismo usuario puede aparecer varias veces.

## Regla inicial

Guardar partida al terminar. Agregar una entrada al leaderboard para que el ranking pueda mostrar varias partidas por usuario.
